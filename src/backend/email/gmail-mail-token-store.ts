import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getPrincipalAdminEmail } from "../config/auth-config";

type StoredMailToken = {
  refreshToken: string;
  email: string;
};

function tokenFilePath() {
  const fromEnv = process.env.GOOGLE_MAIL_TOKEN_PATH?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (existsSync("/data")) {
    return "/data/gmail-mail.json";
  }

  return path.join(process.cwd(), "prisma", "gmail-mail.json");
}

function isAllowedSender(email: string) {
  const expected = getPrincipalAdminEmail();
  if (!email) {
    return true;
  }
  return email.trim().toLowerCase() === expected;
}

export function readGmailMailToken(): StoredMailToken | null {
  const fromEnv = process.env.GOOGLE_MAIL_REFRESH_TOKEN?.trim();
  const emailFromEnv =
    process.env.EMAIL_SMTP_USER?.trim() ||
    process.env.GOOGLE_MAIL_SENDER?.trim() ||
    "";

  if (fromEnv) {
    if (!isAllowedSender(emailFromEnv)) {
      return null;
    }
    return { refreshToken: fromEnv, email: emailFromEnv };
  }

  const filePath = tokenFilePath();
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as StoredMailToken;
    if (!parsed.refreshToken?.trim()) {
      return null;
    }
    const email = parsed.email?.trim() || emailFromEnv;
    if (!isAllowedSender(email)) {
      return null;
    }
    return {
      refreshToken: parsed.refreshToken.trim(),
      email,
    };
  } catch {
    return null;
  }
}

export function writeGmailMailToken(input: StoredMailToken) {
  const filePath = tokenFilePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    JSON.stringify(
      {
        refreshToken: input.refreshToken,
        email: input.email,
      },
      null,
      2,
    ),
    "utf8",
  );
}

export function isGmailMailConnected() {
  return Boolean(readGmailMailToken()?.refreshToken);
}
