import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeGmailMailAuthorizationCode } from "@/backend/authentication/gmail-mail-oauth";
import {
  getPrincipalAdminEmail,
  shouldUseSecureCookies,
} from "@/backend/config/auth-config";
import { getAppUrl } from "@/backend/config/email-config";
import {
  GMAIL_MAIL_STATE_COOKIE,
  GMAIL_MAIL_VERIFIER_COOKIE,
} from "@/backend/config/gmail-mail-config";
import { writeGmailMailToken } from "@/backend/email/gmail-mail-token-store";
import { requirePrincipalAdmin } from "@/backend/services/authorize-service";

function appOrigin() {
  return getAppUrl() || "http://localhost:3000";
}

function settingsRedirect(status: string) {
  return NextResponse.redirect(new URL(`/admin/settings?mail=${status}`, appOrigin()));
}

function clearCookies(response: NextResponse) {
  const expired = {
    httpOnly: true as const,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/api/admin/mail/google",
    expires: new Date(0),
  };
  response.cookies.set(GMAIL_MAIL_STATE_COOKIE, "", expired);
  response.cookies.set(GMAIL_MAIL_VERIFIER_COOKIE, "", expired);
}

function allowedSenderEmails() {
  return new Set([getPrincipalAdminEmail()]);
}

export async function GET(request: Request) {
  const auth = await requirePrincipalAdmin();
  if (!auth.ok) {
    const response = NextResponse.redirect(new URL("/admin/login", appOrigin()));
    clearCookies(response);
    return response;
  }

  const url = new URL(request.url);
  if (url.searchParams.get("error")) {
    const response = settingsRedirect("denied");
    clearCookies(response);
    return response;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get(GMAIL_MAIL_STATE_COOKIE)?.value;
  const codeVerifier = jar.get(GMAIL_MAIL_VERIFIER_COOKIE)?.value;

  if (!code || !state || !expectedState || !codeVerifier || expectedState !== state) {
    const response = settingsRedirect("failed");
    clearCookies(response);
    return response;
  }

  const identity = await exchangeGmailMailAuthorizationCode({
    code,
    codeVerifier,
  });

  if (!identity) {
    const response = settingsRedirect("failed");
    clearCookies(response);
    return response;
  }

  if (!allowedSenderEmails().has(identity.email)) {
    const response = settingsRedirect("wrong_account");
    clearCookies(response);
    return response;
  }

  if (!identity.refreshToken) {
    const response = settingsRedirect("no_refresh");
    clearCookies(response);
    return response;
  }

  writeGmailMailToken({
    refreshToken: identity.refreshToken,
    email: identity.email,
  });

  const response = settingsRedirect("connected");
  clearCookies(response);
  return response;
}
