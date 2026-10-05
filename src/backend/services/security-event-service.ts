import type { SecurityEvent, SecurityEventType } from "@/domain";

import * as securityEventRepository from "../repositories/security-event-repository";
import { dispatchNotificationFromSecurityEvent } from "./notification-service";

/**
 * Fire-and-forget safe security logging.
 * Auth must not depend on this succeeding.
 * Notification dispatch is optional attention — it must not fail the event.
 *
 * Persists SecurityEvent.notificationStatus after dispatch so delivery state
 * is not only held in memory.
 */
export async function recordSecurityEvent(input: {
  type: SecurityEventType;
  severity: SecurityEvent["severity"];
  source?: SecurityEvent["source"];
  emailAttempted?: string;
  ipReference?: string;
  userAgentReference?: string;
  route?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const event: SecurityEvent = {
    id: `security-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    timestamp: new Date().toISOString(),
    severity: input.severity,
    source: input.source ?? "admin_panel",
    emailAttempted: input.emailAttempted,
    ipReference: input.ipReference,
    userAgentReference: input.userAgentReference,
    route: input.route,
    success: input.success,
    metadata: input.metadata,
    notificationStatus: "not_requested",
  };

  try {
    await securityEventRepository.createSecurityEvent(event);
  } catch {
    return event;
  }

  try {
    const result = await dispatchNotificationFromSecurityEvent(event);
    event.notificationStatus = result.deliveryStatus;
    await securityEventRepository.updateNotificationStatus(
      event.id,
      result.deliveryStatus,
    );
  } catch {
    event.notificationStatus = "failed";
    try {
      await securityEventRepository.updateNotificationStatus(
        event.id,
        "failed",
      );
    } catch {
      // Persistence of delivery status must not invalidate the security record.
    }
  }

  return event;
}
