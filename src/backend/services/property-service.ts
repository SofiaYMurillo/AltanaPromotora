import { randomUUID } from "node:crypto";

import {
  normalizeCatalogTitle,
  normalizePropertyFeatures,
  normalizeCatalogImages,
  validatePropertyDraft,
} from "@/domain";
import type {
  CatalogImage,
  CatalogValidationError,
  Property,
  PropertyOperation,
  PropertyType,
} from "@/domain";

import type { AuditActor } from "@/domain";

import * as projectRepository from "../repositories/project-repository";
import * as appointmentRepository from "../repositories/appointment-repository";
import * as propertyRepository from "../repositories/property-repository";
import type { PropertyListFilters } from "../repositories/property-repository";
import { recordAuditEntry } from "./audit-service";
import { revalidatePublicCatalog } from "./catalog-public-cache";

export type PropertyWriteOptions = {
  actor?: AuditActor | null;
};

const FORBIDDEN_PROPERTY_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "userId",
  "appointmentCount",
  "clientId",
  "assignedWorkerId",
  "capacity",
  "sessionId",
  "securityEventId",
]);

const ALLOWED_PROPERTY_FIELDS = new Set([
  "title",
  "projectId",
  "operation",
  "type",
  "city",
  "bedrooms",
  "bathrooms",
  "area",
  "parkingSpaces",
  "price",
  "features",
  "images",
  "active",
]);

export type PropertyDeleteError = "not_found" | "has_appointments";

export type PropertyWriteError =
  | CatalogValidationError
  | "not_found"
  | "invalid_body";

export type AdminPropertyListFilters = PropertyListFilters & {
  search?: string;
};

function rejectForbiddenFields(body: Record<string, unknown>) {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_PROPERTY_FIELDS.has(key) || !ALLOWED_PROPERTY_FIELDS.has(key)) {
      return "forbidden_field" as const;
    }
  }
  return null;
}

function optionalProjectId(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return typeof value === "string" ? value.trim() : undefined;
}

export function parsePropertyWriteInput(body: unknown):
  | {
      ok: true;
      title: string;
      projectId?: string;
      operation: PropertyOperation;
      type: PropertyType;
      city: string;
      bedrooms: number;
      bathrooms: number;
      area: number;
      parkingSpaces: number;
      price: number;
      features: string[];
      images: CatalogImage[];
      active: boolean;
    }
  | { ok: false; error: PropertyWriteError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const input = body as Record<string, unknown>;
  const forbidden = rejectForbiddenFields(input);
  if (forbidden) {
    return { ok: false, error: forbidden };
  }

  const rawImages = Array.isArray(input.images)
    ? (input.images as CatalogImage[])
    : [];
  const images = normalizeCatalogImages(rawImages);

  const validation = validatePropertyDraft({ ...input, images });
  if (validation) {
    return { ok: false, error: validation };
  }

  return {
    ok: true,
    title: normalizeCatalogTitle(input.title as string),
    projectId: optionalProjectId(input.projectId),
    operation: input.operation as PropertyOperation,
    type: input.type as PropertyType,
    city: normalizeCatalogTitle(input.city as string),
    bedrooms: input.bedrooms as number,
    bathrooms: input.bathrooms as number,
    area: input.area as number,
    parkingSpaces: input.parkingSpaces as number,
    price: input.price as number,
    features: normalizePropertyFeatures(input.features as string[]),
    images,
    active: input.active as boolean,
  };
}

function matchesSearch(property: Property, search?: string) {
  const query = search?.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [property.title, property.city, property.projectId]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(query));
}

export async function listAdminProperties(filters: AdminPropertyListFilters = {}) {
  const properties = await propertyRepository.listProperties(filters);
  return filters.search
    ? properties.filter((property) => matchesSearch(property, filters.search))
    : properties;
}

export async function listPublicProperties() {
  return propertyRepository.listActiveProperties();
}

export async function getAdminProperty(id: string) {
  return propertyRepository.getPropertyById(id);
}

export async function getPublicProperty(id: string) {
  const property = await propertyRepository.getPropertyById(id);
  return property?.active ? property : null;
}

