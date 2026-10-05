"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import type { Project, Property } from "@/domain";

import { CatalogStatusBadge } from "./CatalogStatusBadge";
import {
  deleteAdminPropertyRequest,
  updateAdminPropertyRequest,
} from "./catalog-api.client";
import {
  formatCatalogPrice,
  getOperationLabel,
  getTypeLabel,
  mapCatalogError,
} from "./catalog.logic";

type PropertiesAdminPageProps = {
  initialProperties: Property[];
  projects: Project[];
};

export function PropertiesAdminPage({
  initialProperties,
  projects,
}: PropertiesAdminPageProps) {
  const [properties, setProperties] = useState(initialProperties);
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const projectTitles = useMemo(
    () => new Map(projects.map((project) => [project.id, project.title])),
    [projects],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return properties;
    }
    return properties.filter((property) => {
      const projectTitle = property.projectId
        ? projectTitles.get(property.projectId)
        : "";
      return [property.title, property.city, projectTitle]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search));
    });
  }, [properties, projectTitles, query]);

  const buttonSecondaryClassName =
    "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

  const buttonDangerClassName =
    "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

  async function toggleActive(property: Property) {
    setSavingId(property.id);
    setErrorMessage("");
    setSuccessMessage("");
    const result = await updateAdminPropertyRequest(property.id, {
      active: !property.active,
    });
    setSavingId(null);
    if (!result.ok) {
      setErrorMessage(mapCatalogError(result.error));
      return;
    }
    const next = result.value;
    setProperties((current) =>
      current.map((item) => (item.id === next.id ? next : item)),
    );
  }

  async function confirmDelete(propertyId: string) {
    setSavingId(propertyId);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await deleteAdminPropertyRequest(propertyId);
    setSavingId(null);
    setConfirmDeleteId(null);

    if (!result.ok) {
      setErrorMessage(mapCatalogError(result.error));
      return;
    }

    setProperties((current) =>
      current.filter((item) => item.id !== propertyId),
    );
    setSuccessMessage("Inmueble eliminado permanentemente.");
  }

  return (
    <AdminPage
      title="Inmuebles"
      description="Unidades comerciales persistidas. Pueden existir con o sin proyecto asociado."
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
            href="/admin/properties/new"
            className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Crear inmueble
          </Link>
        </div>

        {successMessage ? (
          <p className="text-body-sm text-secondary" role="status">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <AdminCard>
            <p className="text-body-md text-muted">
              No hay inmuebles que coincidan.
            </p>
          </AdminCard>
        ) : (
          <ul className="flex flex-col gap-4">
            {filtered.map((property) => (
              <li key={property.id}>
                <AdminCard>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="text-body-md text-foreground">
                        {property.title}
                      </p>
                      <p className="text-body-sm text-muted">
                        {getTypeLabel(property.type)} ·{" "}
                        {getOperationLabel(property.operation)} · {property.city}
                      </p>
                      <p className="text-body-sm text-muted">
                        {property.projectId
                          ? projectTitles.get(property.projectId) ??
                            "Proyecto no disponible"
                          : "Sin proyecto"}
                      </p>
                      <p className="text-body-sm text-foreground">
                        {formatCatalogPrice(property.price)}
                      </p>
                      <p className="text-body-sm text-muted">
                        {property.images.length === 1
                          ? "1 imagen"
                          : `${property.images.length} imágenes`}
                      </p>
                      <CatalogStatusBadge active={property.active} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50"
                          disabled={Boolean(savingId)}
                          onClick={() => void toggleActive(property)}
                        >
                          {savingId === property.id
                            ? "Guardando…"
                            : property.active
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                        {confirmDeleteId !== property.id ? (
                          <button
                            type="button"
                            className={buttonDangerClassName}
                            disabled={Boolean(savingId)}
                            onClick={() => {
                              setConfirmDeleteId(property.id);
                              setErrorMessage("");
                            }}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>

                      {confirmDeleteId === property.id ? (
                        <div className="flex w-full flex-col gap-2 rounded-md border border-border bg-background p-3 sm:max-w-md">
                          <p className="text-body-sm text-foreground">
                            ¿Eliminar este inmueble?
                          </p>
                          <p className="text-body-sm text-muted">
                            Esta acción eliminará permanentemente el inmueble
                            del sistema. No podrá recuperarse desde el panel.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={buttonSecondaryClassName}
                              disabled={savingId === property.id}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className={buttonDangerClassName}
                              disabled={savingId === property.id}
                              onClick={() => void confirmDelete(property.id)}
                            >
                              {savingId === property.id
                                ? "Eliminando…"
                                : "Eliminar inmueble"}
                            </button>
                          </div>
                        </div>
                      ) : null}
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
