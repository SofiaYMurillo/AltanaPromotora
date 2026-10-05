import { NextResponse } from "next/server";

import { changePrincipalAdminPassword } from "@/backend/services/auth-service";
import { requirePrincipalAdmin } from "@/backend/services/authorize-service";

export async function POST(request: Request) {
  const auth = await requirePrincipalAdmin();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const payload = body as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (
    typeof payload.currentPassword !== "string" ||
    typeof payload.newPassword !== "string" ||
    typeof payload.confirmPassword !== "string"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (payload.newPassword !== payload.confirmPassword) {
    return NextResponse.json({ error: "password_mismatch" }, { status: 400 });
  }

  const result = await changePrincipalAdminPassword({
    userId: auth.context.user!.id,
    sessionId: auth.context.sessionId,
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  });

  if (!result.ok) {
    const status =
      result.error === "unauthorized"
        ? 403
        : result.error === "password_not_configured"
          ? 409
          : 400;

    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
