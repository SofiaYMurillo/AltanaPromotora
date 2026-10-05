/**
 * Server auth configuration.
 * Principal admin id and seed password come from environment — never hardcode production secrets.
 */

import {
  GOOGLE_AUTHORIZED_EMAILS,
  GOOGLE_PRACTICANTES_USER_ID,
  PRINCIPAL_ADMIN_EMAIL,
  PRINCIPAL_ADMIN_EMAIL_ALIASES,
} from "@/features/auth/auth.data";

export const SESSION_COOKIE_NAME = "altana_session";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** Default invitation validity — configurable via env. */
export const WORKER_INVITATION_TTL_MS =
  1000 * 60 * 60 * 24 * Number(process.env.WORKER_INVITATION_TTL_DAYS ?? "30");

export function getPrincipalAdminUserId(): string {
  return process.env.PRINCIPAL_ADMIN_USER_ID?.trim() || "user-practicantes-001";
}

function normalizeIdentityEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Canonical principal-admin email for password login.
 * Env overrides the seed constant so Docker/.env can point at the real mailbox.
 */
export function getPrincipalAdminEmail(): string {
  const fromEnv =
    process.env.ALTANA_PRINCIPAL_ADMIN_EMAIL?.trim() ||
    process.env.ALTANA_INITIAL_ADMIN_EMAIL?.trim();
  if (fromEnv) {
    return normalizeIdentityEmail(fromEnv);
  }
  return normalizeIdentityEmail(PRINCIPAL_ADMIN_EMAIL);
}

/** Extra Google mailboxes allowed into the panel (workers, not principal admin). */
export function getGoogleAuthorizedEmails(): string[] {
  const fromEnv = (process.env.ALTANA_GOOGLE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((item) => normalizeIdentityEmail(item))
    .filter(Boolean);

  return [
    ...new Set([
      ...GOOGLE_AUTHORIZED_EMAILS.map(normalizeIdentityEmail),
      ...fromEnv,
    ]),
  ];
}

export function isGoogleAuthorizedEmail(email: string) {
  return getGoogleAuthorizedEmails().includes(normalizeIdentityEmail(email));
}

export function googleAuthorizedUserId(email: string) {
  const normalized = normalizeIdentityEmail(email);
  if (normalized === "altanapromotorapracticantes@gmail.com") {
    return GOOGLE_PRACTICANTES_USER_ID;
  }
  return `user-google-${normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function getPrincipalAdminEmailAliases(): string[] {
  const aliases = new Set<string>([
    getPrincipalAdminEmail(),
    normalizeIdentityEmail(PRINCIPAL_ADMIN_EMAIL),
    ...PRINCIPAL_ADMIN_EMAIL_ALIASES.map(normalizeIdentityEmail),
  ]);
  return [...aliases];
}

/**
 * Secure cookies require HTTPS except on localhost-style http APP_URL.
 * NODE_ENV=production in Docker would otherwise drop the session on http://localhost.
 */
export function shouldUseSecureCookies() {
  const explicit = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true") {
    return true;
  }
  if (explicit === "false") {
    return false;
  }

  const appUrl = process.env.APP_URL?.trim() ?? "";
  if (appUrl.startsWith("https://")) {
    return true;
  }
  if (appUrl.startsWith("http://")) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

/**
 * Development-only seed password for the principal admin credential.
 * Must be provided via ADMIN_SEED_PASSWORD in real deployments.
 */
export function getAdminSeedPassword(): string {
  const fromEnv = process.env.ADMIN_SEED_PASSWORD?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SEED_PASSWORD is required to seed admin credentials in production.",
    );
  }

  // Local development fallback — not a production secret / not a backdoor.
  return "DevOnly-ChangeMe!";
}

/** Real first administrator email (bootstrap only — never used as an auth bypass). */
export function getInitialAdminEmail(): string | undefined {
  const fromEnv = process.env.ALTANA_INITIAL_ADMIN_EMAIL?.trim();
  return fromEnv || undefined;
}

/** Initial administrator password for bootstrap only. Never commit or log. */
export function getInitialAdminPassword(): string | undefined {
  const fromEnv = process.env.ALTANA_INITIAL_ADMIN_PASSWORD?.trim();
  return fromEnv || undefined;
}
