import { randomUUID } from "node:crypto";

import { normalizeEmail } from "@/features/auth/access";

import {
  getInitialAdminEmail,
  getInitialAdminPassword,
  getPrincipalAdminUserId,
} from "../config/auth-config";
import { hashPassword, verifyPassword } from "../security/password";

import type { PrismaClient } from "../../generated/prisma/client";

const ADMIN_ROLE_ID = "role-admin";

/**
 * Idempotent bootstrap for the first real administrator (email + password from env).
 * Does not overwrite an existing credential hash on subsequent runs.
 */
export async function ensureInitialAdministrator(
  prisma: PrismaClient,
): Promise<string | null> {
  const emailRaw = getInitialAdminEmail();
  if (!emailRaw) {
    return null;
  }

  const password = getInitialAdminPassword();
  if (!password) {
    throw new Error(
      "ALTANA_INITIAL_ADMIN_PASSWORD is required when ALTANA_INITIAL_ADMIN_EMAIL is set.",
    );
  }

  const email = normalizeEmail(emailRaw);
  const principalAdminUserId = getPrincipalAdminUserId();
  const now = new Date();

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  let userId: string;

  if (existingByEmail) {
    userId = existingByEmail.id;
    if (!existingByEmail.active) {
      await prisma.user.update({
        where: { id: userId },
        data: { active: true, updatedAt: now },
      });
    }
  } else {
    userId = principalAdminUserId;
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        firstName:
          process.env.ALTANA_INITIAL_ADMIN_FIRST_NAME?.trim() || "Administrador",
        lastName:
          process.env.ALTANA_INITIAL_ADMIN_LAST_NAME?.trim() || "ALTANA",
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        email,
        active: true,
        updatedAt: now,
      },
    });
  }

  const adminRoleAssignment = await prisma.userRole.findFirst({
    where: { userId, roleId: ADMIN_ROLE_ID },
  });

  if (!adminRoleAssignment) {
    await prisma.userRole.create({
      data: {
        id: `user-role-${randomUUID()}`,
        userId,
        roleId: ADMIN_ROLE_ID,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  const existingCredential = await prisma.credential.findUnique({
    where: { userId },
  });

  const applyPassword =
    process.env.ALTANA_INITIAL_ADMIN_APPLY_PASSWORD?.trim() === "true";

  if (!existingCredential) {
    await prisma.credential.create({
      data: {
        userId,
        passwordHash: hashPassword(password),
        updatedAt: now,
      },
    });
  } else if (
    applyPassword &&
    !verifyPassword(password, existingCredential.passwordHash)
  ) {
    await prisma.credential.update({
      where: { userId },
      data: {
        passwordHash: hashPassword(password),
        updatedAt: now,
      },
    });
  }

  if (userId !== principalAdminUserId) {
    console.warn(
      `Initial administrator user id=${userId} does not match PRINCIPAL_ADMIN_USER_ID=${principalAdminUserId}. Set PRINCIPAL_ADMIN_USER_ID to this id for password login.`,
    );
  }

  const credentialAction = !existingCredential
    ? "created"
    : applyPassword &&
        !verifyPassword(password, existingCredential.passwordHash)
      ? "password_updated"
      : "unchanged";

  console.log(
    `Initial administrator ensured for email=${email} (user id=${userId}, credential ${credentialAction}).`,
  );

  return userId;
}
