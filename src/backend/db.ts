import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

import { resolveDatabaseUrl } from "./db-url";

/**
 * Server-only Prisma client.
 * Presentation and domain must never import this module.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const url = resolveDatabaseUrl(
    process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  );
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

function canReuseGlobalPrisma(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) {
    return false;
  }
  // Hot reload can keep a pre-regenerate client missing newer model delegates.
  return typeof client.aboutTeamSection?.findUnique === "function";
}

export const prisma = canReuseGlobalPrisma(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
