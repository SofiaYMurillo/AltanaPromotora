import { NextResponse } from "next/server";

import { listAdminAuditEntries } from "@/backend/services/audit-service";
import { requireActivityReadAccess } from "@/backend/services/authorize-service";

/**
 * Read-only administrative history.
 * There is no POST/PATCH/DELETE here on purpose: audit entries are written
 * exclusively by backend services and are immutable afterwards.
 */
function asPositiveInt(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function GET(request: Request) {
  const auth = await requireActivityReadAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);

  try {
    const result = await listAdminAuditEntries({
      entityType: searchParams.get("entityType") ?? undefined,
      entityId: searchParams.get("entityId") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      actorUserId: searchParams.get("actorUserId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: asPositiveInt(searchParams.get("limit")),
      offset: asPositiveInt(searchParams.get("offset")),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      entries: result.entries,
      hasMore: result.hasMore,
      limit: result.limit,
      offset: result.offset,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
