/**
 * Provider-agnostic mail contract.
 * Domain, invitations, auth, and UI must depend on this — never on a vendor SDK.
 */

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type MailSendResult =
  | { ok: true; mode: "sent" | "simulated" }
  | { ok: false; error: string };

export interface MailSender {
  send(message: MailMessage): Promise<MailSendResult>;
}
