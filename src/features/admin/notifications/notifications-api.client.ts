import type { InternalNotification } from "@/domain";

export type NotificationsListResponse = {
  notifications: InternalNotification[];
  unreadCount: number;
};

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

export async function fetchNotifications(): Promise<
  | { ok: true; notifications: InternalNotification[]; unreadCount: number }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch("/api/admin/notifications");

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  const payload = await parseJson<NotificationsListResponse>(response);
  return {
    ok: true,
    notifications: payload?.notifications ?? [],
    unreadCount: payload?.unreadCount ?? 0,
  };
}

export async function markNotificationRead(id: string): Promise<
  | { ok: true; notification: InternalNotification; unreadCount: number }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch(
    `/api/admin/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH" },
  );

  const payload = await parseJson<{
    notification?: InternalNotification;
    unreadCount?: number;
    error?: string;
  }>(response);

  if (!response.ok || !payload?.notification) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  return {
    ok: true,
    notification: payload.notification,
    unreadCount: payload.unreadCount ?? 0,
  };
}

export async function markAllNotificationsRead(): Promise<
  | { ok: true; notifications: InternalNotification[]; unreadCount: number }
  | { ok: false; status: number; error: string }
> {
  const response = await fetch("/api/admin/notifications/read-all", {
    method: "POST",
  });

  const payload = await parseJson<NotificationsListResponse & ApiErrorResponse>(
    response,
  );

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? "unknown",
    };
  }

  return {
    ok: true,
    notifications: payload?.notifications ?? [],
    unreadCount: payload?.unreadCount ?? 0,
  };
}
