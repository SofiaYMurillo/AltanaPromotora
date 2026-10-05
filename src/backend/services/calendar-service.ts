import {
  calendarDateKey,
  groupCalendarAppointmentsByDay,
  resolveCalendarRange,
} from "@/domain";
import type {
  AppointmentStatus,
  AppointmentVisitType,
  CalendarDay,
  CalendarRange,
  CalendarRangeError,
} from "@/domain";

import { toCalendarAppointment } from "../mappers/calendar-mapper";
import {
  loadVisitResourceDisplays,
  visitResourceDisplayKey,
} from "../catalog/visit-resource-display";
import * as appointmentRepository from "../repositories/appointment-repository";
import * as userRepository from "../repositories/user-repository";

const STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const VISIT_TYPES: AppointmentVisitType[] = ["property", "office"];

export type CalendarQueryError =
  | CalendarRangeError
  | "invalid_status"
  | "invalid_resource";

export type CalendarQueryInput = {
  date?: string;
  from?: string;
  to?: string;
  status?: string;
  resourceType?: string;
  resourceId?: string;
};

export type CalendarQuery = {
  range: CalendarRange;
  status?: AppointmentStatus;
  resourceType?: AppointmentVisitType;
  resourceId?: string;
};

export type AdminCalendarResult =
  | { ok: true; range: CalendarRange; days: CalendarDay[] }
  | { ok: false; error: CalendarQueryError };

/** Civil "today" in the business calendar timezone, not the host timezone. */
export function calendarToday() {
  return calendarDateKey(new Date());
}

/**
 * Validates every agenda query parameter in the backend.
 * A filter that cannot be honoured is rejected instead of silently ignored.
 */
export function parseCalendarQuery(
  input: CalendarQueryInput,
  fallbackDate: string,
): { ok: true; query: CalendarQuery } | { ok: false; error: CalendarQueryError } {
  const range = resolveCalendarRange({
    date: input.date,
    from: input.from,
    to: input.to,
    fallbackDate,
  });

  if (!range.ok) {
    return { ok: false, error: range.error };
  }

  if (input.status !== undefined && !STATUSES.includes(input.status as AppointmentStatus)) {
    return { ok: false, error: "invalid_status" };
  }

  if (
    input.resourceType !== undefined &&
    !VISIT_TYPES.includes(input.resourceType as AppointmentVisitType)
  ) {
    return { ok: false, error: "invalid_resource" };
  }

  const resourceId = input.resourceId?.trim() || undefined;
  if (resourceId && !input.resourceType) {
    return { ok: false, error: "invalid_resource" };
  }

  return {
    ok: true,
    query: {
      range: range.range,
      status: input.status as AppointmentStatus | undefined,
      resourceType: input.resourceType as AppointmentVisitType | undefined,
      resourceId,
    },
  };
}

async function resolveWorkerNames(workerIds: string[]) {
  const unique = [...new Set(workerIds)];
  const users = await Promise.all(
    unique.map(async (id) => [id, await userRepository.findUserById(id)] as const),
  );

  return new Map(
    users.map(([id, user]) => [
      id,
      user ? `${user.firstName} ${user.lastName}` : "Trabajador no disponible",
    ]),
  );
}

/**
 * Reads the agenda for a bounded range. Appointment remains the single source
 * of truth: nothing is created, updated, or recalculated here.
 */
export async function getAdminCalendar(
  input: CalendarQueryInput = {},
): Promise<AdminCalendarResult> {
  const parsed = parseCalendarQuery(input, calendarToday());
  if (!parsed.ok) {
    return parsed;
  }

  const { range, status, resourceType, resourceId } = parsed.query;

  const records = await appointmentRepository.listAppointmentRecords({
    from: range.from,
    to: range.to,
    status,
    resourceType,
    resourceId,
  });

  const workerNames = await resolveWorkerNames(
    records
      .map((record) => record.appointment.assignedWorkerId)
      .filter((id): id is string => Boolean(id)),
  );

  const resourceRefs = records.map((record) => ({
    type: record.appointment.type,
    resourceId:
      record.appointment.type === "property"
        ? record.appointment.propertyId
        : record.appointment.officeLocationId,
  }));
  const displays = await loadVisitResourceDisplays(resourceRefs);

  const appointments = records.map((record, index) =>
    toCalendarAppointment({
      appointment: record.appointment,
      client: record.client,
      workerDisplayName: record.appointment.assignedWorkerId
        ? workerNames.get(record.appointment.assignedWorkerId) ?? null
        : null,
      resource: displays.get(visitResourceDisplayKey(resourceRefs[index]))!,
    }),
  );

  return {
    ok: true,
    range,
    days: groupCalendarAppointmentsByDay(range, appointments),
  };
}
