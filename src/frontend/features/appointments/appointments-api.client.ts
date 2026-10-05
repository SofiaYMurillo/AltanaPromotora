import type { Appointment, AvailabilityDaySlots } from "@/domain";

type ApiErrorResponse = {
  error?: string;
};

type CreatePublicAppointmentInput = {
  type: Appointment["type"];
  propertyId?: string;
  officeLocationId?: string;
  date: string;
  time: string;
  communicationPreference: Appointment["communicationPreference"];
  contact?: Appointment["contact"];
};

/** Public confirmation payload — never includes clientId / assignedWorkerId. */
export type PublicAppointmentConfirmation = Omit<
  Appointment,
  "clientId" | "assignedWorkerId"
>;

export type PublicAvailabilityResponse = {
  resourceType: "property" | "office";
  resourceId: string;
  days: AvailabilityDaySlots[];
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getPublicAvailabilityRequest(input: {
  resourceType: "property" | "office";
  resourceId: string;
  /** Required for shared property-visit schedules so occupancy is per inmueble. */
  visitPropertyId?: string;
  date?: string;
  from?: string;
  to?: string;
  signal?: AbortSignal;
}): Promise<
  | { ok: true; availability: PublicAvailabilityResponse }
  | { ok: false; status: number; error: string }
> {
  const params = new URLSearchParams({
    resourceType: input.resourceType,
    resourceId: input.resourceId,
  });

  if (input.date) {
    params.set("date", input.date);
  }
  if (input.from) {
    params.set("from", input.from);
  }
  if (input.to) {
    params.set("to", input.to);
  }
  if (input.visitPropertyId) {
    params.set("propertyId", input.visitPropertyId);
  }

  const response = await fetch(`/api/availability?${params.toString()}`, {
    signal: input.signal,
  });

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<PublicAvailabilityResponse>(response);
  if (!payload?.days) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, availability: payload };
}

export async function createPublicAppointmentRequest(
  input: CreatePublicAppointmentInput,
): Promise<
  | { ok: true; appointment: PublicAppointmentConfirmation }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{ appointment: PublicAppointmentConfirmation }>(
    response,
  );
  if (!payload?.appointment) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, appointment: payload.appointment };
}

export function mapBookingApiError(error: string | undefined) {
  switch (error) {
    case "slot_unavailable":
    case "unavailable_slot":
    case "capacity_exceeded":
      return "La hora seleccionada ya no está disponible. Selecciona otra hora.";
    case "invalid_date":
    case "invalid_time":
      return "La fecha u hora seleccionada no es válida.";
    case "invalid_resource":
    case "no_availability":
      return "No hay disponibilidad para este lugar.";
    case "property_required":
    case "office_required":
    case "missing_fields":
      return "Completa los datos de la visita para continuar.";
    default:
      return "No se pudo confirmar la cita. Intenta de nuevo.";
  }
}

export function isSlotNoLongerAvailable(error: string | undefined) {
  return (
    error === "slot_unavailable" ||
    error === "unavailable_slot" ||
    error === "capacity_exceeded"
  );
}
