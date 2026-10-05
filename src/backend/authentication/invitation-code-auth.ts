import { randomUUID } from "node:crypto";

import { internalAccessPolicy } from "@/config/internal-access-policy.data";
import {
  securityEventTypeForInvitationDenial,
  securityEventTypeForWorkerCodeFailure,
} from "@/domain";
import {
  canAccessAdmin,
  getRoleNames,
  isWorker,
  normalizeEmail,
} from "@/features/auth/access";

import type { AuthenticationChallengeResult } from "../authentication/types";
import {
  SESSION_TTL_MS,
  getPrincipalAdminUserId,
} from "../config/auth-config";
import * as roleRepository from "../repositories/role-repository";
import * as userPermissionRepository from "../repositories/user-permission-repository";
import * as sessionRepository from "../repositories/session-repository";
import * as userRepository from "../repositories/user-repository";
import * as workerInvitationRepository from "../repositories/worker-invitation-repository";
import {
  clearLoginAttempts,
  getLoginThrottleStatus,
  registerFailedLoginAttempt,
} from "../security/login-rate-limit";
import { verifyInvitationCode } from "../security/invitation-code";
import {
  createSessionToken,
  hashSessionToken,
} from "../security/password";
import { evaluateInvitationForAuth } from "../services/worker-invitation-service";
import { recordSecurityEvent } from "../services/security-event-service";

import type { LoginResult } from "../authentication/types";

/**
 * Backend resolves which authentication method applies — never the frontend.
 */
export async function resolveAuthenticationChallenge(
  email: string,
): Promise<AuthenticationChallengeResult> {
  const normalized = normalizeEmail(email);
  const principalId = getPrincipalAdminUserId();
  const user = await userRepository.findUserForAuthentication(normalized);

  if (user?.id === principalId) {
    const roles = await roleRepository.getRolesForUser(user.id);
    const access = canAccessAdmin({
      user,
      roles,
      principalAdminUserId: principalId,
    });

    if (access.allowed && access.isPrincipalAdmin) {
      return { method: "password", email: normalized };
    }
  }

  if (user && !user.active) {
    return { method: "unsupported", email: normalized, reason: "not_allowed" };
  }

  if (user) {
    const roles = await roleRepository.getRolesForUser(user.id);
    const roleNames = getRoleNames(roles);

    if (roleNames.includes("client") && !isWorker(roles)) {
      return { method: "unsupported", email: normalized, reason: "not_allowed" };
    }
  }

  const invitation =
    await workerInvitationRepository.findActiveInvitationForEmail(normalized);

  if (invitation) {
    const hasWorkerRole = user
      ? await roleRepository.userHasRole(user.id, invitation.domain.roleId)
      : false;

    const evaluation = evaluateInvitationForAuth({
      invitation: invitation.domain,
      email: normalized,
      allowUsedForReauth: hasWorkerRole,
    });

    if (evaluation.allowed) {
      return { method: "invitation_code", email: normalized };
    }
  }

  // Opaque denial — do not distinguish missing user / expired invite / worker without code.
  return { method: "unsupported", email: normalized, reason: "not_allowed" };
}

export async function authenticateWithInvitationCode(input: {
  email: string;
  code: string;
  ipReference?: string;
  userAgentReference?: string;
}): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  const throttle = getLoginThrottleStatus(email, input.ipReference);

  if (throttle.blocked) {
    await recordSecurityEvent({
      type: "repeated_failed_worker_code",
      severity: "high",
      source: "worker_auth",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: { reason: "rate_limited" },
    });

    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: throttle.retryAfterSeconds,
    };
  }

  const invitationRecord =
    await workerInvitationRepository.findActiveInvitationForEmail(email);

  if (!invitationRecord) {
    const attempt = registerFailedLoginAttempt(email, input.ipReference);
    await recordSecurityEvent({
      type: securityEventTypeForWorkerCodeFailure("not_found", attempt.repeated),
      severity: attempt.repeated ? "high" : "medium",
      source: "worker_auth",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: { reason: "not_found", attemptCount: attempt.count },
    });
    return { ok: false, error: "invalid_credentials" };
  }

  const existingUser = await userRepository.findUserByEmail(email);
  const hasWorkerRole = existingUser
    ? await roleRepository.userHasRole(
        existingUser.id,
        invitationRecord.domain.roleId,
      )
    : false;

  const evaluation = evaluateInvitationForAuth({
    invitation: invitationRecord.domain,
    email,
    allowUsedForReauth: hasWorkerRole,
  });

  if (!evaluation.allowed) {
    const attempt = registerFailedLoginAttempt(email, input.ipReference);
    const eventType =
      securityEventTypeForInvitationDenial(evaluation.reason) ??
      securityEventTypeForWorkerCodeFailure(evaluation.reason, attempt.repeated);

    await recordSecurityEvent({
      type: eventType,
      severity: attempt.repeated ? "high" : "medium",
      source: "worker_auth",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: {
        reason: evaluation.reason,
        invitationId: evaluation.invitationId,
        attemptCount: attempt.count,
      },
    });

    if (evaluation.reason === "revoked" || evaluation.reason === "expired") {
      return { ok: false, error: evaluation.reason };
    }

    return { ok: false, error: "invalid_credentials" };
  }

  if (!verifyInvitationCode(input.code, invitationRecord.codeHash)) {
    const attempt = registerFailedLoginAttempt(email, input.ipReference);
    await recordSecurityEvent({
      type: securityEventTypeForWorkerCodeFailure("token_mismatch", attempt.repeated),
      severity: attempt.repeated ? "high" : "medium",
      source: "worker_auth",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: {
        reason: "bad_code",
        invitationId: invitationRecord.domain.id,
        attemptCount: attempt.count,
      },
    });
    return { ok: false, error: "invalid_credentials" };
  }

  return finalizeInvitedWorkerSession({
    email,
    invitationRecord,
    existingUser,
    hasWorkerRole,
    ipReference: input.ipReference,
    userAgentReference: input.userAgentReference,
    method: "invitation_code",
  });
}

