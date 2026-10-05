import type { SecurityEventType } from "./security-event";

/**
 * Access decision reason codes shared by composition helpers.
 * Backend remains the authoritative enforcer.
 */
export type AccessDenialReason =
  | "allowed_principal_admin"
  | "allowed_admin"
  | "allowed_worker"
  | "visitor"
  | "unregistered"
  | "client"
  | "inactive"
  | "unauthorized"
  | "session_missing"
  | "session_expired"
  | "corporate_email_required"
  | "email_domain_not_allowed";

/** Alias kept for existing auth feature imports. */
export type InternalAccessReason = AccessDenialReason;

/**
 * Maps known access denial reasons to security event types.
 * Pure helper — not enforcement and not notification delivery.
 */
export function securityEventTypeForAccessDenial(
  reason: AccessDenialReason | string,
): SecurityEventType | null {
  switch (reason) {
    case "client":
    case "visitor":
    case "unregistered":
    case "unauthorized":
    case "session_missing":
    case "corporate_email_required":
    case "email_domain_not_allowed":
      return "unauthorized_admin_access";
    case "inactive":
      return "invalid_worker_access";
    case "session_expired":
      return "login_failed";
    default:
      return null;
  }
}
