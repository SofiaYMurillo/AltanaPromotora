import type { AppointmentStatus } from "./appointment";
import type { Availability } from "./availability";
import { validateAvailabilitySchedule } from "./availability-slots";

export function getAllowedAppointmentStatusTransitions(
  status: AppointmentStatus,
): AppointmentStatus[] {
  switch (status) {
    case "pending":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["completed", "cancelled", "no_show"];
    case "completed":
    case "cancelled":
    case "no_show":
      return [];
    default:
      return [];
  }
}

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
) {
  return getAllowedAppointmentStatusTransitions(from).includes(to);
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isAvailabilityRuleValid(rule: Availability) {
  const result = validateAvailabilitySchedule({
    day: rule.day,
    startTime: rule.startTime,
    endTime: rule.endTime,
    interval: rule.interval,
    slotCapacity: rule.slotCapacity,
  });
  return result.ok;
}
