import Link from "next/link";

import { AdminCard, AdminPage } from "@/features/admin";

import { DashboardMetricCard } from "./components/DashboardMetricCard";
import { DashboardMetricsGrid } from "./components/DashboardMetricsGrid";
import type { DashboardPageData } from "./dashboard.types";

type DashboardPageProps = {
  data: DashboardPageData;
};

export function DashboardPage({ data }: DashboardPageProps) {
  return (
    <AdminPage
      title="Inicio"
      description="Resumen operativo del panel administrativo de ALTANA PROMOTORA."
    >
      <div className="flex flex-col gap-8">
        <DashboardMetricsGrid>
          <div className="col-span-4">
            <DashboardMetricCard
              title="Proyectos"
              value={data.projectsCount}
              description="Desarrollos inmobiliarios"
            />
          </div>
          <div className="col-span-4">
            <DashboardMetricCard
              title="Inmuebles"
              value={data.propertiesCount}
              description="Unidades comerciales"
            />
          </div>
          <div className="col-span-4">
            <DashboardMetricCard
              title="Citas"
              value={data.appointmentsCount}
              description={`${data.pendingAppointmentsCount} pendientes`}
            />
          </div>
        </DashboardMetricsGrid>

        <section className="flex flex-col gap-4">
          <h2 className="text-heading-sm text-foreground">Áreas del panel</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminCard>
              <div className="flex flex-col gap-3">
                <h3 className="text-heading-sm text-foreground">
                  Modifica tu página
                </h3>
                <p className="text-body-sm text-muted">
                  Ajusta contenido público e información de contacto visibles
                  para los visitantes.
                </p>
                <Link
                  href="/admin/page-content"
                  className="w-fit text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Ir a contenido
                </Link>
              </div>
            </AdminCard>

            <AdminCard>
              <div className="flex flex-col gap-3">
                <h3 className="text-heading-sm text-foreground">
                  Gestiona tu página
                </h3>
                <p className="text-body-sm text-muted">
                  Opera proyectos, inmuebles, citas y, cuando corresponda,
                  usuarios internos.
                </p>
                <Link
                  href="/admin/properties"
                  className="w-fit text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Ir a inmuebles
                </Link>
              </div>
            </AdminCard>
          </div>
        </section>

        <p className="text-body-sm text-muted">
          Usuarios internos registrados: {data.internalUsersCount}
        </p>
      </div>
    </AdminPage>
  );
}
