import { prisma } from "../db";
import { toDomainAccessRequest } from "../mappers/access-request-mapper";

export async function listAccessRequests() {
  const rows = await prisma.accessRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomainAccessRequest);
}

export async function findAccessRequestById(id: string) {
  const row = await prisma.accessRequest.findUnique({ where: { id } });
  return row ? toDomainAccessRequest(row) : null;
}

export async function findPendingAccessRequestByEmail(email: string) {
  const row = await prisma.accessRequest.findFirst({
    where: { email: email.trim().toLowerCase(), status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  return row ? toDomainAccessRequest(row) : null;
}

export async function createAccessRequest(input: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const row = await prisma.accessRequest.create({
    data: {
      id: input.id,
      email: input.email.trim().toLowerCase(),
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      status: "pending",
    },
  });

  return toDomainAccessRequest(row);
}

export async function updateAccessRequestDecision(input: {
  id: string;
  status: "approved" | "rejected";
  decidedByUserId: string;
  invitationId?: string;
}) {
  const row = await prisma.accessRequest.update({
    where: { id: input.id },
    data: {
      status: input.status,
      decidedByUserId: input.decidedByUserId,
      decidedAt: new Date(),
      invitationId: input.invitationId ?? null,
    },
  });

  return toDomainAccessRequest(row);
}
