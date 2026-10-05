import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { ProjectEditorPage } from "@/frontend/features/admin-catalog";

export default async function NewProjectRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.projects,
    },
  });
  if (!access.allowed) {
    return access.element;
  }
  return <ProjectEditorPage />;
}
