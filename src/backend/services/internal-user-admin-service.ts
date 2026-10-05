import { permissionNameSet } from "@/config/permission.data";
import type { AuditActor } from "@/domain";

import { getPrincipalAdminUserId } from "../config/auth-config";
import * as roleRepository from "../repositories/role-repository";
import * as userPermissionRepository from "../repositories/user-permission-repository";
import * as userRepository from "../repositories/user-repository";
import { recordAuditEntry } from "./audit-service";

const INTERNAL_ROLE_IDS = new Set(["role-admin", "role-worker"]);

export type InternalUserAdminError =
  | "not_found"
  | "forbidden"
  | "principal_admin"
  | "self_delete"
  | "self_deactivate"
  | "self_revoke"
  | "not_internal_user"
  | "invalid_permissions";

const ASSIGNABLE_PERMISSION_FILTER = (name: string) =>
  !name.startsWith("users.") && name !== "appointments.create";

async function assertManageableInternalUser(userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    return { ok: false as const, error: "not_found" as const };
  }

  const roles = await roleRepository.getRolesForUser(userId);
  const isInternal = roles.some((role) => INTERNAL_ROLE_IDS.has(role.id));
  if (!isInternal) {
    return { ok: false as const, error: "not_internal_user" as const };
  }

  return { ok: true as const, user };
}

function isPrincipalUser(userId: string) {
  return userId === getPrincipalAdminUserId();
}

export async function setInternalUserActive(input: {
  userId: string;
  active: boolean;
  actorUserId: string;
  actor?: AuditActor;
}) {
  if (isPrincipalUser(input.userId) && !input.active) {
    return { ok: false as const, error: "principal_admin" as const };
  }

  if (input.userId === input.actorUserId && !input.active) {
    return { ok: false as const, error: "self_deactivate" as const };
  }

  const check = await assertManageableInternalUser(input.userId);
  if (!check.ok) {
    return check;
  }

  const updated = await userRepository.setUserActive(input.userId, input.active);

  if (input.actor) {
    await recordAuditEntry({
      actor: input.actor,
      action: "status_changed",
      entityType: "user",
      entityId: updated.id,
      entityLabel: `${updated.firstName} ${updated.lastName}`.trim() || updated.email,
      metadata: { active: updated.active },
    });
  }

  return { ok: true as const, user: updated };
}

export async function deleteInternalUser(input: {
  userId: string;
  actorUserId: string;
  actor?: AuditActor;
}) {
  if (isPrincipalUser(input.userId)) {
    return { ok: false as const, error: "principal_admin" as const };
  }

  if (input.userId === input.actorUserId) {
    return { ok: false as const, error: "self_delete" as const };
  }

  const check = await assertManageableInternalUser(input.userId);
  if (!check.ok) {
    return check;
  }

  const label =
    `${check.user.firstName} ${check.user.lastName}`.trim() || check.user.email;

  await userRepository.deleteUserById(input.userId);

  if (input.actor) {
    await recordAuditEntry({
      actor: input.actor,
      action: "deleted",
      entityType: "user",
      entityId: input.userId,
      entityLabel: label,
      metadata: { email: check.user.email },
    });
  }

  return { ok: true as const };
}

export async function revokeInternalUserPrivileges(input: {
  userId: string;
  actorUserId: string;
  actor?: AuditActor;
}) {
  if (isPrincipalUser(input.userId)) {
    return { ok: false as const, error: "principal_admin" as const };
  }

  if (input.userId === input.actorUserId) {
    return { ok: false as const, error: "self_revoke" as const };
  }

  const check = await assertManageableInternalUser(input.userId);
  if (!check.ok) {
    return check;
  }

  const now = new Date();
  const { prisma } = await import("../db");

  await prisma.userRole.deleteMany({
    where: { userId: input.userId, roleId: "role-admin" },
  });

  const hasWorker = await roleRepository.userHasRole(input.userId, "role-worker");
  if (!hasWorker) {
    await prisma.userRole.create({
      data: {
        id: `user-role-revoked-${input.userId}`,
        userId: input.userId,
        roleId: "role-worker",
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  await userPermissionRepository.replaceUserPermissions({
    userId: input.userId,
    permissionNames: [],
  });

  if (input.actor) {
    await recordAuditEntry({
      actor: input.actor,
      action: "updated",
      entityType: "user",
      entityId: input.userId,
      entityLabel: check.user.email,
      metadata: { revokedPrivileges: true },
    });
  }

  return { ok: true as const, user: check.user };
}

export async function updateInternalUserPermissions(input: {
  userId: string;
  permissionNames: string[];
  actor?: AuditActor;
}) {
  if (isPrincipalUser(input.userId)) {
    return { ok: false as const, error: "principal_admin" as const };
  }

  const check = await assertManageableInternalUser(input.userId);
  if (!check.ok) {
    return check;
  }

  const unique = [...new Set(input.permissionNames.map((name) => name.trim()))];
  if (unique.some((name) => !permissionNameSet.has(name))) {
    return { ok: false as const, error: "invalid_permissions" as const };
  }

  const assignable = unique.filter(ASSIGNABLE_PERMISSION_FILTER);
  await userPermissionRepository.replaceUserPermissions({
    userId: input.userId,
    permissionNames: assignable,
  });

  if (input.actor) {
    await recordAuditEntry({
      actor: input.actor,
      action: "updated",
      entityType: "user",
      entityId: input.userId,
      entityLabel: check.user.email,
      metadata: { permissionNames: assignable },
    });
  }

  return { ok: true as const, permissionNames: assignable };
}
