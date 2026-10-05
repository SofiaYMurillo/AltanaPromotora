import type { AuditAction, AuditEntityType, AuditEntry } from "@/domain";

export type { AuditEntry };

export type AdminActivityFilters = {
  entityType?: AuditEntityType;
  action?: AuditAction;
};

export type AdminActivityViewStatus = "ready" | "loading" | "error";

export type AdminActivityPage = {
  entries: AuditEntry[];
  hasMore: boolean;
  offset: number;
};
