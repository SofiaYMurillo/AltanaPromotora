import { getAppUrl } from "./email-config";
import { getGoogleClientId, getGoogleClientSecret } from "./google-oauth-config";

export const GMAIL_MAIL_STATE_COOKIE = "altana_gmail_mail_state";
export const GMAIL_MAIL_VERIFIER_COOKIE = "altana_gmail_mail_verifier";
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export function getGmailMailRedirectUri() {
  const explicit = process.env.GOOGLE_MAIL_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const appUrl = getAppUrl() ?? "http://localhost:3000";
  return `${appUrl}/api/admin/mail/google/callback`;
}

export function isGmailMailOAuthConfigured() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}
