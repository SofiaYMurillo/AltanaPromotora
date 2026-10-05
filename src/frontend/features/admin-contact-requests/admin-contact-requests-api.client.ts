import type { ContactRequest } from "@/domain";

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

function fail(response: Response, payload: ApiErrorResponse | null) {
  return {
    ok: false as const,
    status: response.status,
    error: payload?.error ?? "request_failed",
  };
}

export async function listAdminContactRequestsRequest(search?: string) {
  const query = search?.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const response = await fetch(`/api/admin/contact-requests${query}`);
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ contactRequests: ContactRequest[] }>(
    response,
  );
  if (!payload?.contactRequests) {
    return { ok: false as const, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.contactRequests };
}

export async function getAdminContactRequestRequest(id: string) {
  const response = await fetch(`/api/admin/contact-requests/${id}`);
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ contactRequest: ContactRequest }>(response);
  if (!payload?.contactRequest) {
    return { ok: false as const, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.contactRequest };
}

export async function changeAdminContactRequestStatusRequest(input: {
  id: string;
  status: ContactRequest["status"];
}) {
  const response = await fetch(`/api/admin/contact-requests/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: input.status }),
  });
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ contactRequest: ContactRequest }>(response);
  if (!payload?.contactRequest) {
    return { ok: false as const, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.contactRequest };
}
