import type { Client } from "@/domain";
import type { Client as ClientRow } from "@/generated/prisma/client";

export function toDomainClient(row: ClientRow): Client {
  return {
    id: row.id,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
