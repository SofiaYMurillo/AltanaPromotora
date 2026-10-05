import { NextResponse } from "next/server";

import { auditActorFromUser } from "@/backend/services/audit-service";
import { requirePermission } from "@/backend/services/authorize-service";
import { updateInternalUserPermissions } from "@/backend/services/internal-user-admin-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function mapErrorStatus(error: string) {
  switch (error) {
    case "not_found":
      return 404;
    case "forbidden":
    case "principal_admin":
    case "not_internal_user":
      return 403;
    default:
      return 400;
  }
}

export async function PUT(request: Request, context: RouteContext) {
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

  const permissionNames =
    body &&
    typeof body === "object" &&
    Array.isArray((body as Record<string, unknown>).permissionNames)
      ? ((body as Record<string, unknown>).permissionNames as unknown[]).filter(
          (item): item is string => typeof item === "string",
        )
      : null;

  if (!permissionNames) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await updateInternalUserPermissions({
    userId: id,
    permissionNames,
    actor: auditActorFromUser(auth.context.user) ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: mapErrorStatus(result.error) },
    );
  }

  return NextResponse.json({ permissionNames: result.permissionNames });
}
