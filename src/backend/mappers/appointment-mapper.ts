import type { Appointment } from "@/domain";
import type { Appointment as AppointmentRow } from "@/generated/prisma/client";

/**
 * Public booking confirmation — omits internal linkage fields.
 * clientId / assignedWorkerId stay server-side only.
 */
export type PublicAppointmentConfirmation = Omit<
  Appointment,
  "clientId" | "assignedWorkerId"
>;

export function toPublicAppointmentConfirmation(
  appointment: Appointment,
): PublicAppointmentConfirmation {
  return {
    id: appointment.id,
    type: appointment.type,
    propertyId: appointment.propertyId,
    officeLocationId: appointment.officeLocationId,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    communicationPreference: appointment.communicationPreference,
    contact: appointment.contact,
  };
}

export function toDomainAppointment(row: AppointmentRow): Appointment {
  const contact =
    row.contactEmail || row.contactPhone
      ? {
          email: row.contactEmail ?? undefined,
          phone: row.contactPhone ?? undefined,
        }
      : undefined;

  return {
    id: row.id,
    type: row.type as Appointment["type"],
    propertyId: row.propertyId ?? undefined,
    officeLocationId: row.officeLocationId ?? undefined,
    date: row.date,
    time: row.time,
    status: row.status as Appointment["status"],
    communicationPreference:
      row.communicationPreference as Appointment["communicationPreference"],
    contact,
    clientId: row.clientId ?? undefined,
    assignedWorkerId: row.assignedWorkerId ?? undefined,
  };
}

export function toPrismaAppointmentData(appointment: Appointment) {
  return {
    id: appointment.id,
    type: appointment.type,
    propertyId: appointment.propertyId ?? null,
    officeLocationId: appointment.officeLocationId ?? null,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    communicationPreference: appointment.communicationPreference,
    contactEmail: appointment.contact?.email ?? null,
    contactPhone: appointment.contact?.phone ?? null,
    clientId: appointment.clientId ?? null,
    assignedWorkerId: appointment.assignedWorkerId ?? null,
  };
}
