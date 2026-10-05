"use client";

import type { AccessRequest } from "@/domain";

import { AdminCard } from "../../AdminCard";
import { formatAdminDate } from "../users.logic";

type AccessRequestsSectionProps = {
  requests: AccessRequest[];
  busyRequestId: string | null;
  errorMessage?: string;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
};

const buttonPrimaryClassName =
  "inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-label text-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const buttonSecondaryClassName =
  "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const statusLabels: Record<AccessRequest["status"], string> = {
  pending: "Pendiente",
  approved: "Aceptada",
  rejected: "Rechazada",
};

export function AccessRequestsSection({
  requests,
  busyRequestId,
  errorMessage,
  onApprove,
  onReject,
}: AccessRequestsSectionProps) {
  const pending = requests.filter((request) => request.status === "pending");
  const recent = requests.filter((request) => request.status !== "pending");

  return (
    <div className="flex flex-col gap-4">
      {errorMessage ? (
        <p className="text-body-sm text-foreground" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {pending.length === 0 ? (
        <AdminCard>
          <p className="text-body-md text-muted">
            No hay solicitudes de ingreso pendientes.
          </p>
        </AdminCard>
      ) : (
        <ul className="flex flex-col gap-4">
          {pending.map((request) => {
            const displayName = [request.firstName, request.lastName]
              .filter(Boolean)
              .join(" ");
            const isBusy = busyRequestId === request.id;

            return (
              <li key={request.id}>
                <AdminCard>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="text-body-md text-foreground">
                        {displayName || "Solicitud de ingreso"}
                      </p>
                      <p className="break-all text-body-sm text-muted">
                        {request.email}
                      </p>
                      <p className="text-body-sm text-muted">
                        {statusLabels[request.status]}
                        {" · "}
                        {formatAdminDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={Boolean(busyRequestId)}
                        onClick={() => onReject(request.id)}
                        className={buttonSecondaryClassName}
                      >
                        {isBusy ? "Guardando…" : "Rechazar"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busyRequestId)}
                        onClick={() => onApprove(request.id)}
                        className={buttonPrimaryClassName}
                      >
                        {isBusy ? "Enviando código…" : "Aceptar y enviar código"}
                      </button>
                    </div>
                  </div>
                </AdminCard>
              </li>
            );
          })}
        </ul>
      )}

      {recent.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-muted">Solicitudes recientes</p>
          <ul className="flex flex-col gap-2">
            {recent.slice(0, 6).map((request) => (
              <li
                key={request.id}
                className="rounded-md border border-border bg-background px-4 py-3 text-body-sm text-muted"
              >
                {request.email}
                {" · "}
                {statusLabels[request.status]}
                {" · "}
                {formatAdminDate(request.updatedAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
