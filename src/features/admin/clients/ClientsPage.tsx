"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";

import { AdminCard, AdminPage } from "@/features/admin";

import {
  clientContactSummary,
  clientDisplayName,
  formatClientDate,
  matchesClientQuery,
} from "./clients.logic";
import type { ClientsPageData } from "./clients.types";

type ClientsPageProps = {
  data: ClientsPageData;
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function ClientsPage({ data }: ClientsPageProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      data.clients.filter((item) => matchesClientQuery(item.client, query)),
    [data.clients, query],
  );

  return (
    <AdminPage
      title="Clientes"
      description="Personas que agendaron una visita. No son usuarios del panel y no tienen acceso interno."
    >
      <div className="flex flex-col gap-6">
        {data.clients.length > 0 ? (
          <div className="flex flex-col gap-2">
            <label htmlFor={searchId} className="text-body-sm text-muted">
              Buscar por nombre, correo o teléfono
            </label>
            <input
              id={searchId}
              type="search"
              className={fieldClassName}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}

        {data.clients.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              Todavía no hay clientes. Aparecerán aquí cuando alguien agende una
              visita desde el sitio público.
            </p>
          </AdminCard>
        ) : filtered.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              No hay clientes que coincidan con la búsqueda.
            </p>
          </AdminCard>
        ) : (
          <ul className="flex flex-col gap-4">
            {filtered.map(({ client, appointmentCount }) => (
              <li key={client.id}>
                <AdminCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="text-body-md text-foreground">
                        {clientDisplayName(client)}
                      </p>
                      <p className="break-all text-body-sm text-muted">
                        {clientContactSummary(client)}
                      </p>
                      <p className="text-body-sm text-muted">
                        {appointmentCount === 1
                          ? "1 cita"
                          : `${appointmentCount} citas`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <p className="text-body-sm text-muted">
                        Creado {formatClientDate(client.createdAt)}
                      </p>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        Ver historial
                      </Link>
                    </div>
                  </div>
                </AdminCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminPage>
  );
}
