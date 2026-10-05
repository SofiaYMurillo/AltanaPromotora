import { NextResponse } from "next/server";

import { auditActorFromUser } from "@/backend/services/audit-service";
import { requirePermission } from "@/backend/services/authorize-service";
import { approveAccessRequest } from "@/backend/services/access-request-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePermission("users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const result = await approveAccessRequest({
    requestId: id,
    actorUserId: auth.context.user!.id,
    actor: auditActorFromUser(auth.context.user),
  });

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  const payload: Record<string, unknown> = {
    request: result.request,
    invitation: result.invitation,
    email: result.email,
  };

  if (result.email.status === "simulated" || result.email.status === "failed") {
    payload.devCode = result.code;
  }

  return NextResponse.json(payload);
}
