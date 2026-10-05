import type { Project, Property } from "@/domain";

import type { CatalogWriteResult } from "./catalog.types";

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

export async function listAdminProjectsRequest(): Promise<
  CatalogWriteResult<Project[]>
> {
  const response = await fetch("/api/admin/projects");
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ projects: Project[] }>(response);
  if (!payload?.projects) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true, value: payload.projects };
}

export async function getAdminProjectRequest(
  id: string,
): Promise<CatalogWriteResult<Project>> {
  const response = await fetch(`/api/admin/projects/${id}`);
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ project: Project }>(response);
  if (!payload?.project) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.project };
}

export async function createAdminProjectRequest(
  body: unknown,
): Promise<CatalogWriteResult<Project>> {
  const response = await fetch("/api/admin/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ project: Project }>(response);
  if (!payload?.project) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.project };
}

export async function updateAdminProjectRequest(
  id: string,
  body: unknown,
): Promise<CatalogWriteResult<Project>> {
  const response = await fetch(`/api/admin/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ project: Project }>(response);
  if (!payload?.project) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.project };
}

export async function listAdminPropertiesRequest(
  search?: string,
): Promise<CatalogWriteResult<Property[]>> {
  const query = search?.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const response = await fetch(`/api/admin/properties${query}`);
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ properties: Property[] }>(response);
  if (!payload?.properties) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.properties };
}

export async function getAdminPropertyRequest(
  id: string,
): Promise<CatalogWriteResult<Property>> {
  const response = await fetch(`/api/admin/properties/${id}`);
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ property: Property }>(response);
  if (!payload?.property) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.property };
}

export async function createAdminPropertyRequest(
  body: unknown,
): Promise<CatalogWriteResult<Property>> {
  const response = await fetch("/api/admin/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ property: Property }>(response);
  if (!payload?.property) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.property };
}

export async function updateAdminPropertyRequest(
  id: string,
  body: unknown,
): Promise<CatalogWriteResult<Property>> {
  const response = await fetch(`/api/admin/properties/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  const payload = await parseJson<{ property: Property }>(response);
  if (!payload?.property) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: true as const, value: payload.property };
}

export async function deleteAdminPropertyRequest(
  id: string,
): Promise<CatalogWriteResult<void>> {
  const response = await fetch(`/api/admin/properties/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    return fail(response, await parseJson<ApiErrorResponse>(response));
  }
  return { ok: true as const, value: undefined };
}
