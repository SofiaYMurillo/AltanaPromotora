import { getAdminLoginUrl } from "../config/email-config";
import { getMailSender } from "./create-mail-sender";
import type { MailSendResult } from "./mail-sender";
import { buildWorkerInvitationEmail } from "./templates/worker-invitation-email";

/**
 * Builds and sends the worker invitation message.
 * Does not generate codes, persist invitations, or talk to Prisma.
 */
export async function sendWorkerInvitationEmail(input: {
  to: string;
  invitationCode: string;
  expiresAt: Date;
}): Promise<MailSendResult> {
  const content = buildWorkerInvitationEmail({
    recipientEmail: input.to,
    invitationCode: input.invitationCode,
    expiresAt: input.expiresAt,
    loginUrl: getAdminLoginUrl(),
  });

  return getMailSender().send({
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}

export function toInvitationEmailDeliveryStatus(
  result: MailSendResult,
): "sent" | "failed" | "simulated" {
  if (!result.ok) {
    return "failed";
  }

  return result.mode;
}
