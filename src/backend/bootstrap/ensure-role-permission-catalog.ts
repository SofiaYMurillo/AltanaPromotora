import { rolePermissions } from "@/config/role-permission.data";

import type { PrismaClient } from "../../generated/prisma/client";

export async function ensureRolePermissionCatalog(client: PrismaClient) {
  for (const assignment of rolePermissions) {
    await client.rolePermission.upsert({
      where: { id: assignment.id },
      create: {
        id: assignment.id,
        roleId: assignment.roleId,
        permissionId: assignment.permissionId,
        createdAt: new Date(assignment.createdAt),
        updatedAt: new Date(assignment.updatedAt),
      },
      update: {
        roleId: assignment.roleId,
        permissionId: assignment.permissionId,
        updatedAt: new Date(),
      },
    });
  }
}
