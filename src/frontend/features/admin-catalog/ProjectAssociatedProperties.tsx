import Link from "next/link";

import type { Property } from "@/domain";

import { getOperationLabel, getTypeLabel } from "./catalog.logic";

type ProjectAssociatedPropertiesProps = {
  projectId: string;
  properties: Property[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProjectAssociatedProperties({
  projectId,
  properties,
}: ProjectAssociatedPropertiesProps) {
  const associated = properties.filter(
    (property) => property.projectId === projectId,
  );

  return (
    <section
      aria-labelledby="project-associated-properties-heading"
      className="flex flex-col gap-4 rounded-lg border border-border/60 bg-background/30 p-5"
    >
      <div>
        <h2
          id="project-associated-properties-heading"
          className="text-heading-sm text-foreground"
        >
          Inmuebles asociados
        </h2>
        <p className="mt-1 text-body-sm text-muted">
          Unidades vinculadas a este desarrollo ({associated.length}). Se
          administran en Inmuebles; aquí solo se consulta y se accede al
          editor.
        </p>
      </div>

      {associated.length === 0 ? (
        <p className="text-body-sm text-secondary">
          Todavía no hay inmuebles con este proyecto asignado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-body-sm">
            <thead>
              <tr className="border-b border-border/60 text-caption text-muted">
                <th className="py-2 pr-4 font-medium">Inmueble</th>
                <th className="py-2 pr-4 font-medium">Operación</th>
                <th className="py-2 pr-4 font-medium">Tipo</th>
                <th className="py-2 pr-4 font-medium">Precio</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {associated.map((property) => (
                <tr
                  key={property.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="py-3 pr-4 text-foreground">{property.title}</td>
                  <td className="py-3 pr-4 text-secondary">
                    {getOperationLabel(property.operation)}
                  </td>
                  <td className="py-3 pr-4 text-secondary">
                    {getTypeLabel(property.type)}
                  </td>
                  <td className="py-3 pr-4 text-secondary">
                    {formatPrice(property.price)}
                  </td>
                  <td className="py-3 pr-4 text-secondary">
                    {property.active ? "Publicado" : "Oculto"}
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="link-editorial"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/admin/properties"
        className="link-editorial w-fit text-body-sm"
      >
        Ir a inmuebles →
      </Link>
    </section>
  );
}
