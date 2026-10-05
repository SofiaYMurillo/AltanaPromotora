import type { PrismaClient } from "../../generated/prisma/client";

import {
  getAdminSeedPassword,
  getPrincipalAdminEmail,
  getPrincipalAdminUserId,
} from "../config/auth-config";
import { hashPassword } from "../security/password";

const ADMIN_ROLE_ID = "role-admin";
const WORKER_ROLE_ID = "role-worker";

/**
 * Keeps the principal admin row aligned with config/env
 * and ensures it can sign in (admin role + password credential).
 */
export async function syncPrincipalAdminIdentity(
  client: PrismaClient,
): Promise<void> {
  const principalId = getPrincipalAdminUserId();
  const canonical = getPrincipalAdminEmail();
  const now = new Date();

  let user = await client.user.findUnique({ where: { id: principalId } });
  const taken = await client.user.findUnique({ where: { email: canonical } });

  if (!user && taken) {
    user = taken;
  }

  if (!user) {
    await client.user.create({
      data: {
        id: principalId,
        email: canonical,
        firstName: "ALTANA",
        lastName: "Practicantes",
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  } else {
    const nextName =
      user.firstName !== "ALTANA" || user.lastName !== "Practicantes"
        ? { firstName: "ALTANA", lastName: "Practicantes" }
        : {};

    if (!user.active || Object.keys(nextName).length > 0) {
      await client.user.update({
        where: { id: user.id },
        data: { ...nextName, active: true, updatedAt: now },
      });
    }

    if (user.email !== canonical) {
      if (taken && taken.id !== user.id) {
        console.warn(
          `Principal admin email ${canonical} is already used by user id=${taken.id}; left ${user.id} as ${user.email}.`,
        );
      } else {
        await client.user.update({
          where: { id: user.id },
          data: { email: canonical, updatedAt: now },
        });
      }
    }
  }

  const resolvedId = user?.id ?? principalId;

  const hasAdmin = await client.userRole.findFirst({
    where: { userId: resolvedId, roleId: ADMIN_ROLE_ID },
  });
  if (!hasAdmin) {
    await client.userRole.create({
      data: {
        id: `user-role-${resolvedId}-${ADMIN_ROLE_ID}`,
        userId: resolvedId,
        roleId: ADMIN_ROLE_ID,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  await client.userRole.deleteMany({
    where: { userId: resolvedId, roleId: WORKER_ROLE_ID },
  });

  const credential = await client.credential.findUnique({
    where: { userId: resolvedId },
  });
  if (!credential) {
    const previous = await client.credential.findUnique({
      where: { userId: "user-001" },
    });
    await client.credential.create({
      data: {
        userId: resolvedId,
        passwordHash: previous?.passwordHash ?? hashPassword(getAdminSeedPassword()),
        updatedAt: now,
      },
    });
  }
}
