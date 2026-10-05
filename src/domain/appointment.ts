/**
 * Domain contracts for visit appointments.
 * Authoritative business rules will live in backend later.
 * Frontend uses these types + pure helpers only.
 */

export type AppointmentVisitType = "property" | "office";

export type AppointmentCommunicationPreference =
  | "whatsapp"
  | "email"
  | "none";

/**
 * Visit appointment lifecycle.
 * `no_show` is reserved for confirmed visits where the visitor did not attend.
 * Penalties / abuse rules are intentionally out of scope.
 */
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

/** @deprecated Prefer `AppointmentStatus`. Kept for existing feature imports. */
export type VisitAppointmentStatus = AppointmentStatus;

export interface Appointment {
  id: string;
  type: AppointmentVisitType;
  propertyId?: string;
  officeLocationId?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  communicationPreference: AppointmentCommunicationPreference;
  contact?: {
    email?: string;
    phone?: string;
  };
  /** Optional link to an identified Client; not required for visitors. */
  clientId?: string;
  /** Internal User id with role worker; optional until assigned. */
  assignedWorkerId?: string;
}
