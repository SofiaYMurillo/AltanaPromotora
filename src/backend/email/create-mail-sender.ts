import {
  getEmailApiKey,
  getEmailFrom,
  getEmailProviderName,
  getSmtpHost,
  getSmtpPassword,
  getSmtpPort,
  getSmtpUser,
} from "../config/email-config";
import { isGmailMailConnected } from "./gmail-mail-token-store";
import type { MailSender } from "./mail-sender";
import { createConsoleMailSender } from "./providers/console-mail-sender";
import { createGmailApiMailSender } from "./providers/gmail-api-mail-sender";
import { createResendMailSender } from "./providers/resend-mail-sender";
import { createSmtpMailSender } from "./providers/smtp-mail-sender";

let testOverride: MailSender | undefined;

export function bindMailSenderForTests(sender?: MailSender) {
  testOverride = sender;
}

export function createMailSenderFromEnv(): MailSender {
  if (isGmailMailConnected()) {
    return createGmailApiMailSender(getEmailFrom());
  }

  const provider = getEmailProviderName();

  if (provider === "gmail") {
    return createGmailApiMailSender(getEmailFrom());
  }

  if (provider === "console") {
    return createConsoleMailSender();
  }

  if (provider === "smtp") {
    return createSmtpMailSender({
      host: getSmtpHost(),
      port: getSmtpPort(),
      user: getSmtpUser(),
      password: getSmtpPassword(),
      from: getEmailFrom(),
    });
  }

  const apiKey = getEmailApiKey();
  if (!apiKey) {
    return {
      async send() {
        return { ok: false, error: "email_not_configured" };
      },
    };
  }

  return createResendMailSender({
    apiKey,
    from: getEmailFrom(),
  });
}

export function getMailSender(): MailSender {
  return testOverride ?? createMailSenderFromEnv();
}
