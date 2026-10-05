import {
  adminPagePermissions,
  requireAdminPage,
} from "@/features/admin/server";
import { ProjectsAdminPage } from "@/frontend/features/admin-catalog";
import { listAdminProjects } from "@/backend/services/project-service";

export default async function ProjectsRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.projects,
    },
    deniedDescription: "No tienes permiso para gestionar proyectos inmobiliarios.",
  });
  if (!access.allowed) {
    return access.element;
  }

  const projects = await listAdminProjects();
  return <ProjectsAdminPage initialProjects={projects} />;
}
