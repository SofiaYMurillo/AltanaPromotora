import { randomUUID } from "node:crypto";

import { canAccessAdmin, normalizeEmail } from "@/features/auth/access";

import {
  SESSION_TTL_MS,
  getPrincipalAdminUserId,
} from "../config/auth-config";
import * as roleRepository from "../repositories/role-repository";
import * as sessionRepository from "../repositories/session-repository";
import * as userRepository from "../repositories/user-repository";
import {
  clearLoginAttempts,
  getLoginThrottleStatus,
  registerFailedLoginAttempt,
} from "../security/login-rate-limit";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "../security/password";
import { recordSecurityEvent } from "./security-event-service";

import type { LoginResult } from "../authentication/types";

export type { LoginResult } from "../authentication/types";
export { resolveAuthenticationChallenge } from "../authentication/invitation-code-auth";
export { authenticateWithInvitationCode } from "../authentication/invitation-code-auth";
export { authenticateWithGoogleIdentity } from "./google-auth-service";

/**
 * Administrator password login only.
 * Workers/clients without Credential cannot authenticate here.
 */
export async function authenticateAdmin(input: {
  email: string;
  password: string;
  ipReference?: string;
  userAgentReference?: string;
}): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  const throttle = getLoginThrottleStatus(email, input.ipReference);

  if (throttle.blocked) {
    await recordSecurityEvent({
      type: "repeated_failed_login",
      severity: "high",
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

  const user = await userRepository.findUserForAuthentication(email);

  if (!user) {
    const attempt = registerFailedLoginAttempt(email, input.ipReference);
    await recordSecurityEvent({
      type: attempt.repeated ? "repeated_failed_login" : "login_failed",
      severity: attempt.repeated ? "high" : "medium",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: { reason: "user_not_found", attemptCount: attempt.count },
    });
    return { ok: false, error: "invalid_credentials" };
  }

  if (!user.active) {
    await recordSecurityEvent({
      type: "login_failed",
      severity: "medium",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: { reason: "inactive", userId: user.id },
    });
    return { ok: false, error: "inactive" };
  }

  const roles = await roleRepository.getRolesForUser(user.id);
  const access = canAccessAdmin({
    user,
    roles,
    principalAdminUserId: getPrincipalAdminUserId(),
  });

  // Password login is only for principal admin in this product model.
  if (!access.isPrincipalAdmin || !access.allowed) {
    registerFailedLoginAttempt(email, input.ipReference);
    await recordSecurityEvent({
      type: "unauthorized_admin_access",
      severity: "high",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: { reason: access.reason, userId: user.id },
    });
    return { ok: false, error: "unauthorized" };
  }

  const passwordHash = await userRepository.getPasswordHash(user.id);

  if (!passwordHash) {
    await recordSecurityEvent({
      type: "login_failed",
      severity: "high",
      emailAttempted: email,
      ipReference: input.ipReference,
      route: "/api/auth/login",
      success: false,
      metadata: { reason: "password_not_configured", userId: user.id },
    });
    return { ok: false, error: "password_not_configured" };
  }

  if (!verifyPassword(input.password, passwordHash)) {
    const attempt = registerFailedLoginAttempt(email, input.ipReference);
    await recordSecurityEvent({
      type: attempt.repeated ? "repeated_failed_login" : "login_failed",
      severity: attempt.repeated ? "critical" : "medium",
      emailAttempted: email,
      ipReference: input.ipReference,
      userAgentReference: input.userAgentReference,
      route: "/api/auth/login",
      success: false,
      metadata: { reason: "bad_password", attemptCount: attempt.count },
    });
    return { ok: false, error: "invalid_credentials" };
  }

  clearLoginAttempts(email, input.ipReference);

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sessionRepository.createSession({
    id: `session-${randomUUID()}`,
    userId: user.id,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  await recordSecurityEvent({
    type: "login_success",
    severity: "info",
    emailAttempted: email,
    ipReference: input.ipReference,
    userAgentReference: input.userAgentReference,
    route: "/api/auth/login",
    success: true,
    metadata: { userId: user.id },
  });

  return {
    ok: true,
    token,
    expiresAt,
    userId: user.id,
  };
}

export async function logoutByToken(token: string | undefined | null) {
  if (!token) {
    return { ok: true as const };
  }

  await sessionRepository.revokeSessionByTokenHash(hashSessionToken(token));
  return { ok: true as const };
}

const MIN_ADMIN_PASSWORD_LENGTH = 8;

export type ChangePrincipalAdminPasswordResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "invalid_current_password"
        | "password_too_short"
        | "password_unchanged"
        | "password_not_configured"
        | "unauthorized";
    };

/**
 * Principal administrator password rotation — server-only, never logs secrets.
 */
export async function changePrincipalAdminPassword(input: {
  userId: string;
  sessionId: string | null;
  currentPassword: string;
  newPassword: string;
}): Promise<ChangePrincipalAdminPasswordResult> {
  if (input.userId !== getPrincipalAdminUserId()) {
    return { ok: false, error: "unauthorized" };
  }

  const next = input.newPassword.trim();
  if (next.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return { ok: false, error: "password_too_short" };
  }

  if (next === input.currentPassword) {
    return { ok: false, error: "password_unchanged" };
  }

  const passwordHash = await userRepository.getPasswordHash(input.userId);
  if (!passwordHash) {
    return { ok: false, error: "password_not_configured" };
  }

  if (!verifyPassword(input.currentPassword, passwordHash)) {
    await recordSecurityEvent({
      type: "login_failed",
      severity: "medium",
      source: "admin_panel",
      route: "/api/admin/profile/password",
      success: false,
      metadata: { reason: "bad_current_password", userId: input.userId },
    });
    return { ok: false, error: "invalid_current_password" };
  }

  await userRepository.upsertCredential(input.userId, hashPassword(next));
  await sessionRepository.revokeOtherSessionsForUser(
    input.userId,
    input.sessionId,
  );

  await recordSecurityEvent({
    type: "admin_access_granted",
    severity: "info",
    source: "admin_panel",
    route: "/api/admin/profile/password",
    success: true,
    metadata: { userId: input.userId, action: "password_changed" },
  });

  return { ok: true };
}
