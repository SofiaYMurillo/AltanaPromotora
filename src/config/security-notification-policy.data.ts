import type { SecurityNotificationPolicy } from "@/domain";

/**
 * Runtime policy for SecurityEvent → in-app Notification.
 *
 * aggregationWindowSeconds / maxNotificationsPerWindow are reserved config
 * for a future backend throttle. Domain resolveInternalNotification does not
 * enforce them yet — repeated-failure events are already distinct event types.
 */
export const securityNotificationPolicy: SecurityNotificationPolicy = {
  enabled: true,
  minimumSeverity: "medium",
  aggregationWindowSeconds: 120,
  maxNotificationsPerWindow: 3,
  notifyOnRepeatedFailures: true,
  notifyOnUnauthorizedAdminAccess: true,
};
