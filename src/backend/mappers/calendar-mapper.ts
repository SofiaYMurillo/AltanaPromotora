import type {
  Appointment,
  CalendarAppointment,
  Client,
} from "@/domain";

import type { VisitResourceDisplay } from "../catalog/visit-resource-display";

function clientDisplay(client: Client | null) {
  if (!client) {
    return "Sin cliente registrado";
  }

  const name = [client.firstName, client.lastName]
    .filter((part) => Boolean(part?.trim()))
    .join(" ")
    .trim();

  return name || client.email || client.phone || "Sin cliente registrado";
}

function contactDisplay(appointment: Appointment, client: Client | null) {
  const values = [
    appointment.contact?.email ?? client?.email,
    appointment.contact?.phone ?? client?.phone,
  ].filter((value): value is string => Boolean(value?.trim()));

  return values.length > 0 ? values.join(" · ") : null;
}

/**
 * Appointment record → agenda read model.
 * Internal identifiers the agenda does not render (clientId, assignedWorkerId)
 * are intentionally dropped here. Resource labels are resolved upstream from
 * persisted Property / officeLocations so the mapper stays sync and free of I/O.
 */
export function toCalendarAppointment(input: {
  appointment: Appointment;
  client: Client | null;
  workerDisplayName: string | null;
  resource: VisitResourceDisplay;
}): CalendarAppointment {
  const { appointment } = input;

  return {
    id: appointment.id,
    date: appointment.date,
    startTime: appointment.time,
    status: appointment.status,
    resource: input.resource,
    clientDisplay: clientDisplay(input.client),
    contactDisplay: contactDisplay(appointment, input.client),
    workerDisplay: input.workerDisplayName,
  };
}
