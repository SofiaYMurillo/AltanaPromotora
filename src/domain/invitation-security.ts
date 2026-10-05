import type { SecurityEventType } from "./security-event";

/**
 * Maps invitation evaluation reasons to security event types.
 */
export function securityEventTypeForInvitationDenial(
  reason: string,
): SecurityEventType | null {
  switch (reason) {
    case "expired":
      return "expired_worker_code";
    case "revoked":
      return "revoked_worker_code";
    case "inactive":
    case "used":
    case "not_found":
    case "email_mismatch":
    case "token_mismatch":
    case "corporate_email_required":
    case "email_domain_not_allowed":
      return "invalid_worker_access";
    default:
      return null;
  }
}

export function securityEventTypeForWorkerCodeFailure(
  reason: string,
  repeated: boolean,
): SecurityEventType {
  if (repeated) {
    return "repeated_failed_worker_code";
  }

  switch (reason) {
    case "expired":
      return "expired_worker_code";
    case "revoked":
      return "revoked_worker_code";
    default:
      return "worker_code_failed";
  }
}
