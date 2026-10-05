import { AdminCard, AdminPage } from "@/features/admin";
import Link from "next/link";

type SettingsPageProps = {
  isPrincipalAdmin: boolean;
  mailConnected: boolean;
  mailEmail?: string;
  mailExpectedEmail: string;
  mailNotice?: string;
};

export function SettingsPage({
  isPrincipalAdmin,
  mailConnected,
  mailEmail,
  mailExpectedEmail,
  mailNotice,
}: SettingsPageProps) {
  return (
    <AdminPage
      title="Configuración"
      description="Ajustes administrativos y consulta de historial. No incluye configuración técnica del sistema."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard>
          <div className="flex flex-col gap-3">
            <h2 className="text-heading-sm text-foreground">
              Historial de movimientos
            </h2>
            <p className="text-body-sm text-muted">
              Consulta acciones realizadas por usuarios internos.
            </p>
            <Link
              href="/admin/settings/activity"
              className="w-fit text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Abrir historial
            </Link>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex flex-col gap-3">
            <h2 className="text-heading-sm text-foreground">
              Seguridad de acceso
            </h2>
            <p className="text-body-sm text-muted">
              Cambio de contraseña del administrador principal y referencia para
              códigos de trabajadores.
            </p>
            <Link
              href="/admin/settings/security"
              className="w-fit text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Abrir seguridad
            </Link>
          </div>
        </AdminCard>

        {isPrincipalAdmin ? (
          <AdminCard>
            <div className="flex flex-col gap-3">
              <h2 className="text-heading-sm text-foreground">
                Correo de salida
              </h2>
              <p className="text-body-sm text-muted">
                Esta cuenta de Google no admite contraseñas de aplicación. Conecta
                Gmail una vez para que los códigos de ingreso salgan de{" "}
                {mailExpectedEmail}.
              </p>
              <p className="text-body-sm text-foreground">
                {mailConnected
                  ? `Conectado${mailEmail ? `: ${mailEmail}` : "."}`
                  : "Aún no está conectado."}
              </p>
              {mailNotice ? (
                <p className="text-body-sm text-foreground" role="status">
                  {mailNotice}
                </p>
              ) : null}
              <p className="text-caption text-muted">
                En Google Cloud → Credenciales del cliente OAuth, añade esta URI:
                http://localhost:3000/api/admin/mail/google/callback. Activa
                también la API de Gmail.
              </p>
              <a
                href="/api/admin/mail/google/connect"
                className="inline-flex w-fit items-center justify-center rounded-md bg-accent px-4 py-2 text-label text-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {mailConnected ? "Volver a conectar Gmail" : "Conectar Gmail"}
              </a>
            </div>
          </AdminCard>
        ) : null}
      </div>
    </AdminPage>
  );
}
