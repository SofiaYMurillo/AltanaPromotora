import type { MailSender, MailSendResult } from "../mail-sender";

/**
 * Explicit development adapter. Never reported as a real send.
 * Does not log message bodies (they may contain invitation codes).
 */
export function createConsoleMailSender(): MailSender {
  return {
    async send(message): Promise<MailSendResult> {
      console.info("[email:console] simulated delivery", {
        to: message.to,
        subject: message.subject,
        mode: "simulated",
      });
      return { ok: true, mode: "simulated" };
    },
  };
}
