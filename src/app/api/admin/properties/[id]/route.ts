import { NextResponse } from "next/server";

import {
  requireCatalogReadAccess,
  requireCatalogWriteAccess,
} from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  deleteProperty,
  getAdminProperty,
  updateProperty,
  updatePropertyStatus,
} from "@/backend/services/property-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function statusForError(error: string) {
  if (error === "not_found") {
    return 404;
  }
  if (error === "has_appointments") {
    return 409;
  }
  return 400;
}

function isStatusOnlyPatch(body: unknown): body is { active: boolean } {
  return (
    Boolean(body) &&
    typeof body === "object" &&
    Object.keys(body as object).length === 1 &&
    typeof (body as { active?: unknown }).active === "boolean"
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireCatalogReadAccess("properties.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const property = await getAdminProperty(id);
    if (!property) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ property });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const forwarded = request.headers.get("x-forwarded-for");
  const auth = await requireCatalogWriteAccess("properties.manage", {
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: request.headers.get("user-agent") ?? undefined,
    route: `/api/admin/properties/${id}`,
  });

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const options = { actor: auditActorFromUser(auth.context.user) };
    const result = isStatusOnlyPatch(body)
      ? await updatePropertyStatus(id, body.active, options)
      : await updateProperty(id, body, options);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: statusForError(result.error) },
      );
    }

    return NextResponse.json({ property: result.property });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const forwarded = _request.headers.get("x-forwarded-for");
  const auth = await requireCatalogWriteAccess("properties.manage", {
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: _request.headers.get("user-agent") ?? undefined,
    route: `/api/admin/properties/${id}`,
  });

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await deleteProperty(id, {
      actor: auditActorFromUser(auth.context.user),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: statusForError(result.error) },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
