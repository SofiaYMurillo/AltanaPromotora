import { NextResponse } from "next/server";

import { auditActorFromUser } from "@/backend/services/audit-service";
import { requirePermission } from "@/backend/services/authorize-service";
import { revokeInternalUserPrivileges } from "@/backend/services/internal-user-admin-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function mapErrorStatus(error: string) {
  switch (error) {
    case "not_found":
      return 404;
    case "forbidden":
    case "principal_admin":
    case "self_revoke":
    case "not_internal_user":
      return 403;
    default:
      return 400;
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePermission("users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const result = await revokeInternalUserPrivileges({
    userId: id,
    actorUserId: auth.context.user!.id,
    actor: auditActorFromUser(auth.context.user) ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: mapErrorStatus(result.error) },
    );
  }

  return NextResponse.json({ user: result.user });
}
