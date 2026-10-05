/**
 * Security events are independent from AuditEntry and Notification.
 *
 * AuditEntry = actions performed inside the system.
 * SecurityEvent = access / threat / recovery related signals.
 * Notification = optional delivery consequence — never required to record an event.
 *
 * Backend owns persistence, detection, and real delivery.
 * Frontend must not store passwords, tokens, or unnecessary sensitive data.
 */

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "unauthorized_admin_access"
  | "unauthorized_worker_access"
  | "invalid_worker_access"
  | "expired_worker_code"
  | "revoked_worker_code"
  | "worker_invitation_created"
  | "worker_invitation_revoked"
  | "worker_invitation_resent"
  | "worker_invitation_email_sent"
  | "worker_invitation_email_failed"
  | "worker_code_success"
  | "worker_code_failed"
  | "repeated_failed_worker_code"
  | "repeated_failed_login"
  | "suspicious_access"
  | "account_recovery_requested"
  | "account_recovery_completed"
  | "admin_access_granted"
  | "admin_access_revoked"
  | "worker_access_granted"
  | "worker_access_revoked";

export type SecurityEventSeverity = "info" | "low" | "medium" | "high" | "critical";

export type SecurityEventSource =
  | "admin_panel"
  | "worker_auth"
  | "public"
  | "recovery"
  | "system";

export type SecurityNotificationDeliveryStatus =
  | "not_requested"
  | "pending"
  | "sent"
  | "failed"
  | "suppressed";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: string;
  severity: SecurityEventSeverity;
  source: SecurityEventSource;
  /** Attempted email when known — never a password or token. */
  emailAttempted?: string;
  /** Opaque / truncated reference only — not for public display. */
  ipReference?: string;
  userAgentReference?: string;
  route?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
  notificationStatus?: SecurityNotificationDeliveryStatus;
}

/**
 * Conceptual notification derived from a SecurityEvent.
 * Delivery failure must not invalidate the underlying event record.
 */
export interface SecurityNotification {
  id: string;
  securityEventId: string;
  channel: "internal" | "email";
  title: string;
  message: string;
  createdAt: string;
  status: SecurityNotificationDeliveryStatus;
}
