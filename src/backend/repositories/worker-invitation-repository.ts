import { prisma } from "../db";
import {
  toDomainWorkerInvitation,
  toPrismaWorkerInvitationData,
} from "../mappers/worker-invitation-mapper";

export async function listWorkerInvitations() {
  const rows = await prisma.workerInvitation.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomainWorkerInvitation);
}

export async function findWorkerInvitationById(id: string) {
  const row = await prisma.workerInvitation.findUnique({ where: { id } });
  return row ? toDomainWorkerInvitation(row) : null;
}

export async function findWorkerInvitationByIdWithHash(id: string) {
  return prisma.workerInvitation.findUnique({ where: { id } });
}

export async function findActiveInvitationForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const now = new Date();

  const row = await prisma.workerInvitation.findFirst({
    where: {
      email: normalized,
      active: true,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  return row
    ? { domain: toDomainWorkerInvitation(row), codeHash: row.codeHash }
    : null;
}

export async function createWorkerInvitation(input: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  grantedPermissionNames?: string[];
  roleId: string;
  active: boolean;
  codeHash: string;
  expiresAt: Date;
  invitedByUserId?: string;
}) {
  const row = await prisma.workerInvitation.create({
    data: toPrismaWorkerInvitationData(input),
  });
  return toDomainWorkerInvitation(row);
}

export async function revokeWorkerInvitation(id: string, revokedAt: Date) {
  const row = await prisma.workerInvitation.update({
    where: { id },
    data: { revokedAt },
  });
  return toDomainWorkerInvitation(row);
}

export async function markWorkerInvitationUsed(id: string, usedAt: Date) {
  const row = await prisma.workerInvitation.update({
    where: { id },
    data: { usedAt },
  });
  return toDomainWorkerInvitation(row);
}

export async function updateInvitationDelivery(input: {
  id: string;
  emailDeliveryStatus: string;
  lastEmailAttemptAt: Date;
  emailSentAt?: Date | null;
}) {
  const row = await prisma.workerInvitation.update({
    where: { id: input.id },
    data: {
      emailDeliveryStatus: input.emailDeliveryStatus,
      lastEmailAttemptAt: input.lastEmailAttemptAt,
      emailSentAt: input.emailSentAt ?? undefined,
    },
  });
  return toDomainWorkerInvitation(row);
}

/**
 * Rotates the invitation code if the row still matches expectedResendCount.
 * Returns null when a concurrent update already won or the row is no longer eligible.
 */
export async function rotateInvitationCode(input: {
  id: string;
  expectedResendCount: number;
  codeHash: string;
  expiresAt: Date;
  lastEmailAttemptAt: Date;
}) {
  const result = await prisma.workerInvitation.updateMany({
    where: {
      id: input.id,
      usedAt: null,
      revokedAt: null,
      active: true,
      resendCount: input.expectedResendCount,
    },
    data: {
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      lastEmailAttemptAt: input.lastEmailAttemptAt,
      emailDeliveryStatus: "not_attempted",
      resendCount: { increment: 1 },
    },
  });

  if (result.count !== 1) {
    return null;
  }

  return findWorkerInvitationById(input.id);
}
