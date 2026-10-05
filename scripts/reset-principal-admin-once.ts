/**
 * One-off local recovery: set principal admin email + password in SQLite.
 * Usage (do not commit passwords):
 *   npx tsx scripts/reset-principal-admin-once.ts <email> <password>
 */
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { resolveDatabaseUrl } from "../src/backend/db-url";
import { hashPassword } from "../src/backend/security/password";
import { PrismaClient } from "../src/generated/prisma/client";

const emailRaw = process.argv[2];
const password = process.argv[3];

if (!emailRaw || !password) {
  console.error("Usage: npx tsx scripts/reset-principal-admin-once.ts <email> <password>");
  process.exit(1);
}

const email = emailRaw.trim().toLowerCase();
const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(process.env.DATABASE_URL ?? "file:./prisma/dev.db"),
});
const prisma = new PrismaClient({ adapter });
const now = new Date();
const principalId =
  process.env.PRINCIPAL_ADMIN_USER_ID?.trim() || "user-practicantes-001";

async function main() {
  const other = await prisma.user.findUnique({ where: { email } });
  if (other && other.id !== principalId) {
    await prisma.session.deleteMany({ where: { userId: other.id } });
    await prisma.credential.deleteMany({ where: { userId: other.id } });
    await prisma.userRole.deleteMany({ where: { userId: other.id } });
    await prisma.user.delete({ where: { id: other.id } });
    console.log(`Removed duplicate user ${other.id} for ${email}.`);
  }

  await prisma.user.update({
    where: { id: principalId },
    data: { email, active: true, updatedAt: now },
  });

  const adminRole = await prisma.userRole.findFirst({
    where: { userId: principalId, roleId: "role-admin" },
  });
  if (!adminRole) {
    await prisma.userRole.create({
      data: {
        id: "user-role-principal-admin",
        userId: principalId,
        roleId: "role-admin",
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  await prisma.credential.upsert({
    where: { userId: principalId },
    create: {
      userId: principalId,
      passwordHash: hashPassword(password),
      updatedAt: now,
    },
    update: {
      passwordHash: hashPassword(password),
      updatedAt: now,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: principalId },
    include: { userRoles: { include: { role: true } } },
  });

  console.log(
    `Principal admin restored: id=${user?.id} email=${user?.email} roles=${user?.userRoles.map((r) => r.role.name).join(",")}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
