"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import type { Project, Property } from "@/domain";

import {
  createAdminProjectRequest,
  updateAdminProjectRequest,
} from "./catalog-api.client";
import { mapCatalogError } from "./catalog.logic";
import {
  emptyProjectForm,
  ProjectForm,
  projectToForm,
  type ProjectFormValue,
} from "./ProjectForm";
import { ProjectAssociatedProperties } from "./ProjectAssociatedProperties";

type ProjectEditorPageProps = {
  project?: Project;
  associatedProperties?: Property[];
};

export function ProjectEditorPage({
  project,
  associatedProperties = [],
}: ProjectEditorPageProps) {
  const router = useRouter();
  const [value, setValue] = useState<ProjectFormValue>(
    project ? projectToForm(project) : emptyProjectForm(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    setIsSaving(true);
    setErrorMessage("");
    const result = project
      ? await updateAdminProjectRequest(project.id, value)
      : await createAdminProjectRequest(value);
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(mapCatalogError(result.error));
      return;
    }

    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <AdminPage
      title={
        project ? "Editar proyecto inmobiliario" : "Crear proyecto inmobiliario"
      }
      description="Desarrollo inmobiliario (ej. Terraza Colibrí). La página pública /projects es el catálogo de inmuebles y no se construye desde aquí. La publicación del proyecto es independiente de sus inmuebles."
    >
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/projects"
          className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Volver a proyectos
        </Link>
        {errorMessage ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <AdminCard>
          <ProjectForm
            value={value}
            onChange={setValue}
            onSubmit={() => void handleSubmit()}
            isSaving={isSaving}
            submitLabel={project ? "Guardar cambios" : "Crear proyecto"}
          />
        </AdminCard>

        {project ? (
          <AdminCard>
            <ProjectAssociatedProperties
              projectId={project.id}
              properties={associatedProperties}
            />
          </AdminCard>
        ) : null}
      </div>
    </AdminPage>
  );
}
