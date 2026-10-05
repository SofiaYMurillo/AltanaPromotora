import "dotenv/config";

import { securityNotificationPolicy } from "../src/config/security-notification-policy.data";
import {
  resolveInternalNotification,
  type SecurityEvent,
} from "../src/domain";
import { getPrincipalAdminEmail, getPrincipalAdminUserId } from "../src/backend/config/auth-config";
import {
  countUnreadNotifications,
  dispatchNotificationFromSecurityEvent,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "../src/backend/services/notification-service";
import { recordSecurityEvent } from "../src/backend/services/security-event-service";
import * as notificationRepository from "../src/backend/repositories/notification-repository";
import * as securityEventRepository from "../src/backend/repositories/security-event-repository";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function event(partial: Partial<SecurityEvent> & Pick<SecurityEvent, "type">): SecurityEvent {
  return {
    id: partial.id ?? `security-test-${partial.type}`,
    type: partial.type,
    timestamp: new Date().toISOString(),
    severity: partial.severity ?? "medium",
    source: partial.source ?? "admin_panel",
    emailAttempted: partial.emailAttempted ?? "worker@altana.test",
    metadata: partial.metadata,
    success: partial.success,
  };
}

async function main() {
  const recipientUserId = getPrincipalAdminUserId();

  const invitationCreated = resolveInternalNotification({
    event: event({ type: "worker_invitation_created" }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(invitationCreated.notify, "invitation_created should notify");
  assert(
    invitationCreated.notify &&
      !invitationCreated.draft.message.toLowerCase().includes("code") &&
      !invitationCreated.draft.message.toLowerCase().includes("código"),
    "invitation notification must not include a code",
  );

  const invitationRevoked = resolveInternalNotification({
    event: event({ type: "worker_invitation_revoked" }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(invitationRevoked.notify, "invitation_revoked should notify");

  const firstAccess = resolveInternalNotification({
    event: event({
      type: "worker_code_success",
      metadata: { firstAccess: true },
    }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(firstAccess.notify, "first worker access should notify");

  const reauth = resolveInternalNotification({
    event: event({
      type: "worker_code_success",
      metadata: { firstAccess: false },
    }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(!reauth.notify, "worker reauth must not notify");

  const loginSuccess = resolveInternalNotification({
    event: event({ type: "login_success", severity: "info" }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(!loginSuccess.notify, "login_success must not notify");

  const loginFailed = resolveInternalNotification({
    event: event({ type: "login_failed" }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(!loginFailed.notify, "isolated login_failed must not notify");

  const workerCodeFailed = resolveInternalNotification({
    event: event({ type: "worker_code_failed" }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(!workerCodeFailed.notify, "isolated worker_code_failed must not notify");

  const repeatedLogin = resolveInternalNotification({
    event: event({ type: "repeated_failed_login", severity: "high" }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(repeatedLogin.notify, "repeated_failed_login should notify");

  const repeatedCode = resolveInternalNotification({
    event: event({ type: "repeated_failed_worker_code", severity: "high" }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(repeatedCode.notify, "repeated_failed_worker_code should notify");

  const unauthorized = resolveInternalNotification({
    event: event({
      type: "unauthorized_admin_access",
      metadata: { reason: "unauthorized" },
    }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(unauthorized.notify, "unauthorized_admin_access should notify");

  const visitor = resolveInternalNotification({
    event: event({
      type: "unauthorized_admin_access",
      metadata: { reason: "session_missing" },
    }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(!visitor.notify, "visitor session_missing must not notify");

  const workerUnauthorized = resolveInternalNotification({
    event: event({
      type: "unauthorized_worker_access",
      metadata: { reason: "client_account" },
    }),
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(workerUnauthorized.notify, "unauthorized_worker_access should notify");

  console.log("policy_ok");

  const createdEvent = event({
    id: `security-smoke-invite-${Date.now()}`,
    type: "worker_invitation_created",
    emailAttempted: "nuevo-trabajador@altana.test",
  });
  const created = await dispatchNotificationFromSecurityEvent(createdEvent);
  assert(created.notification, "dispatch invitation_created should persist");
  assert(created.deliveryStatus === "pending", "created dispatch status pending");
  console.log("dispatch_created", created.notification?.id);

  const duplicate = await dispatchNotificationFromSecurityEvent(createdEvent);
  assert(
    duplicate.notification?.id === created.notification?.id,
    "duplicate securityEventId must be idempotent",
  );
  assert(duplicate.deliveryStatus === "pending", "idempotent dispatch stays pending");
  console.log("dispatch_idempotent", duplicate.notification?.id === created.notification?.id);

  const loginEvent = event({
    id: `security-smoke-login-${Date.now()}`,
    type: "login_success",
    severity: "info",
    emailAttempted: getPrincipalAdminEmail(),
  });
  const ignored = await dispatchNotificationFromSecurityEvent(loginEvent);
  assert(ignored.notification === null, "login_success dispatch must not persist");
  assert(ignored.deliveryStatus === "suppressed", "login_success must be suppressed");
  console.log("dispatch_login_ignored");

  const listed = await listNotificationsForUser(recipientUserId);
  assert(listed.unreadCount >= 1, "unread count should include new notification");
  console.log("unread_count", listed.unreadCount);

  const owned = listed.notifications[0];
  assert(owned, "should list at least one notification");
  assert(owned.recipientUserId === recipientUserId, "list must be owned by recipient");

  const cross = await markNotificationReadForUser({
    notificationId: owned.id,
    recipientUserId: "user-does-not-own",
  });
  assert(!cross.ok, "cross-user mark-read must fail");
  console.log("cross_user_blocked");

  const marked = await markNotificationReadForUser({
    notificationId: owned.id,
    recipientUserId,
  });
  assert(marked.ok, "owner can mark read");
  console.log("mark_read_ok", marked.ok && !marked.ok ? "" : marked.ok);

  const afterRead = await countUnreadNotifications(recipientUserId);
  console.log("unread_after_one", afterRead);

  const all = await markAllNotificationsReadForUser(recipientUserId);
  assert(all.unreadCount === 0, "mark all should zero unread");
  console.log("mark_all_ok", all.unreadCount);

  const persisted = await notificationRepository.countUnreadForRecipient(
    recipientUserId,
  );
  assert(persisted === 0, "unread must persist as zero");
  console.log("persisted_unread", persisted);

  const recordedNotify = await recordSecurityEvent({
    type: "worker_invitation_revoked",
    severity: "medium",
    source: "admin_panel",
    emailAttempted: "revoke-smoke@altana.test",
  });
  assert(recordedNotify.notificationStatus === "pending", "record must set pending");
  const storedNotify = await securityEventRepository.findSecurityEventById(
    recordedNotify.id,
  );
  assert(
    storedNotify?.notificationStatus === "pending",
    "notificationStatus pending must persist",
  );
  console.log("record_status_pending", storedNotify?.notificationStatus);

  const recordedSuppressed = await recordSecurityEvent({
    type: "login_success",
    severity: "info",
    source: "admin_panel",
    emailAttempted: getPrincipalAdminEmail(),
    success: true,
  });
  assert(
    recordedSuppressed.notificationStatus === "suppressed",
    "record must set suppressed when policy declines",
  );
  const storedSuppressed = await securityEventRepository.findSecurityEventById(
    recordedSuppressed.id,
  );
  assert(
    storedSuppressed?.notificationStatus === "suppressed",
    "notificationStatus suppressed must persist",
  );
  console.log("record_status_suppressed", storedSuppressed?.notificationStatus);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
