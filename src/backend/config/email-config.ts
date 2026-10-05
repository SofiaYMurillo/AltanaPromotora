/**
 * Server-only email and invitation-delivery configuration.
 * Secrets never leave this layer.
 */

export type EmailProviderName = "console" | "resend" | "smtp" | "gmail";

export function getSmtpHost() {
  return process.env.EMAIL_SMTP_HOST?.trim() || "smtp.gmail.com";
}

export function getSmtpPort() {
  const parsed = Number(process.env.EMAIL_SMTP_PORT ?? "587");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
}

export function getSmtpUser() {
  return process.env.EMAIL_SMTP_USER?.trim() || "";
}

export function getSmtpPassword() {
  return process.env.EMAIL_SMTP_PASSWORD?.trim() || "";
}

export function isSmtpConfigured() {
  return Boolean(getSmtpUser() && getSmtpPassword());
}

export function getEmailProviderName(): EmailProviderName {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (raw === "gmail") {
    return "gmail";
  }

  if (raw === "resend" || raw === "console" || raw === "smtp") {
    if (raw === "smtp" && !isSmtpConfigured()) {
      return "console";
    }
    return raw;
  }

  if (isSmtpConfigured()) {
    return "smtp";
  }

  if (getEmailApiKey()) {
    return "resend";
  }

  return "console";
}

export function getEmailApiKey(): string | undefined {
  const key = process.env.EMAIL_API_KEY?.trim();
  return key || undefined;
}

export function getEmailFrom(): string {
  const smtpUser = getSmtpUser();
  return (
    process.env.EMAIL_FROM?.trim() ||
    (smtpUser
      ? `ALTANA PROMOTORA <${smtpUser}>`
      : "ALTANA PROMOTORA <noreply@altanapromotora.com>")
  );
}

export function getAppUrl(): string | null {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return null;
}

export function getAdminLoginUrl(): string | null {
  const appUrl = getAppUrl();
  return appUrl ? `${appUrl}/admin/login` : null;
}

export function getInvitationResendCooldownSeconds(): number {
  const parsed = Number(
    process.env.WORKER_INVITATION_RESEND_COOLDOWN_SECONDS ?? "120",
  );
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 120;
}

export function getInvitationMaxResends(): number {
  const parsed = Number(process.env.WORKER_INVITATION_MAX_RESENDS ?? "5");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
}
