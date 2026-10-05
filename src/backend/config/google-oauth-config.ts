import { getAppUrl } from "./email-config";

export const GOOGLE_OAUTH_STATE_COOKIE = "altana_google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "altana_google_oauth_verifier";

export function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || "";
}

export function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
}

export function isGoogleOAuthConfigured() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export function getGoogleRedirectUri() {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const appUrl = getAppUrl() ?? "http://localhost:3000";
  return `${appUrl}/api/auth/google/callback`;
}
