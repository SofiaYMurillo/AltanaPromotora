import "dotenv/config";

import {
  evaluateInvitationResend,
  resolveInternalNotification,
} from "../src/domain";
import { securityNotificationPolicy } from "../src/config/security-notification-policy.data";
import { getPrincipalAdminUserId } from "../src/backend/config/auth-config";
import { bindMailSenderForTests } from "../src/backend/email/create-mail-sender";
import type { MailMessage, MailSendResult, MailSender } from "../src/backend/email/mail-sender";
import { createResendMailSender } from "../src/backend/email/providers/resend-mail-sender";
import { buildWorkerInvitationEmail } from "../src/backend/email/templates/worker-invitation-email";
import * as workerInvitationRepository from "../src/backend/repositories/worker-invitation-repository";
import {
  createInvitation,
  resendInvitation,
} from "../src/backend/services/worker-invitation-service";
import {
  hashInvitationCode,
  verifyInvitationCode,
} from "../src/backend/security/invitation-code";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function createRecordingSender(mode: MailSendResult = { ok: true, mode: "simulated" }): MailSender & {
  messages: MailMessage[];
} {
  const messages: MailMessage[] = [];
  return {
    messages,
    async send(message) {
      messages.push(message);
      return mode;
    },
  };
}

async function main() {
  process.env.WORKER_INVITATION_RESEND_COOLDOWN_SECONDS = "0";
  process.env.WORKER_INVITATION_MAX_RESENDS = "5";
  process.env.EMAIL_PROVIDER = "console";

  const recipientUserId = getPrincipalAdminUserId();
  const invitedByUserId = recipientUserId;

  const template = buildWorkerInvitationEmail({
    recipientEmail: "worker@altana.test",
    invitationCode: "ABC123EF",
    expiresAt: new Date("2026-12-31T23:59:59.000Z"),
    loginUrl: "http://localhost:3000/admin/login",
  });
  assert(template.subject.includes("ALTANA"), "template subject");
  assert(template.text.includes("ABC123EF"), "template text contains code");
  assert(template.html.includes("ABC123EF"), "template html contains code");
  assert(template.html.includes("/admin/login"), "template includes login url");
  assert(!template.text.includes("codeHash"), "template has no hash");
  console.log("template_ok");

  const cooldownBlocked = evaluateInvitationResend({
    invitation: {
      id: "x",
      email: "a@altana.test",
      roleId: "role-worker",
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      lastEmailAttemptAt: new Date().toISOString(),
      resendCount: 0,
    },
    policy: { cooldownSeconds: 120, maxResends: 5 },
  });
  assert(!cooldownBlocked.allowed && cooldownBlocked.reason === "cooldown", "cooldown policy");

  const usedBlocked = evaluateInvitationResend({
    invitation: {
      id: "x",
      email: "a@altana.test",
      roleId: "role-worker",
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      usedAt: new Date().toISOString(),
      resendCount: 0,
    },
    policy: { cooldownSeconds: 0, maxResends: 5 },
  });
  assert(!usedBlocked.allowed && usedBlocked.reason === "used", "used policy");

  const revokedBlocked = evaluateInvitationResend({
    invitation: {
      id: "x",
      email: "a@altana.test",
      roleId: "role-worker",
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      revokedAt: new Date().toISOString(),
      resendCount: 0,
    },
    policy: { cooldownSeconds: 0, maxResends: 5 },
  });
  assert(!revokedBlocked.allowed && revokedBlocked.reason === "revoked", "revoked policy");

  const expiredAllowed = evaluateInvitationResend({
    invitation: {
      id: "x",
      email: "a@altana.test",
      roleId: "role-worker",
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      resendCount: 0,
    },
    policy: { cooldownSeconds: 0, maxResends: 5 },
  });
  assert(expiredAllowed.allowed, "expired can resend");
  console.log("policy_ok");

  const resentNotify = resolveInternalNotification({
    event: {
      id: "evt-resend",
      type: "worker_invitation_resent",
      severity: "info",
      emailAttempted: "a@altana.test",
    },
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(resentNotify.notify, "resent notifies");

  const emailFailedNotify = resolveInternalNotification({
    event: {
      id: "evt-fail",
      type: "worker_invitation_email_failed",
      severity: "medium",
      emailAttempted: "a@altana.test",
    },
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(emailFailedNotify.notify, "email failed notifies");

  const emailSentSilent = resolveInternalNotification({
    event: {
      id: "evt-sent",
      type: "worker_invitation_email_sent",
      severity: "info",
      emailAttempted: "a@altana.test",
    },
    recipientUserId,
    policy: securityNotificationPolicy,
  });
  assert(!emailSentSilent.notify, "email sent does not notify");
  console.log("notification_policy_ok");

  let capturedKey: string | undefined;
  const fakeFetch: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    capturedKey = headers.get("Authorization") ?? undefined;
    const body = JSON.parse(String(init?.body));
    assert(Array.isArray(body.to), "resend payload to[]");
    assert(typeof body.html === "string", "resend html");
    return new Response(JSON.stringify({ id: "email_test" }), { status: 200 });
  };
  const resendSender = createResendMailSender({
    apiKey: "test-key",
    from: "ALTANA PROMOTORA <noreply@altanapromotora.com>",
    fetchImpl: fakeFetch,
  });
  const resendResult = await resendSender.send({
    to: "worker@altana.test",
    subject: "test",
    html: "<p>hi</p>",
    text: "hi",
  });
  assert(resendResult.ok && resendResult.mode === "sent", "resend adapter sent");
  assert(capturedKey === "Bearer test-key", "resend uses bearer token");
  console.log("resend_adapter_ok");

  const recorder = createRecordingSender();
  bindMailSenderForTests(recorder);

  const stamp = Date.now();
  const email = `smoke-invite-${stamp}@altana.test`;
  const created = await createInvitation({
    email,
    roleId: "role-worker",
    invitedByUserId: invitedByUserId,
  });
  assert(created.ok, "create invitation");
  if (!created.ok) {
    throw new Error("create failed");
  }
  assert(created.email.status === "simulated", "create uses simulated mailer");
  assert(recorder.messages.length === 1, "one email sent on create");
  assert(recorder.messages[0]?.to === email, "email recipient");
  assert(recorder.messages[0]?.text.includes(created.code), "email contains code");
  assert(!JSON.stringify(created.invitation).includes(created.code) || created.invitation.email === email, "invitation payload");

  const stored = await workerInvitationRepository.findWorkerInvitationByIdWithHash(
    created.invitation.id,
  );
  assert(stored, "invitation persisted");
  assert(stored && !verifyInvitationCode(created.code, "deadbeef"), "wrong hash fails");
  assert(stored && verifyInvitationCode(created.code, stored.codeHash), "stored hash matches code");
  assert(stored && stored.codeHash === hashInvitationCode(created.code), "hash persisted not plaintext");
  assert(stored && stored.codeHash !== created.code, "plaintext code is not the hash");
  console.log("create_and_hash_ok");

  const oldCode = created.code;
  const resent = await resendInvitation({
    invitationId: created.invitation.id,
    resentByUserId: invitedByUserId,
  });
  assert(resent.ok, "resend ok");
  if (!resent.ok) {
    throw new Error("resend failed");
  }
  assert(resent.code !== oldCode, "new code generated");
  const storedAfter = await workerInvitationRepository.findWorkerInvitationByIdWithHash(
    created.invitation.id,
  );
  assert(storedAfter, "invitation still exists");
  assert(
    storedAfter && !verifyInvitationCode(oldCode, storedAfter.codeHash),
    "old code invalidated",
  );
  assert(
    storedAfter && verifyInvitationCode(resent.code, storedAfter.codeHash),
    "new code valid",
  );
  assert(recorder.messages.length === 2, "second email on resend");
  assert(storedAfter && storedAfter.expiresAt.getTime() > Date.now(), "expiry refreshed");
  console.log("resend_rotates_code_ok");

  const used = await resendInvitation({
    invitationId: "invitation-004",
    resentByUserId: invitedByUserId,
  });
  assert(!used.ok && used.error === "used", "used blocked");

  const revoked = await resendInvitation({
    invitationId: "invitation-003",
    resentByUserId: invitedByUserId,
  });
  assert(!revoked.ok && revoked.error === "revoked", "revoked blocked");
  console.log("used_revoked_blocked");

  const failedSender = createRecordingSender({ ok: false, error: "provider_rejected" });
  bindMailSenderForTests(failedSender);
  const failedCreate = await createInvitation({
    email: `smoke-fail-${stamp}@altana.test`,
    roleId: "role-worker",
    invitedByUserId: invitedByUserId,
  });
  assert(failedCreate.ok, "invitation remains after email failure");
  if (!failedCreate.ok) {
    throw new Error("failed create");
  }
  assert(failedCreate.email.status === "failed", "email marked failed");
  assert(failedCreate.invitation.id, "invitation id present despite failed email");
  console.log("email_failure_keeps_invitation");

  bindMailSenderForTests(undefined);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
