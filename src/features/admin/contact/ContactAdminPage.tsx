import { AdminPage } from "@/features/admin";
import type { SiteSettings } from "@/types/site-settings";

import { ContactSettingsForm } from "./ContactSettingsForm";

type ContactAdminPageProps = {
  settings: SiteSettings;
};

export function ContactAdminPage({ settings }: ContactAdminPageProps) {
  return (
    <AdminPage
      title="Información de contacto"
      description="Fuente única para teléfono, correo, dirección e Instagram en el sitio público."
    >
      <ContactSettingsForm settings={settings} />
    </AdminPage>
  );
}
