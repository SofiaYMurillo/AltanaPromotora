import { prisma } from "../db";
import { toDomainSession } from "../mappers/session-mapper";

export async function createSession(input: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const row = await prisma.session.create({
    data: {
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });

  return toDomainSession(row);
}

export async function findSessionByTokenHash(tokenHash: string) {
  const row = await prisma.session.findUnique({ where: { tokenHash } });
  return row ? toDomainSession(row) : null;
}

export async function findSessionRecordByTokenHash(tokenHash: string) {
  return prisma.session.findUnique({ where: { tokenHash } });
}

export async function revokeSession(sessionId: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeSessionByTokenHash(tokenHash: string) {
  const existing = await prisma.session.findUnique({ where: { tokenHash } });
  if (!existing || existing.revokedAt) {
    return null;
  }

  return prisma.session.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

export async function revokeOtherSessionsForUser(
  userId: string,
  exceptSessionId: string | null,
) {
  const now = new Date();

  return prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: now },
  });
}
