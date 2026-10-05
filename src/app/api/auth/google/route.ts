import { NextResponse } from "next/server";

import { createGoogleOAuthStart } from "@/backend/authentication/google-oauth";
import { shouldUseSecureCookies } from "@/backend/config/auth-config";
import { getAppUrl } from "@/backend/config/email-config";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  isGoogleOAuthConfigured,
} from "@/backend/config/google-oauth-config";

function oauthCookieOptions() {
  return {
    httpOnly: true as const,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/api/auth/google",
    maxAge: 60 * 10,
  };
}

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/login?error=google_unavailable", getRequestOrigin()),
    );
  }

  const start = createGoogleOAuthStart();
  const response = NextResponse.redirect(start.authorizationUrl);
  const options = oauthCookieOptions();
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, start.state, options);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, start.codeVerifier, options);
  return response;
}

function getRequestOrigin() {
  return getAppUrl() || "http://localhost:3000";
}
