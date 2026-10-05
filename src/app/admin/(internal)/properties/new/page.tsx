import { listAdminProjects } from "@/backend/services/project-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { PropertyEditorPage } from "@/frontend/features/admin-catalog";

export default async function NewPropertyRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.properties,
    },
  });
  if (!access.allowed) {
    return access.element;
  }
  const projects = await listAdminProjects();
  return <PropertyEditorPage projects={projects} />;
}
