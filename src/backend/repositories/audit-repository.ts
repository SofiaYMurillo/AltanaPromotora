import type { AuditEntry, AuditListFilters } from "@/domain";

import { prisma } from "../db";
import {
  toDomainAuditEntry,
  toPrismaAuditEntryData,
} from "../mappers/audit-mapper";

/**
 * Append-only store. There is deliberately no update and no delete here:
 * an audit entry records a fact that already happened.
 */
export async function createAuditEntry(entry: AuditEntry): Promise<AuditEntry> {
  const row = await prisma.auditEntry.create({
    data: toPrismaAuditEntryData(entry),
  });
  return toDomainAuditEntry(row);
}

function auditWhere(filters: AuditListFilters) {
  const createdAt =
    filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
            ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
          },
        }
      : {};

  return {
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
    ...createdAt,
  };
}

/**
 * Reads one bounded page, newest first.
 * Takes one extra row to report `hasMore` without a second count query.
 */
export async function listAuditEntries(
  filters: AuditListFilters,
): Promise<{ entries: AuditEntry[]; hasMore: boolean }> {
  const rows = await prisma.auditEntry.findMany({
    where: auditWhere(filters),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: filters.offset,
    take: filters.limit + 1,
  });

  return {
    entries: rows.slice(0, filters.limit).map(toDomainAuditEntry),
    hasMore: rows.length > filters.limit,
  };
}

export async function countAuditEntries() {
  return prisma.auditEntry.count();
}
