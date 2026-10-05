"use client";

import { useId, useRef, useState } from "react";

import { shiftCalendarDate } from "@/domain";
import type { AppointmentStatus, AppointmentVisitType } from "@/domain";
import { AdminCard, AdminPage } from "@/features/admin";

import { getAdminCalendarDayRequest } from "./admin-calendar-api.client";
import { CalendarDayAgenda } from "./CalendarDayAgenda";
import {
  countActiveCalendarAppointments,
  formatCalendarDayLabel,
  mapCalendarError,
} from "./admin-calendar.logic";
import type {
  AdminCalendarFilters,
  AdminCalendarViewStatus,
  CalendarAppointment,
} from "./admin-calendar.types";

type CalendarAdminPageProps = {
  today: string;
  initialDate: string;
  initialAppointments: CalendarAppointment[];
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const navButtonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function CalendarAdminPage({
  today,
  initialDate,
  initialAppointments,
}: CalendarAdminPageProps) {
  const statusId = useId();
  const resourceTypeId = useId();
  const dateId = useId();
  const [filters, setFilters] = useState<AdminCalendarFilters>({
    date: initialDate,
  });
  const [appointments, setAppointments] =
    useState<CalendarAppointment[]>(initialAppointments);
  const [status, setStatus] = useState<AdminCalendarViewStatus>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const requestId = useRef(0);

  function applyFilters(next: AdminCalendarFilters) {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setFilters(next);
    setStatus("loading");
    setErrorMessage("");

    void getAdminCalendarDayRequest(next).then((result) => {
      if (currentRequest !== requestId.current) {
        return;
      }

      if (!result.ok) {
        setStatus("error");
        setErrorMessage(mapCalendarError(result.error));
        return;
      }

      setAppointments(result.days[0]?.appointments ?? []);
      setStatus("ready");
    });
  }

  const activeCount = countActiveCalendarAppointments(appointments);

  return (
    <AdminPage
      title="Agenda"
      description="Vista diaria de las citas registradas. Los cambios de estado se realizan en el detalle de cada cita."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={navButtonClassName}
              onClick={() =>
                applyFilters({
                  ...filters,
                  date: shiftCalendarDate(filters.date, -1),
                })
              }
            >
              Día anterior
            </button>
            <button
              type="button"
              className={navButtonClassName}
              onClick={() => applyFilters({ ...filters, date: today })}
              disabled={filters.date === today}
            >
              Hoy
            </button>
            <button
              type="button"
              className={navButtonClassName}
              onClick={() =>
                applyFilters({
                  ...filters,
                  date: shiftCalendarDate(filters.date, 1),
                })
              }
            >
              Día siguiente
            </button>
          </div>

          <h2 className="text-heading-sm text-foreground first-letter:uppercase">
            {formatCalendarDayLabel(filters.date)}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2" htmlFor={dateId}>
            <span className="text-body-sm text-muted">Fecha</span>
            <input
              id={dateId}
              type="date"
              className={fieldClassName}
              value={filters.date}
              onChange={(event) => {
                if (event.target.value) {
                  applyFilters({ ...filters, date: event.target.value });
                }
              }}
            />
          </label>

          <label className="flex flex-col gap-2" htmlFor={statusId}>
            <span className="text-body-sm text-muted">Estado</span>
            <select
              id={statusId}
              className={fieldClassName}
              value={filters.status ?? ""}
              onChange={(event) =>
                applyFilters({
                  ...filters,
                  status: (event.target.value || undefined) as
                    | AppointmentStatus
                    | undefined,
                })
              }
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No asistió</option>
            </select>
          </label>

          <label className="flex flex-col gap-2" htmlFor={resourceTypeId}>
            <span className="text-body-sm text-muted">Tipo de visita</span>
            <select
              id={resourceTypeId}
              className={fieldClassName}
              value={filters.resourceType ?? ""}
              onChange={(event) =>
                applyFilters({
                  ...filters,
                  resourceType: (event.target.value || undefined) as
                    | AppointmentVisitType
                    | undefined,
                })
              }
            >
              <option value="">Todos</option>
              <option value="property">Inmueble</option>
              <option value="office">Sede</option>
            </select>
          </label>
        </div>

        <p className="text-body-sm text-muted" aria-live="polite">
          {status === "loading"
            ? "Cargando agenda…"
            : `${appointments.length} cita(s) · ${activeCount} activa(s)`}
        </p>

        {status === "error" ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {status !== "loading" && appointments.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              No hay citas registradas para este día con los filtros aplicados.
            </p>
          </AdminCard>
        ) : null}

        {appointments.length > 0 ? (
          <CalendarDayAgenda appointments={appointments} />
        ) : null}
      </div>
    </AdminPage>
  );
}
