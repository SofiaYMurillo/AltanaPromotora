import type {
  Appointment,
  AppointmentStatus,
  AppointmentVisitType,
} from "./appointment";

/**
 * System default when a schedule rule does not declare slotCapacity.
 * Persisted rules store their own value; public clients never send this.
 */
export const DEFAULT_SLOT_CAPACITY = 1;

/**
 * Statuses that consume resource capacity for a slot.
 * Configurable list — easy to adjust when backend owns the rule.
 */
export const CAPACITY_CONSUMING_STATUSES: readonly AppointmentStatus[] = [
  "pending",
  "confirmed",
] as const;

export function appointmentOccupiesCapacity(
  status: AppointmentStatus,
): boolean {
  return CAPACITY_CONSUMING_STATUSES.includes(status);
}

export function appointmentMatchesResource(
  appointment: Appointment,
  visitType: AppointmentVisitType,
  resourceId: string,
) {
  if (visitType === "property") {
    return (
      appointment.type === "property" && appointment.propertyId === resourceId
    );
  }

  return (
    appointment.type === "office" &&
    appointment.officeLocationId === resourceId
  );
}

export function countResourceSlotOccupation(input: {
  appointments: Appointment[];
  visitType: AppointmentVisitType;
  resourceId: string;
  date: string;
  time: string;
  /** Exclude an appointment id (e.g. when editing the same record). */
  excludeAppointmentId?: string;
}) {
  return input.appointments.reduce((count, appointment) => {
    if (
      input.excludeAppointmentId &&
      appointment.id === input.excludeAppointmentId
    ) {
      return count;
    }

    if (!appointmentOccupiesCapacity(appointment.status)) {
      return count;
    }

    if (appointment.date !== input.date || appointment.time !== input.time) {
      return count;
    }

    if (
      !appointmentMatchesResource(
        appointment,
        input.visitType,
        input.resourceId,
      )
    ) {
      return count;
    }

    return count + 1;
  }, 0);
}

export function isResourceSlotAvailable(input: {
  appointments: Appointment[];
  visitType: AppointmentVisitType;
  resourceId: string;
  date: string;
  time: string;
  capacity?: number;
  excludeAppointmentId?: string;
}) {
  const capacity = input.capacity ?? DEFAULT_SLOT_CAPACITY;
  const occupied = countResourceSlotOccupation(input);
  return occupied < capacity;
}

/**
 * Build occupied date|time keys for a resource when capacity is exhausted.
 * Capacity > 1 allows multiple active appointments on the same slot.
 */
export function buildOccupiedSlotKeys(input: {
  appointments: Appointment[];
  visitType: AppointmentVisitType;
  resourceId: string;
  capacity?: number;
}) {
  const capacity = input.capacity ?? DEFAULT_SLOT_CAPACITY;
  const occupationByKey = new Map<string, number>();

  for (const appointment of input.appointments) {
    if (!appointmentOccupiesCapacity(appointment.status)) {
      continue;
    }

    if (
      !appointmentMatchesResource(
        appointment,
        input.visitType,
        input.resourceId,
      )
    ) {
      continue;
    }

    const key = `${appointment.date}|${appointment.time}`;
    occupationByKey.set(key, (occupationByKey.get(key) ?? 0) + 1);
  }

  const occupied = new Set<string>();

  for (const [key, count] of occupationByKey) {
    if (count >= capacity) {
      occupied.add(key);
    }
  }

  return occupied;
}

export function hasActiveResourceSlotConflict(input: {
  appointments: Appointment[];
  appointmentId?: string;
  type: AppointmentVisitType;
  resourceId: string;
  date: string;
  time: string;
  capacity?: number;
}) {
  return !isResourceSlotAvailable({
    appointments: input.appointments,
    visitType: input.type,
    resourceId: input.resourceId,
    date: input.date,
    time: input.time,
    capacity: input.capacity,
    excludeAppointmentId: input.appointmentId,
  });
}
