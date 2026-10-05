import type { CatalogImage, Property, PropertyOperation, PropertyType } from "@/domain";
import type { Property as PropertyRow } from "@/generated/prisma/client";

function parseImages(value: string): CatalogImage[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as CatalogImage[]) : [];
  } catch {
    return [];
  }
}

function parseFeatures(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function toDomainProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    projectId: row.projectId ?? undefined,
    title: row.title,
    images: parseImages(row.imagesJson),
    operation: row.operation as PropertyOperation,
    type: row.type as PropertyType,
    city: row.city,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: row.area,
    parkingSpaces: row.parkingSpaces,
    price: row.price,
    features: parseFeatures(row.featuresJson),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPrismaPropertyData(property: Property) {
  return {
    id: property.id,
    projectId: property.projectId ?? null,
    title: property.title,
    imagesJson: JSON.stringify(property.images),
    operation: property.operation,
    type: property.type,
    city: property.city,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    parkingSpaces: property.parkingSpaces,
    price: property.price,
    featuresJson: JSON.stringify(property.features),
    active: property.active,
  };
}
