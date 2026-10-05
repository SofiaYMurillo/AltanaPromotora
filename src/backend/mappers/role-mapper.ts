import type { Role } from "@/types/role";
import type { Role as RoleRow } from "@/generated/prisma/client";

export function toDomainRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
