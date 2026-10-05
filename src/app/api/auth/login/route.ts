import { NextResponse } from "next/server";

import {
  authenticateAdmin,
  authenticateWithInvitationCode,
  resolveAuthenticationChallenge,
} from "@/backend/services/auth-service";
import { submitAccessRequest } from "@/backend/services/access-request-service";
import { attachSessionCookie } from "@/backend/http/session-cookie";

function requestMeta(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return {
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: request.headers.get("user-agent") ?? undefined,
  };
}

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

  const input = body as { email?: string; password?: string; code?: string };

  if (!input.email?.trim()) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const meta = requestMeta(request);
  const password = input.password?.trim() ?? "";
  const code = input.code?.trim() ?? "";
  const challenge = await resolveAuthenticationChallenge(input.email);

  if (challenge.method === "password") {
    if (!password) {
      return NextResponse.json({ needsPassword: true, challenge });
    }

    const result = await authenticateAdmin({
      email: input.email,
      password,
      ...meta,
    });

    return finishLogin(result);
  }

  if (challenge.method === "invitation_code") {
    if (!code) {
      return NextResponse.json({ needsCode: true, challenge });
    }

    const result = await authenticateWithInvitationCode({
      email: input.email,
      code,
      ...meta,
    });

    return finishLogin(result);
  }

  const submitted = await submitAccessRequest({ email: input.email });

  if (submitted.ok) {
    return NextResponse.json(
      {
        requestSent: true,
        alreadyPending: submitted.alreadyPending,
      },
      { status: 202 },
    );
  }

  if (submitted.error === "already_member") {
    return NextResponse.json({ error: "already_member" }, { status: 409 });
  }

  const status =
    submitted.error === "rate_limited"
      ? 429
      : submitted.error === "invalid_email"
        ? 400
        : 409;

  return NextResponse.json(
    {
      error: submitted.error,
      retryAfterSeconds: submitted.retryAfterSeconds,
    },
    { status },
  );
}

function finishLogin(
  result: Awaited<
    ReturnType<typeof authenticateAdmin | typeof authenticateWithInvitationCode>
  >,
) {
  if (!result.ok) {
    const status =
      result.error === "rate_limited"
        ? 429
        : result.error === "inactive" ||
            result.error === "unauthorized" ||
            result.error === "expired" ||
            result.error === "revoked"
          ? 403
          : 401;

    return NextResponse.json(
      {
        error: result.error,
        ...(result.retryAfterSeconds
          ? { retryAfterSeconds: result.retryAfterSeconds }
          : {}),
      },
      { status },
    );
  }

  const response = NextResponse.json({
    ok: true,
    userId: result.userId,
  });

  attachSessionCookie(response, result.token, result.expiresAt);
  return response;
}
