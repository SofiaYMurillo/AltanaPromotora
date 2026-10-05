import type { SecurityEventSeverity } from "./security-event";

/**
 * Policy for which SecurityEvents become in-app Notifications.
 *
 * aggregationWindowSeconds / maxNotificationsPerWindow are reserved for a
 * future backend throttle; pure domain resolveInternalNotification does not
 * apply them. Isolated login_failed / worker_code_failed never notify —
 * only dedicated repeated_* event types do.
 */
export interface SecurityNotificationPolicy {
  enabled: boolean;
  minimumSeverity: SecurityEventSeverity;
  /** Reserved aggregation window in seconds (not yet enforced). */
  aggregationWindowSeconds: number;
  /** Reserved max alerts per window (not yet enforced). */
  maxNotificationsPerWindow: number;
  notifyOnRepeatedFailures: boolean;
  notifyOnUnauthorizedAdminAccess: boolean;
}
