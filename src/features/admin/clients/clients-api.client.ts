import type { Client } from "@/domain";

import type { ClientDetailPageData, ClientListItemView } from "./clients.types";

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

export async function fetchAdminClients(): Promise<
  | { ok: true; clients: ClientListItemView[] }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch("/api/admin/clients");

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{ clients: ClientListItemView[] }>(response);
  if (!payload) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, clients: payload.clients };
}

export async function fetchAdminClientDetail(
  id: string,
): Promise<
  | { ok: true; data: ClientDetailPageData }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(`/api/admin/clients/${id}`);

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "request_failed",
    };
  }

  const payload = await parseJson<{
    client: Client;
    appointments: ClientDetailPageData["appointments"];
  }>(response);

  if (!payload) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }

  return { ok: true, data: payload };
}
