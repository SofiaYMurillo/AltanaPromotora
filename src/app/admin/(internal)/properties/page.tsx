import { listAdminProjects } from "@/backend/services/project-service";
import { listAdminProperties } from "@/backend/services/property-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { PropertiesAdminPage } from "@/frontend/features/admin-catalog";

export default async function PropertiesAdminRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.properties,
    },
    deniedDescription: "No tienes permiso para gestionar inmuebles.",
  });
  if (!access.allowed) {
    return access.element;
  }
  const [properties, projects] = await Promise.all([
    listAdminProperties(),
    listAdminProjects(),
  ]);
  return (
    <PropertiesAdminPage initialProperties={properties} projects={projects} />
  );
}
