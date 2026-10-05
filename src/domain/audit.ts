/**
 * Administrative audit trail contracts.
 *
 * AuditEntry = an administrative action that happened inside the system.
 * SecurityEvent = authentication / access security facts.
 * Notification = something surfaced to an internal user.
 *
 * These three stay separate: an entry is never derived from the other two.
 * Entries are append-only; there is no update and no delete contract.
 */

import { addCalendarDays, isValidDateKey } from "./availability-time";

export type AuditEntityType =
  | "project"
  | "property"
  | "appointment"
  | "contact_request"
  | "invitation"
  | "media_asset"
  | "section_background"
  | "site_configuration"
  | "about_team_section"
  | "about_team_member"
  | "user";

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "invitation_created"
  | "invitation_revoked";

export const AUDIT_ENTITY_TYPES: readonly AuditEntityType[] = [
  "project",
  "property",
  "appointment",
  "contact_request",
  "invitation",
  "media_asset",
  "section_background",
  "site_configuration",
  "about_team_section",
  "about_team_member",
  "user",
];

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  "created",
  "updated",
  "deleted",
  "status_changed",
  "invitation_created",
  "invitation_revoked",
];

export const DEFAULT_AUDIT_PAGE_SIZE = 25;
export const MAX_AUDIT_PAGE_SIZE = 50;
export const MAX_AUDIT_RANGE_DAYS = 92;

/** Metadata is intentionally flat and primitive: no snapshots, no secrets. */
export type AuditMetadata = Record<string, string | number | boolean | null>;

export type AuditActor = {
  id: string;
  displayName: string;
};

export type AuditEntry = {
  id: string;
  /** Null when the action has no authenticated human actor. */
  actorUserId: string | null;
  /** Captured at write time so history survives user renames or deletions. */
  actorDisplay: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  /** Human reference (title, email, …) so the UI is not a wall of raw ids. */
  entityLabel: string | null;
  metadata: AuditMetadata | null;
  createdAt: string;
};

export type AuditListFilters = {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  actorUserId?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
};

export type AuditValidationError =
  | "invalid_action"
  | "invalid_entity_type"
  | "invalid_entity_id"
  | "invalid_date"
  | "range_too_large"
  | "invalid_pagination";

const MAX_METADATA_KEYS = 10;
const MAX_METADATA_VALUE_LENGTH = 200;
const MAX_ENTITY_LABEL_LENGTH = 160;

/**
 * Keys that must never reach the audit trail, whatever the caller passes.
 * Credentials, session material, and invitation codes are excluded by name.
 */
const FORBIDDEN_METADATA_KEY =
  /pass|token|secret|hash|cookie|session|credential|authorization|code|clave/i;

export function isValidAuditAction(value: unknown): value is AuditAction {
  return typeof value === "string" && AUDIT_ACTIONS.includes(value as AuditAction);
}

export function isValidAuditEntityType(
  value: unknown,
): value is AuditEntityType {
  return (
    typeof value === "string" &&
    AUDIT_ENTITY_TYPES.includes(value as AuditEntityType)
  );
}

export function normalizeAuditEntityLabel(value: string | undefined | null) {
  const label = value?.trim();
  if (!label) {
    return null;
  }
  return label.slice(0, MAX_ENTITY_LABEL_LENGTH);
}

/**
 * Keeps only small primitive values under safe keys.
 * Objects, arrays, and anything credential-shaped are dropped, not stored.
 */
export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined | null,
): AuditMetadata | null {
  if (!metadata) {
    return null;
  }

  const safe: AuditMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(safe).length >= MAX_METADATA_KEYS) {
      break;
    }

    if (FORBIDDEN_METADATA_KEY.test(key)) {
      continue;
    }

    if (value === null) {
      safe[key] = null;
      continue;
    }

    if (typeof value === "string") {
      safe[key] = value.slice(0, MAX_METADATA_VALUE_LENGTH);
      continue;
    }

    if (typeof value === "boolean") {
      safe[key] = value;
      continue;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      safe[key] = value;
    }
  }

  return Object.keys(safe).length > 0 ? safe : null;
}

export function validateAuditDraft(input: {
  action: unknown;
  entityType: unknown;
  entityId: unknown;
}): AuditValidationError | null {
  if (!isValidAuditAction(input.action)) {
    return "invalid_action";
  }

  if (!isValidAuditEntityType(input.entityType)) {
    return "invalid_entity_type";
  }

  if (typeof input.entityId !== "string" || !input.entityId.trim()) {
    return "invalid_entity_id";
  }

  return null;
}

/** Backend clamps the page size; a client-supplied limit is never trusted. */
export function resolveAuditPagination(input: {
  limit?: number;
  offset?: number;
}): { ok: true; limit: number; offset: number } | { ok: false; error: AuditValidationError } {
  const limit = input.limit ?? DEFAULT_AUDIT_PAGE_SIZE;
  const offset = input.offset ?? 0;

  if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 1 || offset < 0) {
    return { ok: false, error: "invalid_pagination" };
  }

  return {
    ok: true,
    limit: Math.min(limit, MAX_AUDIT_PAGE_SIZE),
    offset,
  };
}

export function resolveAuditDateRange(input: {
  from?: string;
  to?: string;
}):
  | { ok: true; from?: string; to?: string }
  | { ok: false; error: AuditValidationError } {
  const { from, to } = input;

  if (from !== undefined && !isValidDateKey(from)) {
    return { ok: false, error: "invalid_date" };
  }

  if (to !== undefined && !isValidDateKey(to)) {
    return { ok: false, error: "invalid_date" };
  }

  if (from && to) {
    if (from > to) {
      return { ok: false, error: "invalid_date" };
    }

    if (addCalendarDays(from, MAX_AUDIT_RANGE_DAYS) < to) {
      return { ok: false, error: "range_too_large" };
    }
  }

  return { ok: true, from, to };
}
