import type { AuditEntry } from "@/domain";

import type { AdminActivityFilters } from "./admin-activity.types";

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

export async function listAdminActivityRequest(input: {
  filters?: AdminActivityFilters;
  limit?: number;
  offset?: number;
}): Promise<
  | { ok: true; entries: AuditEntry[]; hasMore: boolean; offset: number }
  | { ok: false; status: number; error: string }
> {
  const params = new URLSearchParams();
  if (input.filters?.entityType) {
    params.set("entityType", input.filters.entityType);
  }
  if (input.filters?.action) {
    params.set("action", input.filters.action);
  }
  if (input.limit !== undefined) {
    params.set("limit", String(input.limit));
  }
  if (input.offset !== undefined) {
    params.set("offset", String(input.offset));
  }

  const query = params.toString();
  const response = await fetch(
    query ? `/api/admin/activity?${query}` : "/api/admin/activity",
  );

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{
    entries: AuditEntry[];
    hasMore: boolean;
    offset: number;
  }>(response);

  if (!payload?.entries) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return {
    ok: true,
    entries: payload.entries,
    hasMore: Boolean(payload.hasMore),
    offset: payload.offset ?? 0,
  };
}