export async function createProperty(
  body: unknown,
  options: PropertyWriteOptions = {},
) {
  const parsed = parsePropertyWriteInput(body);
  if (!parsed.ok) {
    return parsed;
  }

  if (parsed.projectId) {
    const project = await projectRepository.getProjectById(parsed.projectId);
    if (!project) {
      return { ok: false as const, error: "invalid_project_id" as const };
    }
  }

  const now = new Date().toISOString();
  const property: Property = {
    id: `property-${randomUUID()}`,
    projectId: parsed.projectId,
    title: parsed.title,
    images: parsed.images,
    operation: parsed.operation,
    type: parsed.type,
    city: parsed.city,
    bedrooms: parsed.bedrooms,
    bathrooms: parsed.bathrooms,
    area: parsed.area,
    parkingSpaces: parsed.parkingSpaces,
    price: parsed.price,
    features: parsed.features,
    active: parsed.active,
    createdAt: now,
    updatedAt: now,
  };

  const created = await propertyRepository.createProperty(property);

  await recordAuditEntry({
    actor: options.actor,
    action: "created",
    entityType: "property",
    entityId: created.id,
    entityLabel: created.title,
    metadata: {
      operation: created.operation,
      city: created.city,
      active: created.active,
    },
  });

  await revalidatePublicCatalog({
    propertyId: created.id,
    projectId: created.projectId,
  });

  return { ok: true as const, property: created };
}

export async function updateProperty(
  id: string,
  body: unknown,
  options: PropertyWriteOptions = {},
) {
  const existing = await propertyRepository.getPropertyById(id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  const parsed = parsePropertyWriteInput(body);
  if (!parsed.ok) {
    return parsed;
  }

  if (parsed.projectId) {
    const project = await projectRepository.getProjectById(parsed.projectId);
    if (!project) {
      return { ok: false as const, error: "invalid_project_id" as const };
    }
  }

  const updated = await propertyRepository.updateProperty({
    ...existing,
    projectId: parsed.projectId,
    title: parsed.title,
    images: parsed.images,
    operation: parsed.operation,
    type: parsed.type,
    city: parsed.city,
    bedrooms: parsed.bedrooms,
    bathrooms: parsed.bathrooms,
    area: parsed.area,
    parkingSpaces: parsed.parkingSpaces,
    price: parsed.price,
    features: parsed.features,
    active: parsed.active,
  });

  if (!updated) {
    return { ok: false as const, error: "not_found" as const };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "updated",
    entityType: "property",
    entityId: updated.id,
    entityLabel: updated.title,
    metadata: {
      previousPrice: existing.price,
      price: updated.price,
      active: updated.active,
    },
  });

  await revalidatePublicCatalog({
    propertyId: updated.id,
    projectId: updated.projectId ?? existing.projectId,
  });

  return { ok: true as const, property: updated };
}

export async function updatePropertyStatus(
  id: string,
  active: boolean,
  options: PropertyWriteOptions = {},
) {
  if (typeof active !== "boolean") {
    return { ok: false as const, error: "invalid_active" as const };
  }

  const updated = await propertyRepository.updatePropertyActive(id, active);
  if (!updated) {
    return { ok: false as const, error: "not_found" as const };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "status_changed",
    entityType: "property",
    entityId: updated.id,
    entityLabel: updated.title,
    metadata: { active: updated.active },
  });

  await revalidatePublicCatalog({
    propertyId: updated.id,
    projectId: updated.projectId,
  });

  return { ok: true as const, property: updated };
}

export async function countProperties() {
  return propertyRepository.countProperties();
}

export async function deleteProperty(
  id: string,
  options: PropertyWriteOptions = {},
) {
  const existing = await propertyRepository.getPropertyById(id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  const appointmentCount =
    await appointmentRepository.countAppointmentsByPropertyId(id);
  if (appointmentCount > 0) {
    return { ok: false as const, error: "has_appointments" as const };
  }

  const deleted = await propertyRepository.deletePropertyById(id);
  if (!deleted) {
    return { ok: false as const, error: "not_found" as const };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "deleted",
    entityType: "property",
    entityId: id,
    entityLabel: existing.title,
    metadata: {
      city: existing.city,
      projectId: existing.projectId ?? null,
    },
  });

  await revalidatePublicCatalog({
    propertyId: id,
    projectId: existing.projectId,
  });

  return { ok: true as const };
}
