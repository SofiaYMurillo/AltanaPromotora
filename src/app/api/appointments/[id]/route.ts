import { NextResponse } from "next/server";

import type { AppointmentStatus } from "@/domain";
import {
  assignAppointmentWorker,
  updateAppointmentStatus,
} from "@/backend/services/appointment-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import { requireAppointmentManageAccess } from "@/backend/services/authorize-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Admin mutation endpoint — session + authorization required on server.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const forwarded = request.headers.get("x-forwarded-for");
  const ipReference = forwarded?.split(",")[0]?.trim() || undefined;
  const userAgentReference = request.headers.get("user-agent") ?? undefined;

  const auth = await requireAppointmentManageAccess({
    ipReference,
    userAgentReference,
    route: `/api/appointments/${id}`,
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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = body as {
    status?: AppointmentStatus;
    assignedWorkerId?: string | null;
  };

  if (input.status) {
    const result = await updateAppointmentStatus(id, input.status, undefined, {
      actor: auditActorFromUser(auth.context.user),
    });
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ appointment: result.appointment });
  }

  if ("assignedWorkerId" in input) {
    const result = await assignAppointmentWorker(
      id,
      input.assignedWorkerId ?? null,
      { actor: auditActorFromUser(auth.context.user) },
    );
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ appointment: result.appointment });
  }

  return NextResponse.json({ error: "no_patch_fields" }, { status: 400 });
}
