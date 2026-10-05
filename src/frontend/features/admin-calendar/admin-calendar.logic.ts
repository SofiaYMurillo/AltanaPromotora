import { appointmentCalendarPhase } from "@/domain";
import type { CalendarAppointment, CalendarAppointmentPhase } from "@/domain";
import { mapAdminAppointmentError } from "@/frontend/features/admin-appointments/admin-appointments.logic";

import type { CalendarHourGroup } from "./admin-calendar.types";

export function formatCalendarDayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatCalendarHour(hour: string) {
  const [hours, minutes] = hour.split(":").map(Number);
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    hour12: true,
  }).format(value);
}

export function getCalendarPhaseLabel(phase: CalendarAppointmentPhase) {
  return phase === "active" ? "Activa" : "Cerrada";
}

export function countActiveCalendarAppointments(
  appointments: CalendarAppointment[],
) {
  return appointments.filter(
    (item) => appointmentCalendarPhase(item.status) === "active",
  ).length;
}

/** Chronological buckets by clock hour; appointments arrive already ordered. */
export function groupCalendarAppointmentsByHour(
  appointments: CalendarAppointment[],
): CalendarHourGroup[] {
  const groups: CalendarHourGroup[] = [];

  for (const appointment of appointments) {
    const hour = `${appointment.startTime.slice(0, 2)}:00`;
    const current = groups.at(-1);

    if (current?.hour === hour) {
      current.appointments.push(appointment);
      continue;
    }

    groups.push({ hour, appointments: [appointment] });
  }

  return groups;
}

export function mapCalendarError(error: string | undefined) {
  switch (error) {
    case "invalid_date":
      return "La fecha seleccionada no es válida.";
    case "range_too_large":
      return "El rango solicitado excede el máximo permitido.";
    case "invalid_status":
      return "El estado indicado no es válido.";
    case "invalid_resource":
      return "El recurso indicado no es válido.";
    default:
      return mapAdminAppointmentError(error);
  }
}
