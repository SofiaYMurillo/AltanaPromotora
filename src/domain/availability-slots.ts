import type {
  Availability,
  AvailabilityDay,
  AvailabilitySlot,
} from "./availability";
import { DEFAULT_SLOT_CAPACITY } from "./capacity";
import {
  clockTimeToMinutes,
  isAvailabilityDay,
  isValidClockTime,
  minutesToClockTime,
} from "./availability-time";

export type AvailabilityRuleIssue =
  | "invalid_day"
  | "invalid_start_time"
  | "invalid_end_time"
  | "invalid_range"
  | "invalid_interval"
  | "invalid_capacity";

export type GeneratedSlot = {
  startTime: string;
  endTime: string;
  slotCapacity: number;
};

export function validateAvailabilitySchedule(rule: {
  day: number;
  startTime: string;
  endTime: string;
  interval: number;
  slotCapacity?: number;
  requireCapacity?: boolean;
}): { ok: true } | { ok: false; error: AvailabilityRuleIssue } {
  if (!isAvailabilityDay(rule.day)) {
    return { ok: false, error: "invalid_day" };
  }

  if (!isValidClockTime(rule.startTime)) {
    return { ok: false, error: "invalid_start_time" };
  }

  if (!isValidClockTime(rule.endTime)) {
    return { ok: false, error: "invalid_end_time" };
  }

  if (clockTimeToMinutes(rule.startTime) >= clockTimeToMinutes(rule.endTime)) {
    return { ok: false, error: "invalid_range" };
  }

  if (!Number.isInteger(rule.interval) || rule.interval <= 0) {
    return { ok: false, error: "invalid_interval" };
  }

  if (rule.requireCapacity || rule.slotCapacity !== undefined) {
    if (
      !Number.isInteger(rule.slotCapacity) ||
      (rule.slotCapacity ?? 0) <= 0
    ) {
      return { ok: false, error: "invalid_capacity" };
    }
  }

  return { ok: true };
}

/**
 * Slot starts from startTime stepping by interval, excluding endTime.
 * 09:00–13:00 / 60 → 09:00, 10:00, 11:00, 12:00
 */
export function generateSlotStarts(rule: Availability): string[] {
  const check = validateAvailabilitySchedule(rule);
  if (!check.ok) {
    return [];
  }

  const start = clockTimeToMinutes(rule.startTime);
  const end = clockTimeToMinutes(rule.endTime);
  const slots: string[] = [];

  for (
    let current = start;
    current + rule.interval <= end;
    current += rule.interval
  ) {
    slots.push(minutesToClockTime(current));
  }

  return slots;
}

export function generateSlotsForDay(
  rules: Availability[],
  day: AvailabilityDay,
): GeneratedSlot[] {
  const byStart = new Map<string, GeneratedSlot>();

  for (const rule of rules) {
    if (rule.day !== day) {
      continue;
    }

    const capacity = rule.slotCapacity ?? DEFAULT_SLOT_CAPACITY;
    const starts = generateSlotStarts({ ...rule, slotCapacity: capacity });

    for (const startTime of starts) {
      const endTime = minutesToClockTime(
        clockTimeToMinutes(startTime) + rule.interval,
      );
      const existing = byStart.get(startTime);
      if (!existing || capacity > existing.slotCapacity) {
        byStart.set(startTime, {
          startTime,
          endTime,
          slotCapacity: capacity,
        });
      }
    }
  }

  return [...byStart.values()].sort(
    (a, b) => clockTimeToMinutes(a.startTime) - clockTimeToMinutes(b.startTime),
  );
}

export function remainingSlotCapacity(
  slotCapacity: number,
  occupied: number,
): number {
  return Math.max(0, slotCapacity - occupied);
}

export function toPublicSlot(
  slot: GeneratedSlot,
  occupied: number,
): AvailabilitySlot {
  const remaining = remainingSlotCapacity(slot.slotCapacity, occupied);
  return {
    startTime: slot.startTime,
    endTime: slot.endTime,
    remainingCapacity: remaining,
    available: remaining > 0,
  };
}
