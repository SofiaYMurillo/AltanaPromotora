import { prisma } from "../db";

export async function listPermissionNamesForUser(userId: string) {
  const rows = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  });

  return rows.map((row) => row.permission.name);
}

export async function replaceUserPermissions(input: {
  userId: string;
  permissionNames: string[];
}) {
  const uniqueNames = [...new Set(input.permissionNames)];
  const permissions = await prisma.permission.findMany({
    where: { name: { in: uniqueNames } },
  });

  await prisma.userPermission.deleteMany({ where: { userId: input.userId } });

  if (permissions.length === 0) {
    return;
  }

  await prisma.userPermission.createMany({
    data: permissions.map((permission) => ({
      id: `user-permission-${input.userId}-${permission.id}`,
      userId: input.userId,
      permissionId: permission.id,
    })),
  });
}

export async function grantUserPermissionsFromNames(input: {
  userId: string;
  permissionNames: string[];
}) {
  const uniqueNames = [...new Set(input.permissionNames)];
  if (uniqueNames.length === 0) {
    return;
  }

  const permissions = await prisma.permission.findMany({
    where: { name: { in: uniqueNames } },
  });

  for (const permission of permissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: input.userId,
          permissionId: permission.id,
        },
      },
      create: {
        id: `user-permission-${input.userId}-${permission.id}`,
        userId: input.userId,
        permissionId: permission.id,
      },
      update: {},
    });
  }
}
