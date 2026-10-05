import type { CalendarDay, CalendarRange } from "@/domain";

import type { AdminCalendarFilters } from "./admin-calendar.types";

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

export async function getAdminCalendarDayRequest(
  filters: AdminCalendarFilters,
): Promise<
  | { ok: true; range: CalendarRange; days: CalendarDay[] }
  | { ok: false; status: number; error: string }
> {
  const params = new URLSearchParams({ date: filters.date });
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.resourceType) {
    params.set("resourceType", filters.resourceType);
  }

  const response = await fetch(`/api/admin/calendar?${params.toString()}`);

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{
    range: CalendarRange;
    days: CalendarDay[];
  }>(response);

  if (!payload?.days || !payload.range) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, range: payload.range, days: payload.days };
}
