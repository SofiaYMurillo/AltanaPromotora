import { NextResponse } from "next/server";

import { requireAppointmentsReadAccess } from "@/backend/services/authorize-service";
import { getAdminCalendar } from "@/backend/services/calendar-service";

/**
 * Agenda read endpoint.
 *
 * Kept separate from /api/admin/appointments on purpose: this route enforces a
 * bounded date range and returns the narrow calendar read model, while the
 * appointments route serves the unbounded administrative list with transition
 * metadata.
 */
export async function GET(request: Request) {
  const auth = await requireAppointmentsReadAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);

  try {
    const result = await getAdminCalendar({
      date: searchParams.get("date") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      resourceType: searchParams.get("resourceType") ?? undefined,
      resourceId: searchParams.get("resourceId") ?? undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ range: result.range, days: result.days });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
