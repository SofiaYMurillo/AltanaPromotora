import {
  getAllowedAppointmentStatusTransitions,
} from "@/domain";
import type { Appointment, Client } from "@/domain";

import type { VisitResourceDisplay } from "../catalog/visit-resource-display";

export type AdminAppointmentClientView = Pick<
  Client,
  "id" | "email" | "phone" | "firstName" | "lastName"
>;

export type AdminAppointmentWorkerView = {
  id: string;
  displayName: string;
};

export type AdminAppointmentView = {
  appointment: Appointment;
  createdAt: string;
  updatedAt: string;
  allowedTransitions: Appointment["status"][];
  client: AdminAppointmentClientView | null;
  resource: VisitResourceDisplay;
  worker: AdminAppointmentWorkerView | null;
};

export function toAdminAppointmentView(input: {
  appointment: Appointment;
  createdAt: string;
  updatedAt: string;
  client: Client | null;
  worker: AdminAppointmentWorkerView | null;
  resource: VisitResourceDisplay;
}): AdminAppointmentView {
  return {
    appointment: input.appointment,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    allowedTransitions: getAllowedAppointmentStatusTransitions(
      input.appointment.status,
    ),
    client: input.client
      ? {
          id: input.client.id,
          email: input.client.email,
          phone: input.client.phone,
          firstName: input.client.firstName,
          lastName: input.client.lastName,
        }
      : null,
    resource: input.resource,
    worker: input.worker,
  };
}
