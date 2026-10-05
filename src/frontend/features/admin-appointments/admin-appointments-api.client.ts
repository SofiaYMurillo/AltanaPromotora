import type { AppointmentStatus } from "@/domain";

import type {
  AdminAppointmentFilters,
  AdminAppointmentView,
} from "./admin-appointments.types";

type ApiErrorResponse = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function listAdminAppointmentsRequest(
  filters: AdminAppointmentFilters = {},
): Promise<
  | { ok: true; appointments: AdminAppointmentView[] }
  | { ok: false; status: number; error: string }
> {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.resourceType) {
    params.set("resourceType", filters.resourceType);
  }
  if (filters.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const query = params.toString();
  const response = await fetch(
    query ? `/api/admin/appointments?${query}` : "/api/admin/appointments",
  );

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{ appointments: AdminAppointmentView[] }>(
    response,
  );
  if (!payload?.appointments) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, appointments: payload.appointments };
}

export async function getAdminAppointmentRequest(
  id: string,
): Promise<
  | { ok: true; appointment: AdminAppointmentView }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(`/api/admin/appointments/${id}`);

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{ appointment: AdminAppointmentView }>(
    response,
  );
  if (!payload?.appointment) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, appointment: payload.appointment };
}

export async function changeAdminAppointmentStatusRequest(input: {
  id: string;
  status: AppointmentStatus;
  expectedStatus: AppointmentStatus;
}): Promise<
  | { ok: true; appointment: AdminAppointmentView }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(`/api/admin/appointments/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: input.status,
      expectedStatus: input.expectedStatus,
    }),
  });

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{ appointment: AdminAppointmentView }>(
    response,
  );
  if (!payload?.appointment) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, appointment: payload.appointment };
}
