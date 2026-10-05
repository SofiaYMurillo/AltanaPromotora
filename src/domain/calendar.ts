/**
 * Administrative agenda contracts.
 *
 * Calendar is a read projection of Appointment. It is never persisted, never
 * holds appointment state, and never redefines capacity or availability.
 * Changing the visual representation (day, week, month) must not require
 * changing Appointment.
 */

import type { AppointmentStatus, AppointmentVisitType } from "./appointment";
import { addCalendarDays, eachDateKey, isValidDateKey } from "./availability-time";
import { appointmentOccupiesCapacity } from "./capacity";

/** Upper bound for a single agenda query. Keeps history reads bounded. */
export const MAX_CALENDAR_RANGE_DAYS = 31;

/** Presentation grouping only. The status machine stays in appointment-rules. */
export type CalendarAppointmentPhase = "active" | "closed";

export type CalendarResource = {
  type: AppointmentVisitType;
  id: string;
  title: string;
  location: string;
  missing: boolean;
};

/**
 * Read model for one agenda entry.
 * Deliberately narrower than Appointment: no clientId, no assignedWorkerId,
 * no persistence timestamps.
 */
export type CalendarAppointment = {
  id: string;
  date: string;
  startTime: string;
  status: AppointmentStatus;
  resource: CalendarResource;
  clientDisplay: string;
  contactDisplay: string | null;
  workerDisplay: string | null;
};

export type CalendarDay = {
  date: string;
  appointments: CalendarAppointment[];
};

export type CalendarRange = {
  from: string;
  to: string;
};

export type CalendarRangeError = "invalid_date" | "range_too_large";

/** Active = still occupying capacity (same rule as Availability). */
export function appointmentCalendarPhase(
  status: AppointmentStatus,
): CalendarAppointmentPhase {
  return appointmentOccupiesCapacity(status) ? "active" : "closed";
}

/**
 * Resolves a bounded civil-date range. Past dates are allowed: the agenda also
 * serves as an operational history view.
 */
export function resolveCalendarRange(input: {
  date?: string;
  from?: string;
  to?: string;
  fallbackDate: string;
}): { ok: true; range: CalendarRange } | { ok: false; error: CalendarRangeError } {
  if (input.date !== undefined) {
    if (!isValidDateKey(input.date)) {
      return { ok: false, error: "invalid_date" };
    }

    return { ok: true, range: { from: input.date, to: input.date } };
  }

  const from = input.from ?? input.fallbackDate;
  const to = input.to ?? from;

  if (!isValidDateKey(from) || !isValidDateKey(to) || from > to) {
    return { ok: false, error: "invalid_date" };
  }

  if (eachDateKey(from, to).length > MAX_CALENDAR_RANGE_DAYS) {
    return { ok: false, error: "range_too_large" };
  }

  return { ok: true, range: { from, to } };
}

export function compareCalendarAppointments(
  a: CalendarAppointment,
  b: CalendarAppointment,
) {
  if (a.date !== b.date) {
    return a.date < b.date ? -1 : 1;
  }

  if (a.startTime !== b.startTime) {
    return a.startTime < b.startTime ? -1 : 1;
  }

  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Every date in the range is present, including days without appointments. */
export function groupCalendarAppointmentsByDay(
  range: CalendarRange,
  appointments: CalendarAppointment[],
): CalendarDay[] {
  const byDate = new Map<string, CalendarAppointment[]>();

  for (const appointment of appointments) {
    const bucket = byDate.get(appointment.date);
    if (bucket) {
      bucket.push(appointment);
      continue;
    }
    byDate.set(appointment.date, [appointment]);
  }

  return eachDateKey(range.from, range.to).map((date) => ({
    date,
    appointments: (byDate.get(date) ?? []).sort(compareCalendarAppointments),
  }));
}

export function shiftCalendarDate(date: string, days: number) {
  return addCalendarDays(date, days);
}
