"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  formatUnreadBadgeCount,
  type InternalNotification,
} from "@/domain";

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications/notifications-api.client";
import {
  formatNotificationDate,
  isNotificationUnread,
  mapNotificationApiError,
  notificationAction,
  notificationCategoryLabel,
} from "./notifications/notifications.logic";

type AdminNotificationCenterProps = {
  initialUnreadCount: number;
};

const panelClassName =
  "absolute right-0 z-50 mt-2 flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden rounded-md border border-border bg-surface shadow-sm";

const actionButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function AdminNotificationCenter({
  initialUnreadCount,
}: AdminNotificationCenterProps) {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [syncedInitialUnreadCount, setSyncedInitialUnreadCount] =
    useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<InternalNotification[]>(
    [],
  );
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleAuthFailure = useCallback(
    (status: number) => {
      if (status === 401 || status === 403) {
        router.push("/admin/login");
      }
    },
    [router],
  );

  const loadNotifications = useCallback(async () => {
    setPending(true);
    setError(undefined);
    const result = await fetchNotifications();
    setPending(false);

    if (!result.ok) {
      handleAuthFailure(result.status);
      setError(mapNotificationApiError(result.error));
      return;
    }

    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    setLoaded(true);
  }, [handleAuthFailure]);

  if (initialUnreadCount !== syncedInitialUnreadCount) {
    setSyncedInitialUnreadCount(initialUnreadCount);
    setUnreadCount(initialUnreadCount);
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchNotifications().then((result) => {
        if (result.ok) {
          setUnreadCount(result.unreadCount);
          if (open) {
            setNotifications(result.notifications);
            setLoaded(true);
          }
        }
      });
    }, 12000);

    return () => window.clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadNotifications();
    }
  }

  async function handleMarkRead(id: string) {
    setActionPending(true);
    setError(undefined);
    const result = await markNotificationRead(id);
    setActionPending(false);

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
  }

  async function handleMarkAll() {
    setActionPending(true);
    setError(undefined);
    const result = await markAllNotificationsRead();
    setActionPending(false);

    if (!result.ok) {
      handleAuthFailure(result.status);
      setError(mapNotificationApiError(result.error));
      return;
    }

    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  }

  const badge = formatUnreadBadgeCount(unreadCount);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={toggleOpen}
      >
        Notificaciones
        {badge ? (
          <span className="inline-flex min-w-6 items-center justify-center rounded-md border border-accent/40 px-1.5 text-caption text-foreground">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Centro de notificaciones"
          className={panelClassName}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <p className="text-label text-foreground">Notificaciones</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                className={actionButtonClassName}
                onClick={handleMarkAll}
                disabled={actionPending || pending}
              >
                {actionPending ? "Guardando…" : "Marcar todas"}
              </button>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto">
            {pending && !loaded ? (
              <p className="px-4 py-6 text-body-sm text-muted" role="status">
                Cargando notificaciones…
              </p>
            ) : error ? (
              <p className="px-4 py-6 text-body-sm text-foreground" role="alert">
                {error}
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-body-sm text-muted">
                No hay notificaciones.
              </p>
            ) : (
              <ul className="flex flex-col">
                {notifications.map((notification) => {
                  const unread = isNotificationUnread(notification);

                  return (
                    <li
                      key={notification.id}
                      className="border-b border-border px-4 py-3 last:border-b-0"
                    >
                      <article className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-body-sm text-foreground">
                            {notification.title}
                          </p>
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
                          {notificationCategoryLabel(notification.category)}
                          {" · "}
                          {formatNotificationDate(notification.createdAt)}
                        </p>
                        {notificationAction(notification) ? (
                          <Link
                            href={notificationAction(notification)!.href}
                            className="text-label text-accent"
                            onClick={() => setOpen(false)}
                          >
                            {notificationAction(notification)!.label}
                          </Link>
                        ) : null}
                        {unread ? (
                          <button
                            type="button"
                            className={actionButtonClassName}
                            onClick={() => handleMarkRead(notification.id)}
                            disabled={actionPending}
                          >
                            Marcar como leída
                          </button>
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <Link
              href="/admin/notifications"
              className="text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              onClick={() => setOpen(false)}
            >
              Ver todas
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
