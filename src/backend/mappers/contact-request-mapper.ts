import type { ContactRequest, ContactRequestStatus } from "@/domain";
import type { ContactRequest as ContactRequestRow } from "@/generated/prisma/client";

export function toDomainContactRequest(row: ContactRequestRow): ContactRequest {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    message: row.message,
    status: row.status as ContactRequestStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPrismaContactRequestData(request: ContactRequest) {
  return {
    id: request.id,
    name: request.name,
    email: request.email ?? null,
    phone: request.phone ?? null,
    message: request.message,
    status: request.status,
  };
}
