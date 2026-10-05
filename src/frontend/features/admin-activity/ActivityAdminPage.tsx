"use client";

import { useId, useRef, useState } from "react";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/domain";
import type { AuditAction, AuditEntityType, AuditEntry } from "@/domain";
import { AdminCard, AdminPage } from "@/features/admin";

import { listAdminActivityRequest } from "./admin-activity-api.client";
import { ActivityEntryCard } from "./ActivityEntryCard";
import {
  getAuditActionLabel,
  getAuditEntityLabel,
  mapActivityError,
} from "./admin-activity.logic";
import type {
  AdminActivityFilters,
  AdminActivityViewStatus,
} from "./admin-activity.types";

type ActivityAdminPageProps = {
  pageSize: number;
  initialEntries: AuditEntry[];
  initialHasMore: boolean;
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const buttonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function ActivityAdminPage({
  pageSize,
  initialEntries,
  initialHasMore,
}: ActivityAdminPageProps) {
  const entityTypeId = useId();
  const actionId = useId();
  const [filters, setFilters] = useState<AdminActivityFilters>({});
  const [entries, setEntries] = useState<AuditEntry[]>(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [status, setStatus] = useState<AdminActivityViewStatus>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const requestId = useRef(0);

  function load(next: AdminActivityFilters, offset: number, append: boolean) {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setFilters(next);
    setStatus("loading");
    setErrorMessage("");

    void listAdminActivityRequest({
      filters: next,
      limit: pageSize,
      offset,
    }).then((result) => {
      if (currentRequest !== requestId.current) {
        return;
      }

      if (!result.ok) {
        setStatus("error");
        setErrorMessage(mapActivityError(result.error));
        return;
      }

      setEntries((current) =>
        append ? [...current, ...result.entries] : result.entries,
      );
      setHasMore(result.hasMore);
      setStatus("ready");
    });
  }

  return (
    <AdminPage
      title="Historial de movimientos"
      description="Acciones administrativas registradas por el servidor. Independiente de las notificaciones y de los eventos de seguridad."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2" htmlFor={entityTypeId}>
            <span className="text-body-sm text-muted">Entidad</span>
            <select
              id={entityTypeId}
              className={fieldClassName}
              value={filters.entityType ?? ""}
              onChange={(event) =>
                load(
                  {
                    ...filters,
                    entityType: (event.target.value || undefined) as
                      | AuditEntityType
                      | undefined,
                  },
                  0,
                  false,
                )
              }
            >
              <option value="">Todas</option>
              {AUDIT_ENTITY_TYPES.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {getAuditEntityLabel(entityType)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2" htmlFor={actionId}>
            <span className="text-body-sm text-muted">Acción</span>
            <select
              id={actionId}
              className={fieldClassName}
              value={filters.action ?? ""}
              onChange={(event) =>
                load(
                  {
                    ...filters,
                    action: (event.target.value || undefined) as
                      | AuditAction
                      | undefined,
                  },
                  0,
                  false,
                )
              }
            >
              <option value="">Todas</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {getAuditActionLabel(action)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-body-sm text-muted" aria-live="polite">
          {status === "loading"
            ? "Cargando historial…"
            : `${entries.length} movimiento(s) cargado(s)`}
        </p>

        {status === "error" ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {status !== "loading" && entries.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              Todavía no hay movimientos registrados con estos filtros.
            </p>
          </AdminCard>
        ) : null}

        {entries.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {entries.map((entry) => (
              <li key={entry.id}>
                <ActivityEntryCard entry={entry} />
              </li>
            ))}
          </ul>
        ) : null}

        {hasMore ? (
          <button
            type="button"
            className={buttonClassName}
            disabled={status === "loading"}
            onClick={() => load(filters, entries.length, true)}
          >
            Cargar más movimientos
          </button>
        ) : null}
      </div>
    </AdminPage>
  );
}
