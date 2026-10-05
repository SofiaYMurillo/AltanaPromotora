import { prisma } from "../db";
import { toDomainNotification } from "../mappers/notification-mapper";

export async function listNotificationsForRecipient(
  recipientUserId: string,
  limit = 50,
) {
  const rows = await prisma.notification.findMany({
    where: { recipientUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toDomainNotification);
}

export async function countUnreadForRecipient(recipientUserId: string) {
  return prisma.notification.count({
    where: { recipientUserId, readAt: null },
  });
}

export async function findNotificationById(id: string) {
  const row = await prisma.notification.findUnique({ where: { id } });
  return row ? toDomainNotification(row) : null;
}

export async function findBySecurityEventAndRecipient(
  securityEventId: string,
  recipientUserId: string,
) {
  const row = await prisma.notification.findUnique({
    where: {
      securityEventId_recipientUserId: {
        securityEventId,
        recipientUserId,
      },
    },
  });

  return row ? toDomainNotification(row) : null;
}

export async function createNotification(input: {
  id: string;
  recipientUserId: string;
  category: string;
  type: string;
  title: string;
  message: string;
  securityEventId?: string;
}) {
  if (input.securityEventId) {
    const existing = await findBySecurityEventAndRecipient(
      input.securityEventId,
      input.recipientUserId,
    );

    if (existing) {
      return existing;
    }
  }

  try {
    const row = await prisma.notification.create({
      data: {
        id: input.id,
        recipientUserId: input.recipientUserId,
        category: input.category,
        type: input.type,
        title: input.title,
        message: input.message,
        securityEventId: input.securityEventId ?? null,
      },
    });

    return toDomainNotification(row);
  } catch (error) {
    if (
      input.securityEventId &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const existing = await findBySecurityEventAndRecipient(
        input.securityEventId,
        input.recipientUserId,
      );

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
}

export async function markNotificationRead(input: {
  id: string;
  recipientUserId: string;
  readAt: Date;
}) {
  const row = await prisma.notification.findUnique({
    where: { id: input.id },
  });

  if (!row || row.recipientUserId !== input.recipientUserId) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (row.readAt) {
    return {
      ok: true as const,
      notification: toDomainNotification(row),
      alreadyRead: true,
    };
  }

  const updated = await prisma.notification.update({
    where: { id: input.id },
    data: { readAt: input.readAt },
  });

  return {
    ok: true as const,
    notification: toDomainNotification(updated),
    alreadyRead: false,
  };
}

export async function markAllNotificationsRead(input: {
  recipientUserId: string;
  readAt: Date;
}) {
  await prisma.notification.updateMany({
    where: { recipientUserId: input.recipientUserId, readAt: null },
    data: { readAt: input.readAt },
  });

  return listNotificationsForRecipient(input.recipientUserId);
}
