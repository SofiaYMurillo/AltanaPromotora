import { resolvePublicSiteSettings } from "@/backend/services/site-settings-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { ContactAdminPage } from "@/features/admin/contact";

export default async function ContactAdminRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.contactSettings,
    },
    deniedDescription: "No tienes permiso para editar la información de contacto.",
  });
  if (!access.allowed) {
    return access.element;
  }

  const settings = await resolvePublicSiteSettings();
  return <ContactAdminPage settings={settings} />;
}
