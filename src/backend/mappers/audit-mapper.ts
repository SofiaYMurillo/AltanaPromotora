import { sanitizeAuditMetadata } from "@/domain";
import type { AuditAction, AuditEntityType, AuditEntry } from "@/domain";
import type { AuditEntry as AuditEntryRow } from "@/generated/prisma/client";

function parseMetadata(metadataJson: string | null) {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(metadataJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return sanitizeAuditMetadata(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function toDomainAuditEntry(row: AuditEntryRow): AuditEntry {
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    actorDisplay: row.actorDisplay,
    action: row.action as AuditAction,
    entityType: row.entityType as AuditEntityType,
    entityId: row.entityId,
    entityLabel: row.entityLabel,
    metadata: parseMetadata(row.metadataJson),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toPrismaAuditEntryData(entry: AuditEntry) {
  return {
    id: entry.id,
    actorUserId: entry.actorUserId,
    actorDisplay: entry.actorDisplay,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    metadataJson: entry.metadata ? JSON.stringify(entry.metadata) : null,
    createdAt: new Date(entry.createdAt),
  };
}
