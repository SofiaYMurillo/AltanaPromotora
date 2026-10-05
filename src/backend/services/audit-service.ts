import { randomUUID } from "node:crypto";

import {
  isValidAuditAction,
  isValidAuditEntityType,
  normalizeAuditEntityLabel,
  resolveAuditDateRange,
  resolveAuditPagination,
  sanitizeAuditMetadata,
  validateAuditDraft,
} from "@/domain";
import type {
  AuditAction,
  AuditActor,
  AuditEntityType,
  AuditEntry,
  AuditListFilters,
  AuditValidationError,
} from "@/domain";

import * as auditRepository from "../repositories/audit-repository";

export type RecordAuditEntryInput = {
  actor?: AuditActor | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AuditListQueryInput = {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type AuditListResult =
  | {
      ok: true;
      entries: AuditEntry[];
      hasMore: boolean;
      limit: number;
      offset: number;
    }
  | { ok: false; error: AuditValidationError };

/** Builds an actor from an already-authorized session user. */
export function auditActorFromUser(
  user: { id: string; firstName: string; lastName: string; email: string } | null | undefined,
): AuditActor | null {
  if (!user) {
    return null;
  }

  const name = `${user.firstName} ${user.lastName}`.trim();
  return { id: user.id, displayName: name || user.email };
}

/**
 * The single boundary that writes audit history.
 *
 * Auditing must never break a valid administrative operation, so a failure is
 * swallowed for the caller and reported on the server log instead. Callers get
 * `null` and can keep going.
 */
export async function recordAuditEntry(
  input: RecordAuditEntryInput,
): Promise<AuditEntry | null> {
  const invalid = validateAuditDraft({
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
  });

  if (invalid) {
    console.error(`[audit] rejected entry: ${invalid}`);
    return null;
  }

  const entry: AuditEntry = {
    id: `audit-${randomUUID()}`,
    actorUserId: input.actor?.id ?? null,
    actorDisplay: input.actor?.displayName ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId.trim(),
    entityLabel: normalizeAuditEntityLabel(input.entityLabel),
    metadata: sanitizeAuditMetadata(input.metadata),
    createdAt: new Date().toISOString(),
  };

  try {
    return await auditRepository.createAuditEntry(entry);
  } catch (error) {
    console.error("[audit] failed to persist entry", {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return null;
  }
}

export function parseAuditListQuery(
  input: AuditListQueryInput,
): { ok: true; filters: AuditListFilters } | { ok: false; error: AuditValidationError } {
  if (input.entityType !== undefined && !isValidAuditEntityType(input.entityType)) {
    return { ok: false, error: "invalid_entity_type" };
  }

  if (input.action !== undefined && !isValidAuditAction(input.action)) {
    return { ok: false, error: "invalid_action" };
  }

  const range = resolveAuditDateRange({ from: input.from, to: input.to });
  if (!range.ok) {
    return { ok: false, error: range.error };
  }

  const pagination = resolveAuditPagination({
    limit: input.limit,
    offset: input.offset,
  });
  if (!pagination.ok) {
    return { ok: false, error: pagination.error };
  }

  return {
    ok: true,
    filters: {
      entityType: input.entityType as AuditEntityType | undefined,
      entityId: input.entityId?.trim() || undefined,
      action: input.action as AuditAction | undefined,
      actorUserId: input.actorUserId?.trim() || undefined,
      from: range.from,
      to: range.to,
      limit: pagination.limit,
      offset: pagination.offset,
    },
  };
}

export async function listAdminAuditEntries(
  input: AuditListQueryInput = {},
): Promise<AuditListResult> {
  const parsed = parseAuditListQuery(input);
  if (!parsed.ok) {
    return parsed;
  }

  const { entries, hasMore } = await auditRepository.listAuditEntries(
    parsed.filters,
  );

  return {
    ok: true,
    entries,
    hasMore,
    limit: parsed.filters.limit,
    offset: parsed.filters.offset,
  };
}
