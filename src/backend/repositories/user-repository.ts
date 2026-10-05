import { prisma } from "../db";
import {
  getPrincipalAdminEmailAliases,
  getPrincipalAdminUserId,
} from "../config/auth-config";
import { toDomainUser } from "../mappers/user-mapper";

export async function findUserById(id: string) {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toDomainUser(row) : null;
}

export async function findUserByEmail(email: string) {
  const row = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  return row ? toDomainUser(row) : null;
}

/**
 * Login lookup: principal aliases (canonical Gmail + previous seed spelling)
 * resolve to the principal user even if the stored row still has the old email.
 */
export async function findUserForAuthentication(email: string) {
  const normalized = email.trim().toLowerCase();
  const aliases = getPrincipalAdminEmailAliases();

  if (aliases.includes(normalized)) {
    const principal = await findUserById(getPrincipalAdminUserId());
    if (principal) {
      return principal;
    }
  }

  return findUserByEmail(normalized);
}

export async function listUsers() {
  const rows = await prisma.user.findMany({ orderBy: { email: "asc" } });
  return rows.map(toDomainUser);
}

export async function getPasswordHash(userId: string) {
  const credential = await prisma.credential.findUnique({
    where: { userId },
  });
  return credential?.passwordHash ?? null;
}

export async function upsertCredential(userId: string, passwordHash: string) {
  return prisma.credential.upsert({
    where: { userId },
    create: { userId, passwordHash },
    update: { passwordHash },
  });
}

export async function createUser(input: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  active?: boolean;
}) {
  const row = await prisma.user.create({
    data: {
      id: input.id,
      email: input.email.trim().toLowerCase(),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      active: input.active ?? true,
    },
  });
  return toDomainUser(row);
}

export async function updateUserNames(
  userId: string,
  input: { firstName: string; lastName: string },
) {
  const row = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      updatedAt: new Date(),
    },
  });
  return toDomainUser(row);
}

export async function setUserActive(userId: string, active: boolean) {
  const row = await prisma.user.update({
    where: { id: userId },
    data: { active, updatedAt: new Date() },
  });
  return toDomainUser(row);
}

export async function deleteUserById(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}

export async function updateUserProfileMediaAsset(
  userId: string,
  profileMediaAssetId: string | null,
) {
  const row = await prisma.user.update({
    where: { id: userId },
    data: { profileMediaAssetId, updatedAt: new Date() },
  });
  return toDomainUser(row);
}

export async function assignUserRole(input: {
  id: string;
  userId: string;
  roleId: string;
}) {
  return prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: input.userId,
        roleId: input.roleId,
      },
    },
    create: {
      id: input.id,
      userId: input.userId,
      roleId: input.roleId,
    },
    update: {},
  });
}
