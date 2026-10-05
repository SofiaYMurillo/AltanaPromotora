"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import type { AppointmentStatus, AppointmentVisitType } from "@/domain";

import { listAdminAppointmentsRequest } from "./admin-appointments-api.client";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import {
  clientDisplayName,
  formatAppointmentDate,
  formatAppointmentTime,
  getVisitTypeLabel,
  mapAdminAppointmentError,
} from "./admin-appointments.logic";
import type {
  AdminAppointmentFilters,
  AdminAppointmentView,
} from "./admin-appointments.types";

type AppointmentsAdminPageProps = {
  initialAppointments: AdminAppointmentView[];
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function AppointmentsAdminPage({
  initialAppointments,
}: AppointmentsAdminPageProps) {
  const searchId = useId();
  const [filters, setFilters] = useState<AdminAppointmentFilters>({});
  const [draftSearch, setDraftSearch] = useState("");
  const [appointments, setAppointments] =
    useState<AdminAppointmentView[]>(initialAppointments);
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const requestId = useRef(0);

  function applyFilters(next: AdminAppointmentFilters) {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setFilters(next);
    setStatus("loading");
    setErrorMessage("");

    void listAdminAppointmentsRequest(next).then((result) => {
      if (currentRequest !== requestId.current) {
        return;
      }

      if (!result.ok) {
        setStatus("error");
        setErrorMessage(mapAdminAppointmentError(result.error));
        return;
      }

      setAppointments(result.appointments);
      setStatus("ready");
    });
  }

  return (
    <AdminPage
      title="Citas"
      description="Solicitudes de visita reales. Los cambios de estado se validan en el servidor y actualizan la disponibilidad."
    >
      <div className="flex flex-col gap-6">
        <form
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters({
              ...filters,
              search: draftSearch.trim() || undefined,
            });
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="text-body-sm text-muted">Estado</span>
            <select
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

          <label className="flex flex-col gap-2">
            <span className="text-body-sm text-muted">Tipo de visita</span>
            <select
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

          <label className="flex flex-col gap-2">
            <span className="text-body-sm text-muted">Desde</span>
            <input
              type="date"
              className={fieldClassName}
              value={filters.from ?? ""}
              onChange={(event) =>
                applyFilters({
                  ...filters,
                  from: event.target.value || undefined,
                })
              }
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-body-sm text-muted">Hasta</span>
            <input
              type="date"
              className={fieldClassName}
              value={filters.to ?? ""}
              onChange={(event) =>
                applyFilters({
                  ...filters,
                  to: event.target.value || undefined,
                })
              }
            />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2 xl:col-span-3">
            <span className="text-body-sm text-muted" id={searchId}>
              Buscar por cliente o contacto
            </span>
            <input
              type="search"
              className={fieldClassName}
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              aria-labelledby={searchId}
              autoComplete="off"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Buscar
            </button>
          </div>
        </form>

        {status === "loading" ? (
          <p className="text-body-sm text-muted" aria-live="polite">
            Cargando citas…
          </p>
        ) : null}

        {status === "error" ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {status !== "loading" && appointments.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              No hay citas que coincidan con los filtros.
            </p>
          </AdminCard>
        ) : null}

        {appointments.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {appointments.map((item) => (
              <li key={item.appointment.id}>
                <AdminCard>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="text-body-md text-foreground">
                        {formatAppointmentDate(item.appointment.date)} ·{" "}
                        {formatAppointmentTime(item.appointment.time)}
                      </p>
                      <p className="text-body-sm text-muted">
                        {getVisitTypeLabel(item.appointment.type)} ·{" "}
                        {item.resource.title}
                        {item.resource.missing ? " (no disponible)" : ""}
                      </p>
                      <p className="break-all text-body-sm text-muted">
                        {clientDisplayName(item.client)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <AppointmentStatusBadge
                          status={item.appointment.status}
                        />
                        <p className="text-body-sm text-foreground">
                          {item.appointment.communicationPreference !== "none"
                            ? item.appointment.communicationPreference ===
                              "whatsapp"
                              ? "WhatsApp"
                              : "Correo"
                            : "Sin comunicación"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/appointments/${item.appointment.id}`}
                      className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </AdminCard>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AdminPage>
  );
}
