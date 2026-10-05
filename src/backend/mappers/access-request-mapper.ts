import type { AccessRequest as AccessRequestRow } from "@/generated/prisma/client";
import type { AccessRequest } from "@/domain";
import { isAccessRequestStatus } from "@/domain";

export function toDomainAccessRequest(row: AccessRequestRow): AccessRequest {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    status: isAccessRequestStatus(row.status) ? row.status : "pending",
    invitationId: row.invitationId ?? undefined,
    decidedByUserId: row.decidedByUserId ?? undefined,
    decidedAt: row.decidedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
