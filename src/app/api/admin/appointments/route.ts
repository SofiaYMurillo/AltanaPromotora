import { NextResponse } from "next/server";

import type { AppointmentStatus, AppointmentVisitType } from "@/domain";
import { requireAppointmentsReadAccess } from "@/backend/services/authorize-service";
import { listAdminAppointments } from "@/backend/services/appointment-service";

const STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const VISIT_TYPES: AppointmentVisitType[] = ["property", "office"];

function asStatus(value: string | null): AppointmentStatus | undefined {
  return value && STATUSES.includes(value as AppointmentStatus)
    ? (value as AppointmentStatus)
    : undefined;
}

function asVisitType(value: string | null): AppointmentVisitType | undefined {
  return value && VISIT_TYPES.includes(value as AppointmentVisitType)
    ? (value as AppointmentVisitType)
    : undefined;
}

export async function GET(request: Request) {
  const auth = await requireAppointmentsReadAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);

  try {
    const appointments = await listAdminAppointments({
      status: asStatus(searchParams.get("status")),
      type: asVisitType(searchParams.get("type")),
      date: searchParams.get("date") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      resourceType: asVisitType(searchParams.get("resourceType")),
      resourceId: searchParams.get("resourceId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    return NextResponse.json({ appointments });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
