import type { WorkerInvitationDisplayStatus } from "@/domain/invitation-display";

import { invitationStatusLabels } from "../users.logic";

type InvitationStatusBadgeProps = {
  status: WorkerInvitationDisplayStatus;
};

const statusClassName: Record<WorkerInvitationDisplayStatus, string> = {
  active: "border-accent/40 bg-background text-foreground",
  used: "border-border bg-surface text-muted",
  revoked: "border-border bg-surface text-muted",
  expired: "border-border bg-surface text-muted",
  inactive: "border-border bg-surface text-muted",
};

export function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-2 py-1 text-label ${statusClassName[status]}`}
    >
      {invitationStatusLabels[status]}
    </span>
  );
}
