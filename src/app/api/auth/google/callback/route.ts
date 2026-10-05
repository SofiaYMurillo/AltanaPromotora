import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeGoogleAuthorizationCode } from "@/backend/authentication/google-oauth";
import { shouldUseSecureCookies } from "@/backend/config/auth-config";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  isGoogleOAuthConfigured,
} from "@/backend/config/google-oauth-config";
import { getAppUrl } from "@/backend/config/email-config";
import { attachSessionCookie } from "@/backend/http/session-cookie";
import { submitAccessRequest } from "@/backend/services/access-request-service";
import { authenticateWithGoogleIdentity } from "@/backend/services/google-auth-service";

function appOrigin() {
  return getAppUrl() || "http://localhost:3000";
}

function loginRedirect(error: string) {
  return NextResponse.redirect(new URL(`/admin/login?error=${error}`, appOrigin()));
}

function requestSentRedirect() {
  return NextResponse.redirect(
    new URL("/admin/login?status=request_sent", appOrigin()),
  );
}

function clearOAuthCookies(response: NextResponse) {
  const expired = {
    httpOnly: true as const,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/api/auth/google",
    expires: new Date(0),
  };
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", expired);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, "", expired);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const denied = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (denied === "access_denied") {
    const response = loginRedirect("google_denied");
    clearOAuthCookies(response);
    return response;
  }

  if (!isGoogleOAuthConfigured() || !code || !state) {
    const response = loginRedirect("google_failed");
    clearOAuthCookies(response);
    return response;
  }

  const jar = await cookies();
  const expectedState = jar.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = jar.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;

  if (!expectedState || !codeVerifier || expectedState !== state) {
    const response = loginRedirect("google_failed");
    clearOAuthCookies(response);
    return response;
  }

  const identity = await exchangeGoogleAuthorizationCode({
    code,
    codeVerifier,
  });

  if (!identity) {
    const response = loginRedirect("google_failed");
    clearOAuthCookies(response);
    return response;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const result = await authenticateWithGoogleIdentity({
    email: identity.email,
    emailVerified: identity.emailVerified,
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: request.headers.get("user-agent") ?? undefined,
  });

  if (!result.ok) {
    if (
      result.error === "unauthorized" ||
      result.error === "expired" ||
      result.error === "revoked"
    ) {
      await submitAccessRequest({ email: identity.email });
      const response = requestSentRedirect();
      clearOAuthCookies(response);
      return response;
    }

    const error =
      result.error === "inactive"
        ? "google_inactive"
        : result.error === "rate_limited"
          ? "google_rate_limited"
          : "google_not_allowed";
    const response = loginRedirect(error);
    clearOAuthCookies(response);
    return response;
  }

  const response = NextResponse.redirect(new URL("/admin", appOrigin()));
  attachSessionCookie(response, result.token, result.expiresAt);
  clearOAuthCookies(response);
  return response;
}
