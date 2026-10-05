"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";
import type { Project, Property } from "@/domain";

import {
  createAdminPropertyRequest,
  updateAdminPropertyRequest,
} from "./catalog-api.client";
import { mapCatalogError } from "./catalog.logic";
import {
  emptyPropertyForm,
  PropertyForm,
  propertyFormToPayload,
  propertyToForm,
  type PropertyFormValue,
} from "./PropertyForm";

type PropertyEditorPageProps = {
  property?: Property;
  projects: Project[];
};

export function PropertyEditorPage({
  property,
  projects,
}: PropertyEditorPageProps) {
  const router = useRouter();
  const [value, setValue] = useState<PropertyFormValue>(
    property ? propertyToForm(property) : emptyPropertyForm(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    setIsSaving(true);
    setErrorMessage("");
    const payload = propertyFormToPayload(value);
    const result = property
      ? await updateAdminPropertyRequest(property.id, payload)
      : await createAdminPropertyRequest(payload);
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(mapCatalogError(result.error));
      return;
    }

    router.push("/admin/properties");
    router.refresh();
  }

  return (
    <AdminPage
      title={property ? "Editar inmueble" : "Crear inmueble"}
      description="Las referencias de imagen apuntan a archivos locales. El archivo físico no se sube desde este formulario."
    >
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/properties"
          className="text-body-sm text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Volver a inmuebles
        </Link>
        {errorMessage ? (
          <p className="text-body-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <AdminCard>
          <PropertyForm
            value={value}
            projects={projects}
            onChange={setValue}
            onSubmit={() => void handleSubmit()}
            isSaving={isSaving}
            submitLabel={property ? "Guardar cambios" : "Crear inmueble"}
          />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
