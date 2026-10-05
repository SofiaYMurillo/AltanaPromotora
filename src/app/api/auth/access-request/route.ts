import { NextResponse } from "next/server";

import { submitAccessRequest } from "@/backend/services/access-request-service";

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

  const input = body as {
    email?: string;
    firstName?: string;
    lastName?: string;
  };

  if (!input.email?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await submitAccessRequest({
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  if (!result.ok) {
    const status =
      result.error === "rate_limited"
        ? 429
        : result.error === "invalid_email"
          ? 400
          : 409;
    return NextResponse.json(
      {
        error: result.error,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyPending: result.alreadyPending,
  });
}
