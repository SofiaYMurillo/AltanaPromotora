import type { ContactRequest, ContactRequestStatus } from "@/domain";

import { prisma } from "../db";
import {
  toDomainContactRequest,
  toPrismaContactRequestData,
} from "../mappers/contact-request-mapper";

export async function listContactRequests(): Promise<ContactRequest[]> {
  const rows = await prisma.contactRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomainContactRequest);
}

export async function getContactRequestById(
  id: string,
): Promise<ContactRequest | null> {
  const row = await prisma.contactRequest.findUnique({ where: { id } });
  return row ? toDomainContactRequest(row) : null;
}

export async function createContactRequest(
  request: ContactRequest,
): Promise<ContactRequest> {
  const row = await prisma.contactRequest.create({
    data: toPrismaContactRequestData(request),
  });
  return toDomainContactRequest(row);
}

export async function updateContactRequestStatus(
  id: string,
  status: ContactRequestStatus,
): Promise<ContactRequest | null> {
  const existing = await prisma.contactRequest.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.contactRequest.update({
    where: { id },
    data: { status },
  });
  return toDomainContactRequest(row);
}

export async function countContactRequests() {
  return prisma.contactRequest.count();
}
