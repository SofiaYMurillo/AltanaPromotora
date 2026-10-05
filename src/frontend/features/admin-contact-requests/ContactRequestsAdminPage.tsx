"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import type { ContactRequest } from "@/domain";

import { ContactRequestStatusBadge } from "./ContactRequestStatusBadge";
import {
  contactSummary,
  formatContactRequestDate,
} from "@/frontend/features/contact-requests/contact-requests.logic";

type ContactRequestsAdminPageProps = {
  initialRequests: ContactRequest[];
};

export function ContactRequestsAdminPage({
  initialRequests,
}: ContactRequestsAdminPageProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return initialRequests;
    }
    return initialRequests.filter((item) =>
      [item.name, item.email, item.phone, item.message]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(search)),
    );
  }, [initialRequests, query]);

  return (
    <AdminPage
      title="Solicitudes de contacto"
      description="Mensajes enviados desde el sitio público. No crean un cliente ni una cita."
    >
      <div className="flex flex-col gap-6">
        {initialRequests.length > 0 ? (
          <label className="flex max-w-sm flex-col gap-2">
            <span className="text-body-sm text-muted">Buscar</span>
            <input
              type="search"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        ) : null}

        {filtered.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              {initialRequests.length === 0
                ? "Todavía no hay solicitudes de contacto."
                : "No hay solicitudes que coincidan con la búsqueda."}
            </p>
          </AdminCard>
        ) : (
          <ul className="flex flex-col gap-4">
            {filtered.map((item) => (
              <li key={item.id}>
                <AdminCard>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="text-body-md text-foreground">{item.name}</p>
                      <p className="break-all text-body-sm text-muted">
                        {contactSummary(item)}
                      </p>
                      <p className="text-body-sm text-muted">
                        {formatContactRequestDate(item.createdAt)}
                      </p>
                      <ContactRequestStatusBadge status={item.status} />
                    </div>
                    <Link
                      href={`/admin/contact-requests/${item.id}`}
                      className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                    >
                      Ver detalle
                    </Link>
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
