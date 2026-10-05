import { officeLocations } from "@/config/office-locations.data";

import * as propertyRepository from "../repositories/property-repository";

/**
 * Display labels for visit resources used by administrative appointment views
 * and the agenda. Property titles come from persisted Property rows; offices
 * come from officeLocations. This is not a second catalog of saleable units.
 */

export type VisitResourceDisplay = {
  type: "property" | "office";
  id: string;
  title: string;
  location: string;
  missing: boolean;
};

function missingDisplay(
  type: "property" | "office",
  id: string,
): VisitResourceDisplay {
  return {
    type,
    id,
    title:
      type === "property" ? "Inmueble no disponible" : "Sede no disponible",
    location: "Sin ubicación",
    missing: true,
  };
}

function officeDisplay(resourceId: string): VisitResourceDisplay {
  if (!resourceId) {
    return missingDisplay("office", "");
  }

  const office = officeLocations.find((item) => item.id === resourceId);
  if (!office) {
    return missingDisplay("office", resourceId);
  }

  return {
    type: "office",
    id: office.id,
    title: office.name,
    location: office.city,
    missing: false,
  };
}

/**
 * Resolves one resource label. Prefer loadVisitResourceDisplays when mapping
 * many appointments so Property lookups stay batched.
 */
export async function resolveVisitResourceDisplay(input: {
  type: "property" | "office";
  resourceId?: string;
}): Promise<VisitResourceDisplay> {
  const id = input.resourceId ?? "";

  if (input.type === "office") {
    return officeDisplay(id);
  }

  if (!id) {
    return missingDisplay("property", "");
  }

  const property = await propertyRepository.getPropertyById(id);
  if (!property) {
    return missingDisplay("property", id);
  }

  return {
    type: "property",
    id: property.id,
    title: property.title,
    location: property.city,
    missing: false,
  };
}

/**
 * Batch-loads property displays for a list of appointment resources.
 * Offices resolve from the static office catalog without a database round-trip.
 */
export async function loadVisitResourceDisplays(
  entries: Array<{ type: "property" | "office"; resourceId?: string }>,
): Promise<Map<string, VisitResourceDisplay>> {
  const result = new Map<string, VisitResourceDisplay>();
  const propertyIds = [
    ...new Set(
      entries
        .filter((entry) => entry.type === "property" && entry.resourceId)
        .map((entry) => entry.resourceId as string),
    ),
  ];

  const properties = await Promise.all(
    propertyIds.map(async (id) => [id, await propertyRepository.getPropertyById(id)] as const),
  );
  const propertyById = new Map(properties);

  for (const entry of entries) {
    const id = entry.resourceId ?? "";
    const key = `${entry.type}:${id}`;
    if (result.has(key)) {
      continue;
    }

    if (entry.type === "office") {
      result.set(key, officeDisplay(id));
      continue;
    }

    if (!id) {
      result.set(key, missingDisplay("property", ""));
      continue;
    }

    const property = propertyById.get(id) ?? null;
    result.set(
      key,
      property
        ? {
            type: "property",
            id: property.id,
            title: property.title,
            location: property.city,
            missing: false,
          }
        : missingDisplay("property", id),
    );
  }

  return result;
}

export function visitResourceDisplayKey(input: {
  type: "property" | "office";
  resourceId?: string;
}) {
  return `${input.type}:${input.resourceId ?? ""}`;
}
