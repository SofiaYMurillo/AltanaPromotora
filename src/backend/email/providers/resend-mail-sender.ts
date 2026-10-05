import type { MailSender, MailSendResult } from "../mail-sender";

type ResendMailSenderOptions = {
  apiKey: string;
  from: string;
  fetchImpl?: typeof fetch;
};

/**
 * Resend HTTP adapter. Talks to the provider API via fetch.
 * No vendor SDK — swapping providers should not require domain/auth/UI changes.
 */
export function createResendMailSender(
  options: ResendMailSenderOptions,
): MailSender {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async send(message): Promise<MailSendResult> {
      if (!options.apiKey) {
        return { ok: false, error: "email_not_configured" };
      }

      try {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: options.from,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
          }),
        });

        if (!response.ok) {
          return { ok: false, error: "provider_rejected" };
        }

        return { ok: true, mode: "sent" };
      } catch {
        return { ok: false, error: "provider_unreachable" };
      }
    },
  };
}
