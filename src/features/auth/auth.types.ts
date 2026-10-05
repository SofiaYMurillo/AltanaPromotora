import type { InternalAccessReason } from "@/domain";
import type { Role } from "@/types/role";

export type AuthRoleName = "admin" | "worker" | "client";

export type { InternalAccessReason };

export type InternalAccessDecision = {
  allowed: boolean;
  reason: InternalAccessReason;
  userId?: string;
  roleNames: AuthRoleName[];
  isPrincipalAdmin: boolean;
};

/** @deprecated Prefer Role from persistence; kept for typed role-name helpers. */
export type AuthRoleList = Role[];
