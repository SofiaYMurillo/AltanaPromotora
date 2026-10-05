/**
 * Availability rules are resource-scoped.
 * Property availability and office availability stay independent.
 *
 * day / dayOfWeek matches Date.getUTCDay() on a civil YYYY-MM-DD date:
 * 0 Sunday, 1 Monday … 6 Saturday.
 */

export type AvailabilityDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AvailabilityResourceType = "property" | "office";

/**
 * Schedule window used by catalog, admin drafts, and persistence mapping.
 * `interval` is minutes between slot starts.
 * `slotCapacity` is optional on drafts; persisted rules always store a value.
 */
export interface Availability {
  day: AvailabilityDay;
  startTime: string;
  endTime: string;
  interval: number;
  slotCapacity?: number;
}

export interface PropertyAvailabilityEntry {
  propertyId: string;
  availability: Availability[];
}

export interface OfficeAvailabilityEntry {
  officeLocationId: string;
  availability: Availability[];
}

export interface AvailabilityRule {
  id: string;
  resourceType: AvailabilityResourceType;
  resourceId: string;
  day: AvailabilityDay;
  startTime: string;
  endTime: string;
  interval: number;
  slotCapacity: number;
  active: boolean;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  remainingCapacity: number;
}

export interface AvailabilityDaySlots {
  date: string;
  slots: AvailabilitySlot[];
}

/** Civil calendar timezone for “today” and current clock. Colombia has no DST. */
export const AVAILABILITY_CALENDAR_TIME_ZONE = "America/Bogota";

export const DEFAULT_AVAILABILITY_LOOKAHEAD_DAYS = 42;
export const MAX_AVAILABILITY_RANGE_DAYS = 62;
