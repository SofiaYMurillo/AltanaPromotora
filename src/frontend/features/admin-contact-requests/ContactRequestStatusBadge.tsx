import type { ContactRequestStatus } from "@/domain";

import { getContactRequestStatusLabel } from "@/frontend/features/contact-requests/contact-requests.logic";

type ContactRequestStatusBadgeProps = {
  status: ContactRequestStatus;
};

const statusClassName: Record<ContactRequestStatus, string> = {
  pending: "border-accent/40 bg-background text-foreground",
  responded: "border-accent bg-background text-foreground",
  closed: "border-border bg-surface text-muted",
};

export function ContactRequestStatusBadge({
  status,
}: ContactRequestStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-2 py-1 text-label ${statusClassName[status]}`}
    >
      {getContactRequestStatusLabel(status)}
    </span>
  );
}
