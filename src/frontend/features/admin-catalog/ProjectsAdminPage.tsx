"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import type { Project } from "@/domain";

import { CatalogStatusBadge } from "./CatalogStatusBadge";
import { updateAdminProjectRequest } from "./catalog-api.client";
import { mapCatalogError } from "./catalog.logic";

type ProjectsAdminPageProps = {
  initialProjects: Project[];
};

export function ProjectsAdminPage({ initialProjects }: ProjectsAdminPageProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return projects;
    }
    return projects.filter((project) =>
      project.title.toLowerCase().includes(search),
    );
  }, [projects, query]);

  async function toggleActive(project: Project) {
    setSavingId(project.id);
    setErrorMessage("");
    const result = await updateAdminProjectRequest(project.id, {
      active: !project.active,
    });
    setSavingId(null);
    if (!result.ok) {
      setErrorMessage(mapCatalogError(result.error));
      return;
    }
    const next = result.value;
    setProjects((current) =>
      current.map((item) => (item.id === next.id ? next : item)),
    );
  }

  return (
    <AdminPage
      title="Proyectos inmobiliarios"
      description="Desarrollos (ej. Terraza Colibrí). No confundir con la página pública /projects, que es el catálogo de inmuebles."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex w-full flex-col gap-2 sm:max-w-sm">
            <span className="text-body-sm text-muted">Buscar</span>
            <input
              type="search"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Link
            href="/admin/projects/new"
            className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Crear proyecto
          </Link>
        </div>

        {errorMessage ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              No hay proyectos que coincidan.
            </p>
          </AdminCard>
        ) : (
          <ul className="flex flex-col gap-4">
            {filtered.map((project) => (
              <li key={project.id}>
                <AdminCard>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-2">
                      <p className="text-body-md text-foreground">
                        {project.title}
                      </p>
                      <CatalogStatusBadge active={project.active} />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50"
                        disabled={savingId === project.id}
                        onClick={() => void toggleActive(project)}
                      >
                        {project.active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                </AdminCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminPage>
  );
}
