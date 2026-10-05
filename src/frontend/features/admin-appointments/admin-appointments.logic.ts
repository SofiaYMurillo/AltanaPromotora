import type { AppointmentStatus, AppointmentVisitType } from "@/domain";

import type { AdminAppointmentClientView } from "./admin-appointments.types";

export function getAppointmentStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "confirmed":
      return "Confirmada";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    case "no_show":
      return "No asistió";
    default:
      return status;
  }
}

export function getVisitTypeLabel(type: AppointmentVisitType) {
  return type === "office" ? "Visita a sede" : "Visita a inmueble";
}

export function getStatusActionLabel(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return "Confirmar";
    case "cancelled":
      return "Cancelar";
    case "completed":
      return "Completar";
    case "no_show":
      return "Marcar no asistió";
    default:
      return getAppointmentStatusLabel(status);
  }
}

export function statusNeedsConfirmation(status: AppointmentStatus) {
  return status === "cancelled" || status === "no_show";
}

export function clientDisplayName(client: AdminAppointmentClientView | null) {
  if (!client) {
    return "Sin cliente registrado";
  }

  const name = [client.firstName, client.lastName]
    .filter((part) => Boolean(part?.trim()))
    .join(" ")
    .trim();

  if (name) {
    return name;
  }

  if (client.email) {
    return client.email;
  }

  if (client.phone) {
    return client.phone;
  }

  return "Sin cliente registrado";
}

export function formatAppointmentDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatAppointmentTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

export function mapAdminAppointmentError(error: string | undefined) {
  switch (error) {
    case "unauthorized":
      return "Debes iniciar sesión para gestionar citas.";
    case "forbidden":
      return "No tienes autorización para esta operación.";
    case "not_found":
      return "La cita ya no está disponible.";
    case "invalid_transition":
      return "Ese cambio de estado no está permitido.";
    case "conflict":
      return "La cita cambió mientras la actualizabas. Recarga e inténtalo de nuevo.";
    case "forbidden_field":
      return "Esa modificación no está permitida.";
    case "invalid_status":
      return "El estado indicado no es válido.";
    default:
      return "No se pudo completar la operación. Intenta de nuevo.";
  }
}
