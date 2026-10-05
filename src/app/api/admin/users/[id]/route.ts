import { NextResponse } from "next/server";

import { auditActorFromUser } from "@/backend/services/audit-service";
import { requirePermission } from "@/backend/services/authorize-service";
import {
  deleteInternalUser,
  setInternalUserActive,
} from "@/backend/services/internal-user-admin-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function mapErrorStatus(error: string) {
  switch (error) {
    case "not_found":
      return 404;
    case "forbidden":
    case "principal_admin":
    case "self_delete":
    case "self_deactivate":
    case "not_internal_user":
      return 403;
    default:
      return 400;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requirePermission("users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const active =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).active === "boolean"
      ? ((body as Record<string, unknown>).active as boolean)
      : undefined;

  if (active === undefined) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await setInternalUserActive({
    userId: id,
    active,
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

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requirePermission("users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  const result = await deleteInternalUser({
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

  return NextResponse.json({ ok: true });
}
