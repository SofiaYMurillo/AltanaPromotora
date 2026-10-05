"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import type { AppointmentStatus } from "@/domain";

import { changeAdminAppointmentStatusRequest } from "./admin-appointments-api.client";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import {
  clientDisplayName,
  formatAppointmentDate,
  formatAppointmentTime,
  getAppointmentStatusLabel,
  getStatusActionLabel,
  getVisitTypeLabel,
  mapAdminAppointmentError,
  statusNeedsConfirmation,
} from "./admin-appointments.logic";
import type { AdminAppointmentView } from "./admin-appointments.types";

type AppointmentDetailPageProps = {
  initialAppointment: AdminAppointmentView;
};

const actionButtonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function AppointmentDetailPage({
  initialAppointment,
}: AppointmentDetailPageProps) {
  const [item, setItem] = useState(initialAppointment);
  const [pendingStatus, setPendingStatus] = useState<AppointmentStatus | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const { appointment, client, resource, worker } = item;

  async function applyStatus(nextStatus: AppointmentStatus) {
    setIsSaving(true);
    setErrorMessage("");
    setFeedback("");

    const result = await changeAdminAppointmentStatusRequest({
      id: appointment.id,
      status: nextStatus,
      expectedStatus: appointment.status,
    });

    setIsSaving(false);
    setPendingStatus(null);

    if (!result.ok) {
      setErrorMessage(mapAdminAppointmentError(result.error));
      return;
    }

    setItem(result.appointment);
    setFeedback(
      `Estado actualizado a ${getAppointmentStatusLabel(result.appointment.appointment.status)}.`,
    );
  }

  function handleAction(nextStatus: AppointmentStatus) {
    if (statusNeedsConfirmation(nextStatus)) {
      setPendingStatus(nextStatus);
      setErrorMessage("");
      setFeedback("");
      return;
    }

    void applyStatus(nextStatus);
  }

  return (
    <AdminPage
      title="Detalle de la cita"
      description="La disponibilidad se actualiza según el estado. El servidor vuelve a validar cada cambio."
    >
      <div className="flex flex-col gap-6">
        <p>
          <Link
            href="/admin/appointments"
            className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Volver a citas
          </Link>
        </p>

        {errorMessage ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {feedback ? (
          <p className="text-body-sm text-muted" role="status">
            {feedback}
          </p>
        ) : null}

        <AdminCard>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Fecha</dt>
              <dd className="text-body-md text-foreground">
                {formatAppointmentDate(appointment.date)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Hora</dt>
              <dd className="text-body-md text-foreground">
                {formatAppointmentTime(appointment.time)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Estado</dt>
              <dd>
                <AppointmentStatusBadge status={appointment.status} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Tipo</dt>
              <dd className="text-body-md text-foreground">
                {getVisitTypeLabel(appointment.type)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Comunicación</dt>
              <dd className="text-body-md text-foreground">
                {appointment.communicationPreference === "whatsapp"
                  ? `WhatsApp${appointment.contact?.phone ? ` · ${appointment.contact.phone}` : ""}`
                  : appointment.communicationPreference === "email"
                    ? `Correo${appointment.contact?.email ? ` · ${appointment.contact.email}` : ""}`
                    : "No desea recibir información"}
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="text-heading-sm text-foreground">Recurso</h2>
          <p className="mt-3 text-body-md text-foreground">{resource.title}</p>
          <p className="mt-1 text-body-sm text-muted">{resource.location}</p>
          {resource.missing ? (
            <p className="mt-2 text-body-sm text-muted">
              Este recurso ya no está disponible en el catálogo.
            </p>
          ) : null}
        </AdminCard>

        <AdminCard>
          <h2 className="text-heading-sm text-foreground">Cliente</h2>
          {client ? (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-body-md text-foreground">
                {clientDisplayName(client)}
              </p>
              <p className="break-all text-body-sm text-muted">
                {[client.email, client.phone].filter(Boolean).join(" · ") ||
                  "Sin datos de contacto"}
              </p>
              <Link
                href={`/admin/clients/${client.id}`}
                className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Ver ficha del cliente
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-body-md text-muted">
              Sin cliente registrado
            </p>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="text-heading-sm text-foreground">Trabajador</h2>
          <p className="mt-3 text-body-md text-foreground">
            {worker ? worker.displayName : "Sin asignación"}
          </p>
        </AdminCard>

        {item.allowedTransitions.length > 0 ? (
          <AdminCard>
            <h2 className="text-heading-sm text-foreground">Acciones</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {item.allowedTransitions.map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  className={actionButtonClassName}
                  disabled={isSaving}
                  onClick={() => handleAction(nextStatus)}
                >
                  {getStatusActionLabel(nextStatus)}
                </button>
              ))}
            </div>

            {pendingStatus ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                <p className="text-body-sm text-foreground" role="status">
                  ¿Confirmas marcar esta cita como{" "}
                  {getAppointmentStatusLabel(pendingStatus)}?
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className={actionButtonClassName}
                    disabled={isSaving}
                    onClick={() => void applyStatus(pendingStatus)}
                  >
                    {isSaving ? "Actualizando…" : "Confirmar cambio"}
                  </button>
                  <button
                    type="button"
                    className={actionButtonClassName}
                    disabled={isSaving}
                    onClick={() => setPendingStatus(null)}
                  >
                    Volver
                  </button>
                </div>
              </div>
            ) : null}
          </AdminCard>
        ) : (
          <p className="text-body-sm text-muted">
            Esta cita está en un estado final y no admite más cambios.
          </p>
        )}
      </div>
    </AdminPage>
  );
}
