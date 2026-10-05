import type { PrismaClient } from "../../generated/prisma/client";

import {
  getGoogleAuthorizedEmails,
  getPrincipalAdminEmail,
  googleAuthorizedUserId,
} from "../config/auth-config";

const ADMIN_ROLE_ID = "role-admin";
const WORKER_ROLE_ID = "role-worker";

function desiredRoleForGoogleEmail(email: string) {
  if (email === "altanapromotorapracticantes@gmail.com") {
    return ADMIN_ROLE_ID;
  }

  return WORKER_ROLE_ID;
}

/**
 * Ensures allowlisted Google emails exist as active internal users.
 * Google Cloud "test users" is not enough — ALTANA still needs a User + role.
 */
export async function ensureGoogleAuthorizedIdentities(
  client: PrismaClient,
): Promise<void> {
  const now = new Date();

  for (const email of getGoogleAuthorizedEmails()) {
    if (email === getPrincipalAdminEmail()) {
      continue;
    }
    const existing = await client.user.findUnique({ where: { email } });
    const userId = existing?.id ?? googleAuthorizedUserId(email);
    const desiredRoleId = desiredRoleForGoogleEmail(email);

    if (existing) {
      if (!existing.active) {
        await client.user.update({
          where: { id: existing.id },
          data: { active: true, updatedAt: now },
        });
      }
    } else {
      const local = email.split("@")[0] ?? "Practicante";
      await client.user.create({
        data: {
          id: userId,
          email,
          firstName:
            local === "altanapromotorapracticantes"
              ? "Practicante"
              : local.charAt(0).toUpperCase() + local.slice(1),
          lastName: "ALTANA",
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    const currentRoles = await client.userRole.findMany({
      where: { userId },
    });
    const hasDesiredRole = currentRoles.some(
      (assignment) => assignment.roleId === desiredRoleId,
    );

    if (!hasDesiredRole) {
      await client.userRole.create({
        data: {
          id: `user-role-${userId}-${desiredRoleId}`,
          userId,
          roleId: desiredRoleId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    if (desiredRoleId === ADMIN_ROLE_ID) {
      await client.userRole.deleteMany({
        where: { userId, roleId: WORKER_ROLE_ID },
      });
    }
  }
}