export async function finalizeInvitedWorkerSession(input: {
  email: string;
  invitationRecord: NonNullable<
    Awaited<
      ReturnType<typeof workerInvitationRepository.findActiveInvitationForEmail>
    >
  >;
  existingUser: Awaited<ReturnType<typeof userRepository.findUserByEmail>>;
  hasWorkerRole: boolean;
  ipReference?: string;
  userAgentReference?: string;
  method: "invitation_code" | "google_oauth";
}): Promise<LoginResult> {
  const {
    email,
    invitationRecord,
    hasWorkerRole,
    ipReference,
    userAgentReference,
    method,
  } = input;
  const route =
    method === "google_oauth" ? "/api/auth/google/callback" : "/api/auth/login";
  let user = input.existingUser;

  if (user) {
    const roles = await roleRepository.getRolesForUser(user.id);
    const roleNames = getRoleNames(roles);

    if (roleNames.includes("client") && !isWorker(roles)) {
      await recordSecurityEvent({
        type: "unauthorized_worker_access",
        severity: "high",
        source: "worker_auth",
        emailAttempted: email,
        ipReference,
        route,
        success: false,
        metadata: { reason: "client_account", userId: user.id, method },
      });
      return { ok: false, error: "unauthorized" };
    }

    if (user.id === getPrincipalAdminUserId()) {
      await recordSecurityEvent({
        type: "unauthorized_worker_access",
        severity: "high",
        source: "worker_auth",
        emailAttempted: email,
        route,
        success: false,
        metadata: { reason: "principal_admin", userId: user.id, method },
      });
      return { ok: false, error: "unauthorized" };
    }
  } else {
    const localPart = email.split("@")[0] ?? "Trabajador";
    const [derivedFirst, ...derivedRest] = localPart.split(/[._-]/);
    const invitationFirst = invitationRecord.domain.firstName?.trim();
    const invitationLast = invitationRecord.domain.lastName?.trim();
    user = await userRepository.createUser({
      id: `user-${randomUUID()}`,
      email,
      firstName:
        invitationFirst ||
        (derivedFirst
          ? derivedFirst.charAt(0).toUpperCase() + derivedFirst.slice(1)
          : "Trabajador"),
      lastName:
        invitationLast ||
        (derivedRest.length
          ? derivedRest.join(" ").charAt(0).toUpperCase() +
            derivedRest.join(" ").slice(1)
          : "Altana"),
      active: true,
    });
  }

  if (!user.active) {
    await recordSecurityEvent({
      type: "unauthorized_worker_access",
      severity: "medium",
      source: "worker_auth",
      emailAttempted: email,
      route,
      success: false,
      metadata: { reason: "inactive", userId: user.id, method },
    });
    return { ok: false, error: "inactive" };
  }

  const role = await roleRepository.findRoleById(
    invitationRecord.domain.roleId,
  );

  if (!role || role.name !== "worker") {
    await recordSecurityEvent({
      type: "unauthorized_worker_access",
      severity: "high",
      source: "worker_auth",
      emailAttempted: email,
      route,
      success: false,
      metadata: {
        reason: "invalid_role",
        roleId: invitationRecord.domain.roleId,
        method,
      },
    });
    return { ok: false, error: "unauthorized" };
  }

  if (!(await roleRepository.userHasRole(user.id, role.id))) {
    await userRepository.assignUserRole({
      id: `user-role-${randomUUID()}`,
      userId: user.id,
      roleId: role.id,
    });
  }

  const roles = await roleRepository.getRolesForUser(user.id);
  const access = canAccessAdmin({
    user,
    roles,
    principalAdminUserId: getPrincipalAdminUserId(),
  });

  if (!access.allowed || !isWorker(roles)) {
    await recordSecurityEvent({
      type: "unauthorized_worker_access",
      severity: "high",
      source: "worker_auth",
      emailAttempted: email,
      route,
      success: false,
      metadata: { reason: access.reason, userId: user.id, method },
    });
    return { ok: false, error: "unauthorized" };
  }

  const firstAccess =
    !hasWorkerRole && !invitationRecord.domain.usedAt;

  if (firstAccess) {
    await userPermissionRepository.grantUserPermissionsFromNames({
      userId: user.id,
      permissionNames: invitationRecord.domain.grantedPermissionNames ?? [],
    });

    await workerInvitationRepository.markWorkerInvitationUsed(
      invitationRecord.domain.id,
      new Date(),
    );
  }

  clearLoginAttempts(email, ipReference);

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sessionRepository.createSession({
    id: `session-${randomUUID()}`,
    userId: user.id,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  await recordSecurityEvent({
    type: "worker_code_success",
    severity: "info",
    source: "worker_auth",
    emailAttempted: email,
    ipReference,
    userAgentReference,
    route,
    success: true,
    metadata: {
      userId: user.id,
      invitationId: invitationRecord.domain.id,
      policy: internalAccessPolicy.workerAuthenticationMethod,
      firstAccess,
      method,
    },
  });

  return {
    ok: true,
    token,
    expiresAt,
    userId: user.id,
  };
}
