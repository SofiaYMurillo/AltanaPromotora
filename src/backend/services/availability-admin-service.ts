import { randomUUID } from "node:crypto";

import { officeLocations } from "@/config/office-locations.data";
import {
  isAvailabilityRuleValid,
  type Availability,
  type AvailabilityRule,
  type AvailabilityScope,
} from "@/domain";
import {
  PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID,
  availabilityScopeToResourceType,
} from "@/domain/availability-resources";

import * as availabilityRepository from "../repositories/availability-repository";

const DEFAULT_SLOT_CAPACITY = 1;

export type AdminAvailabilityScopeView = {
  scope: AvailabilityScope;
  title: string;
  subtitle: string;
  resourceType: ReturnType<typeof availabilityScopeToResourceType>;
  resourceId: string;
  rules: AvailabilityRule[];
};

function primaryOfficeLocationId() {
  const active = officeLocations.find((office) => office.active);
  return active?.id ?? officeLocations[0]?.id ?? "office-colibri";
}

function scopeResource(scope: AvailabilityScope) {
  if (scope === "office") {
    return {
      resourceType: availabilityScopeToResourceType("office"),
      resourceId: primaryOfficeLocationId(),
    };
  }

  return {
    resourceType: availabilityScopeToResourceType("property"),
    resourceId: PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID,
  };
}

function scopeMeta(scope: AvailabilityScope) {
  if (scope === "office") {
    const office = officeLocations.find(
      (item) => item.id === primaryOfficeLocationId(),
    );
    return {
      title: "Horarios de visita a oficina",
      subtitle: office
        ? `Sede ALTANA · ${office.name}, ${office.city}`
        : "Sede ALTANA",
    };
  }

  return {
    title: "Horarios de visita a inmuebles",
    subtitle: "Aplica a todas las visitas a inmuebles del catálogo público.",
  };
}

export async function getAdminAvailabilityScope(
  scope: AvailabilityScope,
): Promise<AdminAvailabilityScopeView> {
  const resource = scopeResource(scope);
  const rules = await availabilityRepository.listRulesForResource(
    resource.resourceType,
    resource.resourceId,
  );
  const meta = scopeMeta(scope);

  return {
    scope,
    ...meta,
    ...resource,
    rules,
  };
}

export type AvailabilityDraftRule = Availability & { active: boolean };

export type ReplaceAvailabilityRulesResult =
  | { ok: true; view: AdminAvailabilityScopeView }
  | { ok: false; error: "invalid_rules" | "invalid_scope" };

function toPersistedRule(
  draft: AvailabilityDraftRule,
  resource: ReturnType<typeof scopeResource>,
  index: number,
): AvailabilityRule | null {
  const schedule: Availability = {
    day: draft.day,
    startTime: draft.startTime,
    endTime: draft.endTime,
    interval: draft.interval,
    slotCapacity: draft.slotCapacity,
  };

  if (!isAvailabilityRuleValid(schedule)) {
    return null;
  }

  const dayKey = draft.day;
  const startKey = draft.startTime.replace(":", "");
  const id = `availability-${resource.resourceType}-${resource.resourceId}-${dayKey}-${startKey}-${index}`;

  return {
    id,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    day: draft.day,
    startTime: draft.startTime,
    endTime: draft.endTime,
    interval: draft.interval,
    slotCapacity: draft.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
    active: draft.active,
  };
}

export async function replaceAdminAvailabilityRules(input: {
  scope: AvailabilityScope;
  rules: AvailabilityDraftRule[];
}): Promise<ReplaceAvailabilityRulesResult> {
  if (input.scope !== "office" && input.scope !== "property") {
    return { ok: false, error: "invalid_scope" };
  }

  const resource = scopeResource(input.scope);
  const persisted: AvailabilityRule[] = [];

  for (const [index, draft] of input.rules.entries()) {
    const rule = toPersistedRule(draft, resource, index);
    if (!rule) {
      return { ok: false, error: "invalid_rules" };
    }
    persisted.push(rule);
  }

  await availabilityRepository.deleteAvailabilityRulesByResource(
    resource.resourceType,
    resource.resourceId,
  );

  for (const rule of persisted) {
    await availabilityRepository.upsertAvailabilityRule(rule);
  }

  const view = await getAdminAvailabilityScope(input.scope);
  return { ok: true, view };
}

export function createEmptyAvailabilityDraft(): AvailabilityDraftRule {
  return {
    day: 1,
    startTime: "09:00",
    endTime: "12:00",
    interval: 30,
    slotCapacity: DEFAULT_SLOT_CAPACITY,
    active: true,
  };
}

export function newAvailabilityRuleId() {
  return `availability-draft-${randomUUID().slice(0, 8)}`;
}
