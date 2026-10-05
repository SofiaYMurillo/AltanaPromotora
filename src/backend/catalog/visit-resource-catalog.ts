import type { AvailabilityResourceType } from "@/domain";
import { PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID } from "@/domain/availability-resources";
import { officeLocations } from "@/config/office-locations.data";

import * as propertyRepository from "../repositories/property-repository";

/**
 * Catalog existence for visit resources.
 *
 * Property → SQLite (Property.active). Office → officeLocations config.
 * Presentation titles live in visit-resource-display; this module only answers
 * whether a resource may receive availability / booking queries.
 */
export type VisitResourceCatalogStatus = "known" | "unknown" | "inactive";

export async function resolveVisitResourceCatalog(
  resourceType: AvailabilityResourceType,
  resourceId: string,
): Promise<VisitResourceCatalogStatus> {
  if (resourceType === "property") {
    if (resourceId === PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID) {
      return "known";
    }

    const property = await propertyRepository.getPropertyById(resourceId);
    if (!property) {
      return "unknown";
    }
    return property.active ? "known" : "inactive";
  }

  const office = officeLocations.find((item) => item.id === resourceId);
  if (!office) {
    return "unknown";
  }
  return office.active ? "known" : "inactive";
}
