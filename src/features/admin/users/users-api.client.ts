import type { AccessRequest, WorkerInvitationAdminView } from "@/domain";
import type { InvitationEmailDeliveryStatus } from "@/types/worker-invitation";

import type { AdminUserView } from "./users.types";

export type InvitationsListResponse = {
  invitations: WorkerInvitationAdminView[];
};

export type InvitationEmailPayload = {
  status: InvitationEmailDeliveryStatus;
};

export type CreateInvitationResponse = {
  invitation: WorkerInvitationAdminView;
  email?: InvitationEmailPayload;
  devCode?: string;
};

export type RevokeInvitationResponse = {
  invitation: WorkerInvitationAdminView;
  alreadyRevoked?: boolean;
};

export type ResendInvitationResponse = {
  invitation: WorkerInvitationAdminView;
  email?: InvitationEmailPayload;
  devCode?: string;
};

export type ApiErrorResponse = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchWorkerInvitations(): Promise<
  | { ok: true; invitations: WorkerInvitationAdminView[] }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch("/api/admin/workers/invitations");

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  const payload = await parseJson<InvitationsListResponse>(response);
  return { ok: true, invitations: payload?.invitations ?? [] };
}

export async function createWorkerInvitation(input: {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  permissionNames: string[];
}): Promise<
  | {
      ok: true;
      invitation: WorkerInvitationAdminView;
      email?: InvitationEmailPayload;
      devCode?: string;
    }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch("/api/admin/workers/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await parseJson<CreateInvitationResponse & ApiErrorResponse>(
    response,
  );

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  if (!payload?.invitation) {
    return { ok: false, status: 500, error: "unknown" };
  }

  return {
    ok: true,
    invitation: payload.invitation,
    email: payload.email,
    devCode: payload.devCode,
  };
}

export async function revokeWorkerInvitation(
  invitationId: string,
): Promise<
  | { ok: true; invitation: WorkerInvitationAdminView; alreadyRevoked: boolean }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/workers/invitations/${encodeURIComponent(invitationId)}/revoke`,
    { method: "POST" },
  );

  const payload = await parseJson<RevokeInvitationResponse & ApiErrorResponse>(
    response,
  );

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  if (!payload?.invitation) {
    return { ok: false, status: 500, error: "unknown" };
  }

  return {
    ok: true,
    invitation: payload.invitation,
    alreadyRevoked: Boolean(payload.alreadyRevoked),
  };
}

export async function resendWorkerInvitation(
  invitationId: string,
): Promise<
  | {
      ok: true;
      invitation: WorkerInvitationAdminView;
      email?: InvitationEmailPayload;
      devCode?: string;
    }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/workers/invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: "POST" },
  );

  const payload = await parseJson<ResendInvitationResponse & ApiErrorResponse>(
    response,
  );

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  if (!payload?.invitation) {
    return { ok: false, status: 500, error: "unknown" };
  }

  return {
    ok: true,
    invitation: payload.invitation,
    email: payload.email,
    devCode: payload.devCode,
  };
}

export async function setInternalUserActiveRequest(
  userId: string,
  active: boolean,
): Promise<
  | { ok: true; user: AdminUserView }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    },
  );

  const payload = await parseJson<{ user?: AdminUserView } & ApiErrorResponse>(
    response,
  );

  if (!response.ok || !payload?.user) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  return { ok: true, user: payload.user };
}

export async function deleteInternalUserRequest(
  userId: string,
): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );

  const payload = await parseJson<ApiErrorResponse>(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  return { ok: true };
}

export async function revokeInternalUserPrivilegesRequest(
  userId: string,
): Promise<
  | { ok: true; user: AdminUserView }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(userId)}/revoke`,
    { method: "POST" },
  );

  const payload = await parseJson<{ user?: AdminUserView } & ApiErrorResponse>(
    response,
  );

  if (!response.ok || !payload?.user) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  return { ok: true, user: payload.user };
}

export async function approveAccessRequestRequest(requestId: string): Promise<
  | {
      ok: true;
      invitation: WorkerInvitationAdminView;
      email?: InvitationEmailPayload;
      devCode?: string;
    }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/access-requests/${encodeURIComponent(requestId)}/approve`,
    { method: "POST" },
  );
  const payload = await parseJson<
    CreateInvitationResponse & ApiErrorResponse
  >(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  if (!payload?.invitation) {
    return { ok: false, status: 500, error: "unknown" };
  }

  return {
    ok: true,
    invitation: payload.invitation,
    email: payload.email,
    devCode: payload.devCode,
  };
}

export async function rejectAccessRequestRequest(requestId: string): Promise<
  | { ok: true; request: AccessRequest }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/access-requests/${encodeURIComponent(requestId)}/reject`,
    { method: "POST" },
  );
  const payload = await parseJson<{ request?: AccessRequest } & ApiErrorResponse>(
    response,
  );

  if (!response.ok || !payload?.request) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  return { ok: true, request: payload.request };
}

export async function updateInternalUserPermissionsRequest(input: {
  userId: string;
  permissionNames: string[];
}): Promise<
  | { ok: true; permissionNames: string[] }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/users/${encodeURIComponent(input.userId)}/permissions`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionNames: input.permissionNames }),
    },
  );

  const payload = await parseJson<
    { permissionNames?: string[] } & ApiErrorResponse
  >(response);

  if (!response.ok || !payload?.permissionNames) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  return { ok: true, permissionNames: payload.permissionNames };
}
