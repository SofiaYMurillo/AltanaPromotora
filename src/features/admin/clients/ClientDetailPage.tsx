import Link from "next/link";

import { AdminCard, AdminPage } from "@/features/admin";

import {
  appointmentStatusLabel,
  appointmentTypeLabel,
  clientContactSummary,
  clientDisplayName,
  formatClientDate,
} from "./clients.logic";
import type { ClientDetailPageData } from "./clients.types";

type ClientDetailPageProps = {
  data: ClientDetailPageData;
};

export function ClientDetailPage({ data }: ClientDetailPageProps) {
  const { client, appointments } = data;

  return (
    <AdminPage
      title={clientDisplayName(client)}
      description="Datos de contacto e historial de citas de este cliente."
    >
      <div className="flex flex-col gap-6">
        <p>
          <Link
            href="/admin/clients"
            className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Volver a clientes
          </Link>
        </p>

        <AdminCard>
          <dl className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Contacto</dt>
              <dd className="break-all text-body-md text-foreground">
                {clientContactSummary(client)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-body-sm text-muted">Registro</dt>
              <dd className="text-body-md text-foreground">
                {formatClientDate(client.createdAt)}
              </dd>
            </div>
          </dl>
        </AdminCard>

        <section
          className="flex flex-col gap-4"
          aria-labelledby="client-appointments-heading"
        >
          <h2
            id="client-appointments-heading"
            className="text-heading-sm text-foreground"
          >
            Citas
          </h2>

          {appointments.length === 0 ? (
            <AdminCard>
              <p className="text-body-md text-muted">
                Este cliente todavía no tiene citas asociadas.
              </p>
            </AdminCard>
          ) : (
            <ul className="flex flex-col gap-4">
              {appointments.map((appointment) => (
                <li key={appointment.id}>
                  <AdminCard>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-body-md text-foreground">
                          {appointmentTypeLabel(appointment.type)}
                        </p>
                        <p className="text-body-sm text-muted">
                          {appointment.date} · {appointment.time}
                        </p>
                      </div>
                      <p className="text-body-sm text-muted">
                        {appointmentStatusLabel(appointment.status)}
                      </p>
                    </div>
                  </AdminCard>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminPage>
  );
}
