import { notFound } from "next/navigation";

import { listAdminProjects } from "@/backend/services/project-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { getAdminProperty } from "@/backend/services/property-service";
import { PropertyEditorPage } from "@/frontend/features/admin-catalog";

type PropertyEditRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyEditRoute({
  params,
}: PropertyEditRouteProps) {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.properties,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const { id } = await params;
  const [property, projects] = await Promise.all([
    getAdminProperty(id),
    listAdminProjects(),
  ]);

  if (!property) {
    notFound();
  }

  return <PropertyEditorPage property={property} projects={projects} />;
}
