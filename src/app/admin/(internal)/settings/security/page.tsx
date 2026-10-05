import Link from "next/link";

import { AdminPage, AdminCard } from "@/features/admin";
import { requireAdminPage } from "@/features/admin/server";
import { AdminPasswordForm } from "@/features/admin/settings/AdminPasswordForm";

export default async function AdminSecuritySettingsRoute() {
  const access = await requireAdminPage({
    requirement: { type: "principal" },
    deniedDescription:
      "Solo el administrador principal puede gestionar la seguridad de acceso.",
  });

  if (!access.allowed) {
    return access.element;
  }

  return (
    <AdminPage
      title="Seguridad de acceso"
      description="Gestión de credenciales del administrador principal."
    >
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/settings"
          className="w-fit text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          ← Volver a configuración
        </Link>

        <AdminCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-heading-sm text-foreground">
                Cambiar contraseña
              </h2>
              <p className="text-body-sm text-muted">
                Solo el administrador principal utiliza contraseña. Los códigos
                de trabajadores se gestionan desde Usuarios.
              </p>
            </div>
            <AdminPasswordForm />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex flex-col gap-2">
            <h2 className="text-heading-sm text-foreground">
              Códigos de trabajadores
            </h2>
            <p className="text-body-sm text-muted">
              Para reenviar o regenerar un código, abre la sección Usuarios y
              utiliza la acción Reenviar en la invitación correspondiente.
            </p>
            <Link
              href="/admin/users"
              className="w-fit text-body-sm text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Ir a Usuarios
            </Link>
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}
