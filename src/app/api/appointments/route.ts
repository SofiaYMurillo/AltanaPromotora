import { NextResponse } from "next/server";

import {
  createPublicAppointment,
  listAppointmentsForAdmin,
} from "@/backend/services/appointment-service";
import { requireAppointmentsReadAccess } from "@/backend/services/authorize-service";
import { toPublicAppointmentConfirmation } from "@/backend/mappers/appointment-mapper";
import type { Appointment } from "@/domain";

function appointmentErrorStatus(error: string) {
  switch (error) {
    case "slot_unavailable":
    case "unavailable_slot":
    case "capacity_exceeded":
    case "no_availability":
      return 409;
    case "invalid_resource":
      return 404;
    default:
      return 400;
  }
}

/**
 * Creation is public; reading the collection is not.
 * The list carries contact data and internal references, so it uses the same
 * gate as /api/admin/appointments. Create accepts only public-safe fields:
 * slotCapacity, clientId, and assignedWorkerId from the body are ignored.
 */
export async function GET(request: Request) {
  const auth = await requireAppointmentsReadAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as Appointment["status"] | null;
  const type = searchParams.get("type") as Appointment["type"] | null;
  const date = searchParams.get("date");

  try {
    const appointments = await listAppointmentsForAdmin({
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(date ? { date } : {}),
    });

    return NextResponse.json({ appointments });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = body as Partial<Appointment>;

  if (
    !input.type ||
    !input.date ||
    !input.time ||
    !input.communicationPreference
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    const result = await createPublicAppointment({
      type: input.type,
      propertyId: input.propertyId,
      officeLocationId: input.officeLocationId,
      date: input.date,
      time: input.time,
      communicationPreference: input.communicationPreference,
      contact: input.contact,
    });

    if (!result.ok) {
      const status = appointmentErrorStatus(result.error);
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(
      { appointment: toPublicAppointmentConfirmation(result.appointment) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
