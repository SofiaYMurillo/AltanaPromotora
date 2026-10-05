import type { InternalNotification } from "@/domain";
import { isNotificationUnread } from "@/domain";

export type { InternalNotification };

export function notificationCategoryLabel(
  category: InternalNotification["category"],
) {
  return category === "security" ? "Seguridad" : "Administración";
}

export function notificationAction(notification: InternalNotification) {
  if (notification.type === "access_request_received") {
    return { href: "/admin/users", label: "Revisar solicitud" };
  }

  return null;
}

export function formatNotificationDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function mapNotificationApiError(error: string | undefined) {
  switch (error) {
    case "unauthorized":
    case "forbidden":
      return "Tu sesión no es válida. Inicia sesión nuevamente.";
    case "not_found":
      return "La notificación no está disponible.";
    default:
      return "No se pudieron actualizar las notificaciones. Intenta de nuevo.";
  }
}

export { isNotificationUnread };
