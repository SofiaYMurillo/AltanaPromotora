import type { AvailabilityDay } from "./availability";
import { AVAILABILITY_CALENDAR_TIME_ZONE } from "./availability";

const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidClockTime(value: string): boolean {
  return CLOCK_TIME.test(value);
}

export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function isAvailabilityDay(value: number): value is AvailabilityDay {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

/**
 * Weekday of a civil YYYY-MM-DD date.
 * Uses the calendar date itself, not a local Date instance, so it does not
 * depend on the host timezone.
 */
export function weekdayFromDateKey(dateKey: string): AvailabilityDay {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() as AvailabilityDay;
}

export function clockTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToClockTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return [
    utc.getUTCFullYear(),
    String(utc.getUTCMonth() + 1).padStart(2, "0"),
    String(utc.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function eachDateKey(from: string, to: string): string[] {
  const dates: string[] = [];
  let current = from;

  while (current <= to) {
    dates.push(current);
    current = addCalendarDays(current, 1);
  }

  return dates;
}

export function calendarDateKey(
  instant: Date,
  timeZone: string = AVAILABILITY_CALENDAR_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function clockTimeKey(
  instant: Date,
  timeZone: string = AVAILABILITY_CALENDAR_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

export function isPastCalendarDate(dateKey: string, todayKey: string): boolean {
  return dateKey < todayKey;
}

export function isPastSlot(input: {
  date: string;
  time: string;
  todayKey: string;
  nowTime: string;
}): boolean {
  if (input.date < input.todayKey) {
    return true;
  }

  return input.date === input.todayKey && input.time <= input.nowTime;
}
