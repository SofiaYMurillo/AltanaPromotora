import type { AppointmentVisitType } from "./appointment";
import type { AvailabilityResourceType } from "./availability";

/** Shared schedule for all property visit bookings (admin “Horarios de inmuebles”). */
export const PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID = "property-visit";

export type AvailabilityScope = "office" | "property";

export function availabilityScopeToResourceType(
  scope: AvailabilityScope,
): AvailabilityResourceType {
  return scope === "office" ? "office" : "property";
}

export function resolveAvailabilityQuery(input: {
  visitType: AppointmentVisitType;
  propertyId?: string;
  officeLocationId?: string;
}):
  | {
      ok: true;
      resourceType: AvailabilityResourceType;
      resourceId: string;
      /** When schedule uses `property-visit`, occupancy is per concrete property. */
      visitPropertyId?: string;
    }
  | { ok: false; error: "property_required" | "office_required" } {
  if (input.visitType === "property") {
    const visitPropertyId = input.propertyId?.trim();
    if (!visitPropertyId) {
      return { ok: false, error: "property_required" };
    }
    return {
      ok: true,
      resourceType: "property",
      resourceId: PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID,
      visitPropertyId,
    };
  }

  if (!input.officeLocationId?.trim()) {
    return { ok: false, error: "office_required" };
  }

  return {
    ok: true,
    resourceType: "office",
    resourceId: input.officeLocationId.trim(),
  };
}

/**
 * Property visit schedules use `property-visit` rules; capacity is counted per
 * persisted property. Direct queries by property id keep both on the same id.
 */
export function resolveAvailabilityOccupancyPropertyId(input: {
  resourceType: AvailabilityResourceType;
  scheduleResourceId: string;
  visitPropertyId?: string;
}): string | undefined {
  if (input.resourceType !== "property") {
    return undefined;
  }

  if (input.scheduleResourceId === PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID) {
    return input.visitPropertyId?.trim() || undefined;
  }

  return input.scheduleResourceId;
}
