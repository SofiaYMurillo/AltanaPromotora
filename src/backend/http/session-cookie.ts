import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  shouldUseSecureCookies,
} from "../config/auth-config";

export function sessionCookieOptions(expiresAt: Date) {
  const secure = shouldUseSecureCookies();

  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export function attachSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    sessionCookieOptions(expiresAt),
  );
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function readSessionTokenFromCookies() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function defaultSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}
