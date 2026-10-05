"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import {
  getAllowedContactRequestTransitions,
  type ContactRequest,
  type ContactRequestStatus,
} from "@/domain";

import { changeAdminContactRequestStatusRequest } from "./admin-contact-requests-api.client";
import { ContactRequestStatusBadge } from "./ContactRequestStatusBadge";
import {
  formatContactRequestDate,
  getContactRequestActionLabel,
  mapContactRequestError,
} from "@/frontend/features/contact-requests/contact-requests.logic";

type ContactRequestDetailPageProps = {
  initialRequest: ContactRequest;
};

const actionButtonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function ContactRequestDetailPage({
  initialRequest,
}: ContactRequestDetailPageProps) {
  const [item, setItem] = useState(initialRequest);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const allowed = getAllowedContactRequestTransitions(item.status);

  async function applyStatus(nextStatus: ContactRequestStatus) {
    setIsSaving(true);
    setErrorMessage("");
    setFeedback("");
    const result = await changeAdminContactRequestStatusRequest({
      id: item.id,
      status: nextStatus,
    });
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(mapContactRequestError(result.error));
      return;
    }

    setItem(result.value);
    setFeedback(
      `Estado actualizado a ${result.value.status === "responded" ? "respondida" : "cerrada"}.`,
    );
  }

  return (
    <AdminPage
      title="Detalle de la solicitud"
      description="El cambio de estado se valida en el servidor. Esta solicitud no crea un cliente."
    >
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/contact-requests"
          className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Volver a solicitudes
        </Link>

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
              <dt className="text-body-sm text-muted">Nombre</dt>
              <dd className="text-body-md text-foreground">{item.name}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Estado</dt>
              <dd>
                <ContactRequestStatusBadge status={item.status} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Correo</dt>
              <dd className="break-all text-body-md text-foreground">
                {item.email ?? "No indicado"}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Teléfono</dt>
              <dd className="break-all text-body-md text-foreground">
                {item.phone ?? "No indicado"}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Creada</dt>
              <dd className="text-body-md text-foreground">
                {formatContactRequestDate(item.createdAt)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Actualizada</dt>
              <dd className="text-body-md text-foreground">
                {formatContactRequestDate(item.updatedAt)}
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="text-heading-sm text-foreground">Mensaje</h2>
          <p className="mt-3 whitespace-pre-wrap text-body-md text-foreground">
            {item.message}
          </p>
        </AdminCard>

        {allowed.length > 0 ? (
          <AdminCard>
            <h2 className="text-heading-sm text-foreground">Acciones</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {allowed.map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  className={actionButtonClassName}
                  disabled={isSaving}
                  onClick={() => void applyStatus(nextStatus)}
                >
                  {getContactRequestActionLabel(nextStatus)}
                </button>
              ))}
            </div>
          </AdminCard>
        ) : (
          <p className="text-body-sm text-muted">
            Esta solicitud está cerrada y no admite más cambios.
          </p>
        )}
      </div>
    </AdminPage>
  );
}
