import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { resendInvitation } from "@/backend/services/worker-invitation-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePermission("users.manage");

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const result = await resendInvitation({
    invitationId: id,
    resentByUserId: auth.context.user!.id,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "cooldown" || result.error === "conflict"
          ? 409
          : 403;

    return NextResponse.json({ error: result.error }, { status });
  }

  const payload: Record<string, unknown> = {
    invitation: result.invitation,
    email: result.email,
  };

  if (
    process.env.NODE_ENV !== "production" ||
    result.email.status === "simulated" ||
    result.email.status === "failed"
  ) {
    payload.devCode = result.code;
  }

  return NextResponse.json(payload);
}
