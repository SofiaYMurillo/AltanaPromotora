import { NextResponse } from "next/server";

import { logoutByToken } from "@/backend/services/auth-service";
import {
  clearSessionCookie,
  readSessionTokenFromCookies,
} from "@/backend/http/session-cookie";

export async function POST() {
  const token = await readSessionTokenFromCookies();
  await logoutByToken(token);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
