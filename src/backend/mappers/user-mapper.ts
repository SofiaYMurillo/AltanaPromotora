import type { User } from "@/types/user";
import type { User as UserRow } from "@/generated/prisma/client";

export function toDomainUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone ?? undefined,
    profileMediaAssetId: row.profileMediaAssetId,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
