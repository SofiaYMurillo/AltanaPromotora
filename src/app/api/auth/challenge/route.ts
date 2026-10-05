import { NextResponse } from "next/server";

import { resolveAuthenticationChallenge } from "@/backend/services/auth-service";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = body as { email?: string };

  if (!input.email?.trim()) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const challenge = await resolveAuthenticationChallenge(input.email);

  return NextResponse.json(challenge);
}
