"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdminCard, AdminPage } from "@/features/admin";
import type { InternalNotification } from "@/domain";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications-api.client";
import {
  formatNotificationDate,
  isNotificationUnread,
  mapNotificationApiError,
  notificationAction,
  notificationCategoryLabel,
} from "./notifications.logic";
import type { NotificationsPageData } from "./notifications.types";

type NotificationsPageProps = {
  data: NotificationsPageData;
};

const actionButtonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function NotificationsPage({ data }: NotificationsPageProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<InternalNotification[]>(
    data.notifications,
  );
  const [unreadCount, setUnreadCount] = useState(data.unreadCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const handleAuthFailure = useCallback(
    (status: number) => {
      if (status === 401 || status === 403) {
        router.push("/admin/login");
      }
    },
    [router],
  );

  async function handleMarkRead(id: string) {
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    const result = await markNotificationRead(id);
    setPending(false);

    if (!result.ok) {
      handleAuthFailure(result.status);
      setError(mapNotificationApiError(result.error));
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === result.notification.id ? result.notification : item,
      ),
    );
    setUnreadCount(result.unreadCount);
    setSuccess("Notificación marcada como leída.");
    router.refresh();
  }

  async function handleMarkAll() {
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    const result = await markAllNotificationsRead();
    setPending(false);

    if (!result.ok) {
      handleAuthFailure(result.status);
      setError(mapNotificationApiError(result.error));
      return;
    }

    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    setSuccess("Todas las notificaciones se marcaron como leídas.");
    router.refresh();
  }

  return (
    <AdminPage
      title="Notificaciones"
      description="Avisos administrativos y de seguridad. Independientes del historial de auditoría."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-muted">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : "No hay notificaciones sin leer"}
          </p>
          {unreadCount > 0 ? (
            <button
              type="button"
              className={actionButtonClassName}
              onClick={handleMarkAll}
              disabled={pending}
            >
              {pending ? "Guardando…" : "Marcar todas como leídas"}
            </button>
          ) : null}
        </div>

        {success ? (
          <p
            className="rounded-md border border-accent/40 bg-background px-4 py-3 text-body-sm text-foreground"
            role="status"
          >
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="text-body-sm text-foreground" role="alert">
            {error}
          </p>
        ) : null}

        {notifications.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              No hay notificaciones registradas.
            </p>
          </AdminCard>
        ) : (
          <ul className="flex flex-col gap-4">
            {notifications.map((notification) => {
              const unread = isNotificationUnread(notification);

              return (
                <li key={notification.id}>
                  <AdminCard>
                    <article className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-body-md text-foreground">
                          {notification.title}
                        </p>
                        <span className="text-caption text-muted">
                          {notificationCategoryLabel(notification.category)}
                        </span>
                        {unread ? (
                          <span className="text-caption text-foreground">
                            Nueva
                          </span>
                        ) : (
                          <span className="text-caption text-muted">
                            Leída
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-muted">
                        {notification.message}
                      </p>
                      <p className="text-caption text-muted">
                        {formatNotificationDate(notification.createdAt)}
                      </p>
                      {notificationAction(notification) ? (
                        <Link
                          href={notificationAction(notification)!.href}
                          className="text-label text-accent transition-opacity hover:opacity-80"
                        >
                          {notificationAction(notification)!.label}
                        </Link>
                      ) : null}
                      {unread ? (
                        <button
                          type="button"
                          className={actionButtonClassName}
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={pending}
                        >
                          Marcar como leída
                        </button>
                      ) : null}
                    </article>
                  </AdminCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminPage>
  );
}
