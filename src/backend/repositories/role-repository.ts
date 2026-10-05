import { prisma } from "../db";
import { toDomainRole } from "../mappers/role-mapper";

export async function listRoles() {
  const rows = await prisma.role.findMany({ orderBy: { name: "asc" } });
  return rows.map(toDomainRole);
}

export async function getRolesForUser(userId: string) {
  const assignments = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  return assignments.map((assignment) => toDomainRole(assignment.role));
}

export async function listUserRoles() {
  return prisma.userRole.findMany();
}

export async function userHasPermission(
  userId: string,
  permissionName: string,
) {
  const direct = await prisma.userPermission.findFirst({
    where: {
      userId,
      permission: { name: permissionName },
    },
  });

  if (direct) {
    return true;
  }

  const match = await prisma.rolePermission.findFirst({
    where: {
      permission: { name: permissionName },
      role: {
        userRoles: {
          some: { userId },
        },
      },
    },
  });

  return Boolean(match);
}

export async function userHasRole(userId: string, roleId: string) {
  const match = await prisma.userRole.findFirst({
    where: { userId, roleId },
  });
  return Boolean(match);
}

export async function findRoleById(roleId: string) {
  const row = await prisma.role.findUnique({ where: { id: roleId } });
  return row ? toDomainRole(row) : null;
}
