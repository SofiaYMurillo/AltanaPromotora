import { randomUUID } from "node:crypto";

import { securityNotificationPolicy } from "@/config/security-notification-policy.data";
import {
  resolveInternalNotification,
  type InternalNotification,
  type SecurityNotificationDeliveryStatus,
} from "@/domain";
import type { SecurityEvent } from "@/domain";

import { getPrincipalAdminUserId } from "../config/auth-config";
import * as notificationRepository from "../repositories/notification-repository";

/**
 * Result of attempting to materialize an in-app Notification from a SecurityEvent.
 * Email is a separate channel and is never decided here.
 */
export type SecurityNotificationDispatchResult = {
  notification: InternalNotification | null;
  deliveryStatus: Extract<
    SecurityNotificationDeliveryStatus,
    "pending" | "suppressed" | "failed"
  >;
};

export async function listNotificationsForUser(recipientUserId: string) {
  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.listNotificationsForRecipient(recipientUserId),
    notificationRepository.countUnreadForRecipient(recipientUserId),
  ]);

  return { notifications, unreadCount };
}

export async function countUnreadNotifications(recipientUserId: string) {
  return notificationRepository.countUnreadForRecipient(recipientUserId);
}

export async function markNotificationReadForUser(input: {
  notificationId: string;
  recipientUserId: string;
}) {
  const result = await notificationRepository.markNotificationRead({
    id: input.notificationId,
    recipientUserId: input.recipientUserId,
    readAt: new Date(),
  });

  if (!result.ok) {
    return result;
  }

  const unreadCount = await notificationRepository.countUnreadForRecipient(
    input.recipientUserId,
  );

  return {
    ok: true as const,
    notification: result.notification,
    alreadyRead: result.alreadyRead,
    unreadCount,
  };
}

export async function markAllNotificationsReadForUser(recipientUserId: string) {
  const notifications =
    await notificationRepository.markAllNotificationsRead({
      recipientUserId,
      readAt: new Date(),
    });

  return { notifications, unreadCount: 0 };
}

/**
 * Optional in-app attention from a SecurityEvent.
 * Never throws. Does not send email. Does not mutate the SecurityEvent row.
 */
export async function dispatchNotificationFromSecurityEvent(
  event: SecurityEvent,
): Promise<SecurityNotificationDispatchResult> {
  try {
    const recipientUserId = getPrincipalAdminUserId();
    const decision = resolveInternalNotification({
      event,
      recipientUserId,
      policy: securityNotificationPolicy,
    });

    if (!decision.notify) {
      return { notification: null, deliveryStatus: "suppressed" };
    }

    const notification = await notificationRepository.createNotification({
      id: `notification-${randomUUID()}`,
      recipientUserId: decision.draft.recipientUserId,
      category: decision.draft.category,
      type: decision.draft.type,
      title: decision.draft.title,
      message: decision.draft.message,
      securityEventId: decision.draft.securityEventId,
    });

    return { notification, deliveryStatus: "pending" };
  } catch {
    return { notification: null, deliveryStatus: "failed" };
  }
}
