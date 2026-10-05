import type { AvailabilityDay, AvailabilityResourceType, AvailabilityRule } from "@/domain";
import type { AvailabilityRule as AvailabilityRuleRow } from "@/generated/prisma/client";

export function toDomainAvailabilityRule(
  row: AvailabilityRuleRow,
): AvailabilityRule {
  return {
    id: row.id,
    resourceType: row.resourceType as AvailabilityResourceType,
    resourceId: row.resourceId,
    day: row.dayOfWeek as AvailabilityDay,
    startTime: row.startTime,
    endTime: row.endTime,
    interval: row.intervalMinutes,
    slotCapacity: row.slotCapacity,
    active: row.active,
  };
}

export function toPrismaAvailabilityRuleData(rule: AvailabilityRule) {
  return {
    id: rule.id,
    resourceType: rule.resourceType,
    resourceId: rule.resourceId,
    dayOfWeek: rule.day,
    startTime: rule.startTime,
    endTime: rule.endTime,
    intervalMinutes: rule.interval,
    slotCapacity: rule.slotCapacity,
    active: rule.active,
  };
}
