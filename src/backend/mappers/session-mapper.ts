import type { Session } from "@/types/session";
import type { Session as SessionRow } from "@/generated/prisma/client";

export function toDomainSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
