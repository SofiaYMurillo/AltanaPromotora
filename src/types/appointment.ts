/**
 * LEGACY — not the visit-appointment domain.
 *
 * Canonical visit appointments live in `@/domain/appointment`.
 * This shape remains only for orphaned mock config compatibility.
 * Do not use as a second source of truth for public or admin visits.
 */

export type LegacyAppointmentStatus =
  | "pending"
  | "accepted"
  | "rescheduled"
  | "cancelled";

/** @deprecated Use `@/domain` Appointment for visit bookings. */
export type AppointmentStatus = LegacyAppointmentStatus;

/** @deprecated Use `@/domain` Appointment for visit bookings. */
export interface Appointment {
  id: string;
  userId: string;
  scheduledAt: string;
  status: LegacyAppointmentStatus;
  createdAt: string;
  updatedAt: string;
}
