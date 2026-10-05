import { refreshGmailAccessToken } from "../../authentication/gmail-mail-oauth";
import { readGmailMailToken } from "../gmail-mail-token-store";
import type { MailSender, MailSendResult } from "../mail-sender";

function encodeSubject(subject: string) {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function buildRawMessage(input: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const mime = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    input.html || input.text,
  ].join("\r\n");

  return Buffer.from(mime).toString("base64url");
}

export function createGmailApiMailSender(from: string): MailSender {
  return {
    async send(message): Promise<MailSendResult> {
      const stored = readGmailMailToken();
      if (!stored) {
        return { ok: false, error: "email_not_configured" };
      }

      const accessToken = await refreshGmailAccessToken(stored.refreshToken);
      if (!accessToken) {
        return { ok: false, error: "email_not_configured" };
      }

      const sender = stored.email
        ? `ALTANA PROMOTORA <${stored.email}>`
        : from;

      try {
        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              raw: buildRawMessage({
                from: sender,
                to: message.to,
                subject: message.subject,
                html: message.html,
                text: message.text,
              }),
            }),
          },
        );

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
