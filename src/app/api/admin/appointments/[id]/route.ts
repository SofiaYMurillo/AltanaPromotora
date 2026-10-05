import { NextResponse } from "next/server";

import {
  requireAppointmentsReadAccess,
  requireAppointmentsWriteAccess,
} from "@/backend/services/authorize-service";
import {
  getAdminAppointment,
  parseAdminAppointmentStatusPatch,
  updateAppointmentStatus,
} from "@/backend/services/appointment-service";
import { auditActorFromUser } from "@/backend/services/audit-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function statusForError(error: string) {
  switch (error) {
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "invalid_transition":
      return 400;
    default:
      return 400;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAppointmentsReadAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const appointment = await getAdminAppointment(id);
    if (!appointment) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const forwarded = request.headers.get("x-forwarded-for");
  const ipReference = forwarded?.split(",")[0]?.trim() || undefined;
  const userAgentReference = request.headers.get("user-agent") ?? undefined;

  const auth = await requireAppointmentsWriteAccess({
    ipReference,
    userAgentReference,
    route: `/api/admin/appointments/${id}`,
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

  const parsed = parseAdminAppointmentStatusPatch(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await updateAppointmentStatus(
      id,
      parsed.status,
      parsed.expectedStatus,
      { actor: auditActorFromUser(auth.context.user) },
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: statusForError(result.error) },
      );
    }

    const appointment = await getAdminAppointment(id);
    return NextResponse.json({ appointment });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
