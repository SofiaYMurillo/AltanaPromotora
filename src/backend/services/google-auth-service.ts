import { randomUUID } from "node:crypto";

import { canAccessAdmin, normalizeEmail } from "@/features/auth/access";

import { finalizeInvitedWorkerSession } from "../authentication/invitation-code-auth";
import type { LoginResult } from "../authentication/types";
import { ensureGoogleAuthorizedIdentities } from "../bootstrap/ensure-google-authorized-identities";
import {
  SESSION_TTL_MS,
  getPrincipalAdminUserId,
  isGoogleAuthorizedEmail,
} from "../config/auth-config";
import { prisma } from "../db";
import * as roleRepository from "../repositories/role-repository";
import * as sessionRepository from "../repositories/session-repository";
import * as userRepository from "../repositories/user-repository";
import * as workerInvitationRepository from "../repositories/worker-invitation-repository";
import {
  clearLoginAttempts,
  getLoginThrottleStatus,
  registerFailedLoginAttempt,
} from "../security/login-rate-limit";
import { createSessionToken, hashSessionToken } from "../security/password";
import { evaluateInvitationForAuth } from "./worker-invitation-service";
import { recordSecurityEvent } from "./security-event-service";

const GOOGLE_ROUTE = "/api/auth/google/callback";

async function issueSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sessionRepository.createSession({
    id: `session-${randomUUID()}`,
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  return { token, expiresAt, userId };
}

/**
 * Google only proves mailbox ownership. ALTANA still authorizes:
 * principal admin, existing active worker, or a valid invitation.
 */
export async function authenticateWithGoogleIdentity(input: {
  email: string;
  emailVerified: boolean;
  ipReference?: string;
  userAgentReference?: string;
}): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  const throttle = getLoginThrottleStatus(email, input.ipReference);

  if (throttle.blocked) {
    await recordSecurityEvent({
      type: "repeated_failed_login",
      severity: "high",
      source: "admin_panel",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: GOOGLE_ROUTE,
      success: false,
      metadata: { reason: "rate_limited", method: "google_oauth" },
    });

    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: throttle.retryAfterSeconds,
    };
  }

  if (!input.emailVerified) {
    registerFailedLoginAttempt(email, input.ipReference);
    await recordSecurityEvent({
      type: "login_failed",
      severity: "medium",
      source: "admin_panel",
      emailAttempted: email,
      route: GOOGLE_ROUTE,
      success: false,
      metadata: { reason: "email_not_verified", method: "google_oauth" },
    });
    return { ok: false, error: "unauthorized" };
  }

  if (isGoogleAuthorizedEmail(email)) {
    await ensureGoogleAuthorizedIdentities(prisma);
  }

  const principalId = getPrincipalAdminUserId();
  const user = await userRepository.findUserForAuthentication(email);

  if (user?.id === principalId) {
    const roles = await roleRepository.getRolesForUser(user.id);
    const access = canAccessAdmin({
      user,
      roles,
      principalAdminUserId: principalId,
    });

    if (access.allowed && access.isPrincipalAdmin) {
      clearLoginAttempts(email, input.ipReference);
      const session = await issueSession(user.id);
      await recordSecurityEvent({
        type: "login_success",
        severity: "info",
        source: "admin_panel",
        emailAttempted: email,
        ipReference: input.ipReference,
        userAgentReference: input.userAgentReference,
        route: GOOGLE_ROUTE,
        success: true,
        metadata: { userId: user.id, method: "google_oauth" },
      });
      return { ok: true, ...session };
    }
  }

  if (user && !user.active) {
    await recordSecurityEvent({
      type: "login_failed",
      severity: "medium",
      source: "admin_panel",
      emailAttempted: email,
      route: GOOGLE_ROUTE,
      success: false,
      metadata: { reason: "inactive", userId: user.id, method: "google_oauth" },
    });
    return { ok: false, error: "inactive" };
  }

  if (user) {
    const roles = await roleRepository.getRolesForUser(user.id);
    const access = canAccessAdmin({
      user,
      roles,
      principalAdminUserId: principalId,
    });

    if (access.allowed) {
      clearLoginAttempts(email, input.ipReference);
      const session = await issueSession(user.id);
      await recordSecurityEvent({
        type: "login_success",
        severity: "info",
        source: "worker_auth",
        emailAttempted: email,
        ipReference: input.ipReference,
        userAgentReference: input.userAgentReference,
        route: GOOGLE_ROUTE,
        success: true,
        metadata: { userId: user.id, method: "google_oauth" },
      });
      return { ok: true, ...session };
    }
  }

  const invitationRecord =
    await workerInvitationRepository.findActiveInvitationForEmail(email);

  if (invitationRecord) {
    const hasWorkerRole = user
      ? await roleRepository.userHasRole(user.id, invitationRecord.domain.roleId)
      : false;

    const evaluation = evaluateInvitationForAuth({
      invitation: invitationRecord.domain,
      email,
      allowUsedForReauth: hasWorkerRole,
    });

    if (evaluation.allowed) {
      return finalizeInvitedWorkerSession({
        email,
        invitationRecord,
        existingUser: user,
        hasWorkerRole,
        ipReference: input.ipReference,
        userAgentReference: input.userAgentReference,
        method: "google_oauth",
      });
    }

    if (evaluation.reason === "revoked" || evaluation.reason === "expired") {
      return { ok: false, error: evaluation.reason };
    }
  }

  registerFailedLoginAttempt(email, input.ipReference);
  await recordSecurityEvent({
    type: "unauthorized_admin_access",
    severity: "medium",
    source: "admin_panel",
    emailAttempted: email,
    ipReference: input.ipReference,
    userAgentReference: input.userAgentReference,
    route: GOOGLE_ROUTE,
    success: false,
    metadata: { reason: "not_allowlisted", method: "google_oauth" },
  });

  return { ok: false, error: "unauthorized" };
}
