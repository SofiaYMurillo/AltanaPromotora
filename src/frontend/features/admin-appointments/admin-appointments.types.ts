import type {
  Appointment,
  AppointmentStatus,
  AppointmentVisitType,
  Client,
} from "@/domain";

export type AdminAppointmentClientView = Pick<
  Client,
  "id" | "email" | "phone" | "firstName" | "lastName"
>;

export type AdminAppointmentResourceView = {
  type: AppointmentVisitType;
  id: string;
  title: string;
  location: string;
  missing: boolean;
};

export type AdminAppointmentView = {
  appointment: Appointment;
  createdAt: string;
  updatedAt: string;
  allowedTransitions: AppointmentStatus[];
  client: AdminAppointmentClientView | null;
  resource: AdminAppointmentResourceView;
  worker: { id: string; displayName: string } | null;
};

export type AdminAppointmentFilters = {
  status?: AppointmentStatus;
  resourceType?: AppointmentVisitType;
  from?: string;
  to?: string;
  search?: string;
};
