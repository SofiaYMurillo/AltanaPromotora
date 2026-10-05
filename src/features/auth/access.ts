/**
 * Pure access helpers for identity decisions.
 *
 * Runtime authority is cookie → Prisma Session → User → Roles → canAccessAdmin
 * (see session-service / authorize-service). This module must not import
 * static user/role/session catalogs: those live in seed config only.
 */

import { PRINCIPAL_ADMIN_USER_ID } from "./auth.data";
import type { AuthRoleName, InternalAccessDecision } from "./auth.types";
import type { Role } from "@/types/role";
import type { User } from "@/types/user";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getRoleNames(roleList: Role[]): AuthRoleName[] {
  return roleList
    .map((role) => role.name)
    .filter(
      (name): name is AuthRoleName =>
        name === "admin" || name === "worker" || name === "client",
    );
}

/**
 * Default id matches seed principal. Server callers must pass
 * getPrincipalAdminUserId() so env overrides win.
 */
export function isPrincipalAdmin(
  userId: string | undefined,
  principalAdminUserId: string = PRINCIPAL_ADMIN_USER_ID,
) {
  return Boolean(userId) && userId === principalAdminUserId;
}

export function isWorker(roleList: Role[]) {
  return getRoleNames(roleList).includes("worker");
}

export function isClient(roleList: Role[]) {
  return getRoleNames(roleList).includes("client");
}

export function isSessionActive(
  session: { expiresAt: string },
  now: Date = new Date(),
) {
  return new Date(session.expiresAt).getTime() > now.getTime();
}

/**
 * Domain authorization for internal/admin surfaces.
 * Frontend helpers are provisional — backend session resolution is authoritative.
 */
export function canAccessAdmin(input: {
  user?: User | null;
  roles: Role[];
  principalAdminUserId?: string;
}): InternalAccessDecision {
  const principalAdminUserId =
    input.principalAdminUserId ?? PRINCIPAL_ADMIN_USER_ID;
  const { user, roles: roleList } = input;
  const roleNames = getRoleNames(roleList);
  const principal = isPrincipalAdmin(user?.id, principalAdminUserId);

  if (!user) {
    return {
      allowed: false,
      reason: "visitor",
      roleNames: [],
      isPrincipalAdmin: false,
    };
  }

  if (!user.active) {
    return {
      allowed: false,
      reason: "inactive",
      userId: user.id,
      roleNames,
      isPrincipalAdmin: principal,
    };
  }

  if (roleNames.includes("admin")) {
    return {
      allowed: true,
      reason: principal ? "allowed_principal_admin" : "allowed_admin",
      userId: user.id,
      roleNames,
      isPrincipalAdmin: principal,
    };
  }

  if (isWorker(roleList)) {
    return {
      allowed: true,
      reason: "allowed_worker",
      userId: user.id,
      roleNames,
      isPrincipalAdmin: false,
    };
  }

  if (isClient(roleList)) {
    return {
      allowed: false,
      reason: "client",
      userId: user.id,
      roleNames,
      isPrincipalAdmin: false,
    };
  }

  return {
    allowed: false,
    reason: "unauthorized",
    userId: user.id,
    roleNames,
    isPrincipalAdmin: false,
  };
}
