import { NextResponse } from "next/server";

import {
  isValidPropertyOperation,
  isValidPropertyType,
} from "@/domain";
import {
  requireCatalogReadAccess,
  requireCatalogWriteAccess,
} from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  createProperty,
  listAdminProperties,
} from "@/backend/services/property-service";

function asBoolean(value: string | null) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

export async function GET(request: Request) {
  const auth = await requireCatalogReadAccess("properties.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const operation = searchParams.get("operation");
  const type = searchParams.get("type");

  try {
    const properties = await listAdminProperties({
      active: asBoolean(searchParams.get("active")),
      operation: isValidPropertyOperation(operation) ? operation : undefined,
      type: isValidPropertyType(type) ? type : undefined,
      city: searchParams.get("city") ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return NextResponse.json({ properties });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const auth = await requireCatalogWriteAccess("properties.manage", {
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: request.headers.get("user-agent") ?? undefined,
    route: "/api/admin/properties",
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
    const result = await createProperty(body, {
      actor: auditActorFromUser(auth.context.user),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ property: result.property }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
