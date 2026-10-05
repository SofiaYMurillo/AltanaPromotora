import Link from "next/link";

import { appointmentCalendarPhase } from "@/domain";
import type { CalendarAppointment } from "@/domain";
import { AdminCard } from "@/features/admin";
import { AppointmentStatusBadge } from "@/frontend/features/admin-appointments/AppointmentStatusBadge";
import {
  formatAppointmentTime,
  getVisitTypeLabel,
} from "@/frontend/features/admin-appointments/admin-appointments.logic";

import {
  formatCalendarHour,
  getCalendarPhaseLabel,
  groupCalendarAppointmentsByHour,
} from "./admin-calendar.logic";

type CalendarDayAgendaProps = {
  appointments: CalendarAppointment[];
};

export function CalendarDayAgenda({ appointments }: CalendarDayAgendaProps) {
  const groups = groupCalendarAppointmentsByHour(appointments);

  return (
    <ol className="flex flex-col gap-6">
      {groups.map((group) => (
        <li
          key={group.hour}
          className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6"
        >
          <h3 className="shrink-0 text-label text-muted md:w-24 md:pt-2 md:text-right">
            {formatCalendarHour(group.hour)}
          </h3>

          <ul className="flex min-w-0 flex-1 flex-col gap-3">
            {group.appointments.map((item) => {
              const phase = appointmentCalendarPhase(item.status);

              return (
                <li key={item.id}>
                  <AdminCard>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-col gap-2">
                        <p className="text-body-md text-foreground">
                          {formatAppointmentTime(item.startTime)} ·{" "}
                          {item.clientDisplay}
                        </p>
                        <p className="text-body-sm text-muted">
                          {getVisitTypeLabel(item.resource.type)} ·{" "}
                          {item.resource.title}
                          {item.resource.missing ? " (no disponible)" : ""}
                        </p>
                        {item.contactDisplay ? (
                          <p className="break-all text-body-sm text-muted">
                            {item.contactDisplay}
                          </p>
                        ) : null}
                        {item.workerDisplay ? (
                          <p className="text-body-sm text-muted">
                            Atiende: {item.workerDisplay}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <AppointmentStatusBadge status={item.status} />
                          <span className="text-body-sm text-muted">
                            {getCalendarPhaseLabel(phase)}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/admin/appointments/${item.id}`}
                        className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </AdminCard>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
