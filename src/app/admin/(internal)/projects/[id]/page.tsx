import { notFound } from "next/navigation";

import { getAdminProject } from "@/backend/services/project-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { listAdminProperties } from "@/backend/services/property-service";
import { ProjectEditorPage } from "@/frontend/features/admin-catalog";

type ProjectEditRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectEditRoute({
  params,
}: ProjectEditRouteProps) {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.projects,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const { id } = await params;
  const [project, properties] = await Promise.all([
    getAdminProject(id),
    listAdminProperties({ projectId: id }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectEditorPage
      project={project}
      associatedProperties={properties}
    />
  );
}
