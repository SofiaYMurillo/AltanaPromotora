/**
 * Internal in-app notification — independent from SecurityEvent.
 *
 * SecurityEvent = immutable audit/threat fact.
 * Notification = attention item for a recipient, with read/unread state.
 *
 * A notification may reference a SecurityEvent; reading it never mutates the event.
 */

export type NotificationCategory = "administrative" | "security";

export type NotificationType =
  | "invitation_created"
  | "invitation_revoked"
  | "invitation_resent"
  | "invitation_email_failed"
  | "worker_access_granted"
  | "unauthorized_access"
  | "repeated_failed_auth"
  | "appointment_requested"
  | "access_request_received";

export interface InternalNotification {
  id: string;
  recipientUserId: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  securityEventId?: string;
  readAt?: string;
  createdAt: string;
}

export function isNotificationUnread(
  notification: Pick<InternalNotification, "readAt">,
) {
  return notification.readAt == null;
}

export function formatUnreadBadgeCount(count: number) {
  if (count <= 0) {
    return null;
  }

  if (count >= 10) {
    return "10+";
  }

  return String(count);
}
