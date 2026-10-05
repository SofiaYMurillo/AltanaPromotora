import type { AppointmentStatus } from "@/domain";

import { getAppointmentStatusLabel } from "./admin-appointments.logic";

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus;
};

const statusClassName: Record<AppointmentStatus, string> = {
  pending: "border-accent/40 bg-background text-foreground",
  confirmed: "border-accent bg-background text-foreground",
  completed: "border-border bg-surface text-muted",
  cancelled: "border-border bg-surface text-muted",
  no_show: "border-border bg-surface text-muted",
};

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-2 py-1 text-label ${statusClassName[status]}`}
    >
      {getAppointmentStatusLabel(status)}
    </span>
  );
}
