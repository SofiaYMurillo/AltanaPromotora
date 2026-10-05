import { NextResponse } from "next/server";

import { readSessionTokenFromCookies } from "@/backend/http/session-cookie";
import {
  resolveAuthFromToken,
  toSafeSessionPayload,
} from "@/backend/services/session-service";

export async function GET() {
  const token = await readSessionTokenFromCookies();
  const context = await resolveAuthFromToken(token);
  return NextResponse.json(toSafeSessionPayload(context));
}
