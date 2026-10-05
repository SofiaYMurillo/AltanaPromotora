import type { Property } from "@/domain";

import { prisma } from "../db";
import {
  toDomainProperty,
  toPrismaPropertyData,
} from "../mappers/property-mapper";

export type PropertyListFilters = {
  active?: boolean;
  operation?: Property["operation"];
  type?: Property["type"];
  city?: string;
  projectId?: string;
};

export async function listProperties(
  filters: PropertyListFilters = {},
): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    where: {
      ...(filters.active === undefined ? {} : { active: filters.active }),
      ...(filters.operation ? { operation: filters.operation } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
    },
    orderBy: { title: "asc" },
  });
  return rows.map(toDomainProperty);
}

export async function listActiveProperties(): Promise<Property[]> {
  return listProperties({ active: true });
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const row = await prisma.property.findUnique({ where: { id } });
  return row ? toDomainProperty(row) : null;
}

export async function createProperty(property: Property): Promise<Property> {
  const row = await prisma.property.create({
    data: toPrismaPropertyData(property),
  });
  return toDomainProperty(row);
}

export async function updateProperty(property: Property): Promise<Property | null> {
  const existing = await prisma.property.findUnique({ where: { id: property.id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.property.update({
    where: { id: property.id },
    data: toPrismaPropertyData(property),
  });
  return toDomainProperty(row);
}

export async function updatePropertyActive(id: string, active: boolean) {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.property.update({
    where: { id },
    data: { active },
  });
  return toDomainProperty(row);
}

export async function countProperties() {
  return prisma.property.count();
}

export async function deletePropertyById(id: string): Promise<boolean> {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) {
    return false;
  }
  await prisma.property.delete({ where: { id } });
  return true;
}
