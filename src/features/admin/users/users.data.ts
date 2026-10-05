import { permissions } from "@/config/permission.data";
import { listAccessRequests } from "@/backend/services/access-request-service";
import { listInvitations } from "@/backend/services/worker-invitation-service";
import * as roleRepository from "@/backend/repositories/role-repository";
import * as userPermissionRepository from "@/backend/repositories/user-permission-repository";
import * as userRepository from "@/backend/repositories/user-repository";

import type { AdminUserView, UsersPageData } from "./users.types";

/**
 * Admin users directory DTO. Phone is intentionally omitted — the panel does
 * not need it and credentials never leave the Credential table.
 */
export async function getUsersPageData(): Promise<UsersPageData> {
  const [users, roles, userRoleRows, invitations, accessRequests] =
    await Promise.all([
      userRepository.listUsers(),
      roleRepository.listRoles(),
      roleRepository.listUserRoles(),
      listInvitations(),
      listAccessRequests(),
    ]);

  const userRoles = userRoleRows.map((row) => ({
    id: row.id,
    userId: row.userId,
    roleId: row.roleId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  const adminUsers: AdminUserView[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  const assignablePermissions = permissions
    .filter(
      (permission) =>
        !permission.name.startsWith("users.") &&
        permission.name !== "appointments.create",
    )
    .map((permission) => ({
      name: permission.name,
      label: permission.label,
    }));

  const userPermissionNames: Record<string, string[]> = {};
  for (const user of adminUsers) {
    userPermissionNames[user.id] =
      await userPermissionRepository.listPermissionNamesForUser(user.id);
  }

  return {
    users: adminUsers,
    roles,
    userRoles,
    invitations,
    accessRequests,
    assignablePermissions,
    userPermissionNames,
  };
}
