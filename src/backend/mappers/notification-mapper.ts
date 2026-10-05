import type { Notification as NotificationRow } from "@/generated/prisma/client";
import type {
  InternalNotification,
  NotificationCategory,
  NotificationType,
} from "@/domain";

function isNotificationCategory(value: string): value is NotificationCategory {
  return value === "administrative" || value === "security";
}

function isNotificationType(value: string): value is NotificationType {
  return (
    value === "invitation_created" ||
    value === "invitation_revoked" ||
    value === "invitation_resent" ||
    value === "invitation_email_failed" ||
    value === "worker_access_granted" ||
    value === "unauthorized_access" ||
    value === "repeated_failed_auth" ||
    value === "access_request_received"
  );
}

export function toDomainNotification(row: NotificationRow): InternalNotification {
  return {
    id: row.id,
    recipientUserId: row.recipientUserId,
    category: isNotificationCategory(row.category)
      ? row.category
      : "administrative",
    type: isNotificationType(row.type) ? row.type : "invitation_created",
    title: row.title,
    message: row.message,
    securityEventId: row.securityEventId ?? undefined,
    readAt: row.readAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
