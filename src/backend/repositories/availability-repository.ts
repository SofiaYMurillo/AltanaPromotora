import type {
  AvailabilityDay,
  AvailabilityResourceType,
  AvailabilityRule,
} from "@/domain";

import { prisma } from "../db";
import {
  toDomainAvailabilityRule,
  toPrismaAvailabilityRuleData,
} from "../mappers/availability-mapper";

export async function listRulesForResource(
  resourceType: AvailabilityResourceType,
  resourceId: string,
): Promise<AvailabilityRule[]> {
  const rows = await prisma.availabilityRule.findMany({
    where: {
      resourceType,
      resourceId,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return rows.map(toDomainAvailabilityRule);
}

export async function listActiveRulesForResource(
  resourceType: AvailabilityResourceType,
  resourceId: string,
): Promise<AvailabilityRule[]> {
  const rows = await prisma.availabilityRule.findMany({
    where: {
      resourceType,
      resourceId,
      active: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return rows.map(toDomainAvailabilityRule);
}

export async function listActiveRulesForResourceDay(
  resourceType: AvailabilityResourceType,
  resourceId: string,
  day: AvailabilityDay,
): Promise<AvailabilityRule[]> {
  const rows = await prisma.availabilityRule.findMany({
    where: {
      resourceType,
      resourceId,
      dayOfWeek: day,
      active: true,
    },
    orderBy: { startTime: "asc" },
  });

  return rows.map(toDomainAvailabilityRule);
}

export async function upsertAvailabilityRule(
  rule: AvailabilityRule,
): Promise<AvailabilityRule> {
  const data = toPrismaAvailabilityRuleData(rule);
  const row = await prisma.availabilityRule.upsert({
    where: { id: rule.id },
    create: data,
    update: {
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      intervalMinutes: data.intervalMinutes,
      slotCapacity: data.slotCapacity,
      active: data.active,
    },
  });

  return toDomainAvailabilityRule(row);
}

export async function deleteAvailabilityRulesByResource(
  resourceType: AvailabilityResourceType,
  resourceId: string,
) {
  await prisma.availabilityRule.deleteMany({
    where: { resourceType, resourceId },
  });
}
