import { NextResponse } from "next/server";

import { createGmailMailOAuthStart } from "@/backend/authentication/gmail-mail-oauth";
import { shouldUseSecureCookies } from "@/backend/config/auth-config";
import { getAppUrl } from "@/backend/config/email-config";
import {
  GMAIL_MAIL_STATE_COOKIE,
  GMAIL_MAIL_VERIFIER_COOKIE,
  isGmailMailOAuthConfigured,
} from "@/backend/config/gmail-mail-config";
import { requirePrincipalAdmin } from "@/backend/services/authorize-service";

function appOrigin() {
  return getAppUrl() || "http://localhost:3000";
}

export async function GET() {
  const auth = await requirePrincipalAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login", appOrigin()));
  }

  if (!isGmailMailOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/settings?mail=unavailable", appOrigin()),
    );
  }

  const start = createGmailMailOAuthStart();
  const response = NextResponse.redirect(start.authorizationUrl);
  const options = {
    httpOnly: true as const,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/api/admin/mail/google",
    maxAge: 60 * 10,
  };
  response.cookies.set(GMAIL_MAIL_STATE_COOKIE, start.state, options);
  response.cookies.set(GMAIL_MAIL_VERIFIER_COOKIE, start.codeVerifier, options);
  return response;
}
