import { NextResponse } from "next/server";

import { auditActorFromUser } from "@/backend/services/audit-service";
import { requirePermission } from "@/backend/services/authorize-service";
import { revokeInvitation } from "@/backend/services/worker-invitation-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePermission("users.manage");

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const result = await revokeInvitation({
    invitationId: id,
    revokedByUserId: auth.context.user!.id,
    actor: auditActorFromUser(auth.context.user),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    invitation: result.invitation,
    alreadyRevoked: result.alreadyRevoked,
  });
}
