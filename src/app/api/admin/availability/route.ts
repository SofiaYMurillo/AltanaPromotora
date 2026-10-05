import { NextResponse } from "next/server";

import type { AvailabilityScope } from "@/domain";
import { requirePermission } from "@/backend/services/authorize-service";
import {
  getAdminAvailabilityScope,
  replaceAdminAvailabilityRules,
  type AvailabilityDraftRule,
} from "@/backend/services/availability-admin-service";

function parseScope(value: string | null): AvailabilityScope | null {
  if (value === "office" || value === "property") {
    return value;
  }
  return null;
}

export async function GET(request: Request) {
  const auth = await requirePermission("availability.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const scope = parseScope(new URL(request.url).searchParams.get("scope"));
  if (!scope) {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }

  const view = await getAdminAvailabilityScope(scope);
  return NextResponse.json({ availability: view });
}

export async function PUT(request: Request) {
  const auth = await requirePermission("availability.manage");
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

  const input = body as { scope?: string; rules?: AvailabilityDraftRule[] };
  const scope = parseScope(input.scope ?? null);

  if (!scope || !Array.isArray(input.rules)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await replaceAdminAvailabilityRules({
    scope,
    rules: input.rules,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ availability: result.view });
}
