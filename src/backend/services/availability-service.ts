import {
  DEFAULT_AVAILABILITY_LOOKAHEAD_DAYS,
  MAX_AVAILABILITY_RANGE_DAYS,
  addCalendarDays,
  calendarDateKey,
  clockTimeKey,
  eachDateKey,
  generateSlotsForDay,
  isPastCalendarDate,
  isPastSlot,
  isValidDateKey,
  toPublicSlot,
  weekdayFromDateKey,
} from "@/domain";
import type {
  AvailabilityDaySlots,
  AvailabilityResourceType,
  AvailabilityRule,
  GeneratedSlot,
} from "@/domain";
import type { AvailabilityErrorCode } from "@/domain/availability-errors";
import { resolveAvailabilityOccupancyPropertyId } from "@/domain/availability-resources";

import { resolveVisitResourceCatalog } from "../catalog/visit-resource-catalog";
import * as appointmentRepository from "../repositories/appointment-repository";
import * as availabilityRepository from "../repositories/availability-repository";

export type PublicAvailabilityResult =
  | {
      ok: true;
      resourceType: AvailabilityResourceType;
      resourceId: string;
      days: AvailabilityDaySlots[];
    }
  | { ok: false; error: AvailabilityErrorCode };

export type BookableSlotResult =
  | { ok: true; slot: GeneratedSlot }
  | { ok: false; error: AvailabilityErrorCode };

function calendarNow() {
  const instant = new Date();
  return {
    todayKey: calendarDateKey(instant),
    nowTime: clockTimeKey(instant),
  };
}

function toSchedule(rule: AvailabilityRule) {
  return {
    day: rule.day,
    startTime: rule.startTime,
    endTime: rule.endTime,
    interval: rule.interval,
    slotCapacity: rule.slotCapacity,
  };
}

async function resolveActiveRules(
  resourceType: AvailabilityResourceType,
  resourceId: string,
): Promise<
  | { ok: true; rules: AvailabilityRule[] }
  | { ok: false; error: AvailabilityErrorCode }
> {
  const catalog = await resolveVisitResourceCatalog(resourceType, resourceId);

  // Persisted Property / configured Office is the authority: unknown and
  // inactive resources cannot be booked even if orphan availability rules remain.
  if (catalog !== "known") {
    return { ok: false, error: "invalid_resource" };
  }

  const rules = await availabilityRepository.listActiveRulesForResource(
    resourceType,
    resourceId,
  );

  return { ok: true, rules };
}

function resolveRange(input: {
  date?: string;
  from?: string;
  to?: string;
  todayKey: string;
}):
  | { ok: true; from: string; to: string }
  | { ok: false; error: AvailabilityErrorCode } {
  if (input.date) {
    if (!isValidDateKey(input.date)) {
      return { ok: false, error: "invalid_date" };
    }

    if (isPastCalendarDate(input.date, input.todayKey)) {
      return { ok: false, error: "invalid_date" };
    }

    return {
      ok: true,
      from: input.date,
      to: input.date,
    };
  }

  const from = input.from ?? input.todayKey;
  const to = input.to ?? addCalendarDays(from, DEFAULT_AVAILABILITY_LOOKAHEAD_DAYS);

  if (!isValidDateKey(from) || !isValidDateKey(to) || from > to) {
    return { ok: false, error: "invalid_date" };
  }

  const boundedFrom = from < input.todayKey ? input.todayKey : from;
  if (boundedFrom > to) {
    return { ok: false, error: "invalid_date" };
  }

  const span = eachDateKey(boundedFrom, to).length;
  if (span > MAX_AVAILABILITY_RANGE_DAYS) {
    return { ok: false, error: "invalid_date" };
  }

  return { ok: true, from: boundedFrom, to };
}

export async function getPublicAvailability(input: {
  resourceType: AvailabilityResourceType;
  resourceId: string;
  /** Concrete property when scheduleResourceId is the shared property-visit rules. */
  visitPropertyId?: string;
  date?: string;
  from?: string;
  to?: string;
}): Promise<PublicAvailabilityResult> {
  if (
    input.resourceType !== "property" &&
    input.resourceType !== "office"
  ) {
    return { ok: false, error: "invalid_resource" };
  }

  if (!input.resourceId.trim()) {
    return { ok: false, error: "invalid_resource" };
  }

  const resolved = await resolveActiveRules(
    input.resourceType,
    input.resourceId,
  );
  if (!resolved.ok) {
    return resolved;
  }

  const { todayKey, nowTime } = calendarNow();
  const range = resolveRange({
    date: input.date,
    from: input.from,
    to: input.to,
    todayKey,
  });
  if (!range.ok) {
    return range;
  }

  const occupancyPropertyId = resolveAvailabilityOccupancyPropertyId({
    resourceType: input.resourceType,
    scheduleResourceId: input.resourceId,
    visitPropertyId: input.visitPropertyId,
  });

  const occupying = await appointmentRepository.listOccupyingAppointmentsForResource({
    visitType: input.resourceType,
    resourceId:
      input.resourceType === "office"
        ? input.resourceId
        : (occupancyPropertyId ?? input.resourceId),
    from: range.from,
    to: range.to,
  });

  const days: AvailabilityDaySlots[] = [];

  for (const date of eachDateKey(range.from, range.to)) {
    const generated = generateSlotsForDay(
      resolved.rules.map(toSchedule),
      weekdayFromDateKey(date),
    );

    const slots = generated.map((slot) => {
      if (isPastSlot({ date, time: slot.startTime, todayKey, nowTime })) {
        return toPublicSlot(slot, slot.slotCapacity);
      }

      const occupied = occupying.filter(
        (appointment) =>
          appointment.date === date && appointment.time === slot.startTime,
      ).length;

      return toPublicSlot(slot, occupied);
    });

    days.push({ date, slots });
  }

  return {
    ok: true,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    days,
  };
}

/**
 * Validates that a requested civil date/time is a configured, bookable slot.
 * Capacity is re-checked inside the appointment write transaction.
 */
export async function resolveBookableSlot(input: {
  resourceType: AvailabilityResourceType;
  resourceId: string;
  date: string;
  time: string;
}): Promise<BookableSlotResult> {
  if (!isValidDateKey(input.date)) {
    return { ok: false, error: "invalid_date" };
  }

  const { todayKey, nowTime } = calendarNow();
  if (isPastCalendarDate(input.date, todayKey)) {
    return { ok: false, error: "invalid_date" };
  }

  const resolved = await resolveActiveRules(
    input.resourceType,
    input.resourceId,
  );
  if (!resolved.ok) {
    return resolved;
  }

  if (resolved.rules.length === 0) {
    return { ok: false, error: "no_availability" };
  }

  const generated = generateSlotsForDay(
    resolved.rules.map(toSchedule),
    weekdayFromDateKey(input.date),
  );
  const slot = generated.find((item) => item.startTime === input.time);

  if (!slot) {
    return generated.length === 0
      ? { ok: false, error: "no_availability" }
      : { ok: false, error: "invalid_time" };
  }

  if (isPastSlot({ date: input.date, time: input.time, todayKey, nowTime })) {
    return { ok: false, error: "unavailable_slot" };
  }

  return { ok: true, slot };
}
