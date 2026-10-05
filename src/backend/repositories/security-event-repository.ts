import type { SecurityEvent } from "@/domain";

import { prisma } from "../db";

export async function createSecurityEvent(event: SecurityEvent) {
  return prisma.securityEvent.create({
    data: {
      id: event.id,
      type: event.type,
      timestamp: new Date(event.timestamp),
      severity: event.severity,
      source: event.source,
      emailAttempted: event.emailAttempted ?? null,
      ipReference: event.ipReference ?? null,
      userAgentReference: event.userAgentReference ?? null,
      route: event.route ?? null,
      success: event.success ?? null,
      metadataJson: event.metadata ? JSON.stringify(event.metadata) : null,
      notificationStatus: event.notificationStatus ?? null,
    },
  });
}

export async function updateNotificationStatus(
  id: string,
  notificationStatus: NonNullable<SecurityEvent["notificationStatus"]>,
) {
  return prisma.securityEvent.update({
    where: { id },
    data: { notificationStatus },
  });
}

export async function findSecurityEventById(id: string) {
  return prisma.securityEvent.findUnique({ where: { id } });
}

export async function listSecurityEvents(limit = 50) {
  return prisma.securityEvent.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}
