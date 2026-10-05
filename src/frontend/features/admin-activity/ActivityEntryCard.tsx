import type { AuditEntry } from "@/domain";
import { AdminCard } from "@/features/admin";

import {
  describeAuditMetadata,
  formatAuditDate,
  getAuditActionLabel,
  getAuditActorLabel,
  getAuditEntityLabel,
  getAuditEntityReference,
} from "./admin-activity.logic";

type ActivityEntryCardProps = {
  entry: AuditEntry;
};

export function ActivityEntryCard({ entry }: ActivityEntryCardProps) {
  const metadata = describeAuditMetadata(entry.metadata);

  return (
    <AdminCard>
      <div className="flex flex-col gap-2">
        <p className="text-body-sm text-muted">
          <time dateTime={entry.createdAt}>
            {formatAuditDate(entry.createdAt)}
          </time>
        </p>

        <p className="text-body-md text-foreground">
          {getAuditActorLabel(entry)} · {getAuditActionLabel(entry.action)}{" "}
          {getAuditEntityLabel(entry.entityType).toLowerCase()}{" "}
          <span className="break-all">{getAuditEntityReference(entry)}</span>
        </p>

        <p className="break-all text-body-sm text-muted">
          {getAuditEntityLabel(entry.entityType)} · {entry.entityId}
        </p>

        {metadata.length > 0 ? (
          <dl className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
            {metadata.map((item) => (
              <div key={item.key} className="flex gap-2">
                <dt className="text-body-sm text-muted">{item.label}:</dt>
                <dd className="text-body-sm text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </AdminCard>
  );
}
