import type { Project, Property } from "@/domain";

import { MediaGalleryField } from "@/features/admin/media";

export type PropertyFormValue = {
  title: string;
  projectId: string;
  operation: "sale" | "rent";
  type: "house" | "apartment";
  city: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  parkingSpaces: string;
  price: string;
  featuresText: string;
  images: Property["images"];
  active: boolean;
};

type PropertyFormProps = {
  value: PropertyFormValue;
  projects: Project[];
  onChange: (value: PropertyFormValue) => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const buttonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function emptyPropertyForm(): PropertyFormValue {
  return {
    title: "",
    projectId: "",
    operation: "sale",
    type: "house",
    city: "",
    bedrooms: "0",
    bathrooms: "0",
    area: "1",
    parkingSpaces: "0",
    price: "0",
    featuresText: "",
    images: [],
    active: true,
  };
}

export function propertyToForm(property: Property): PropertyFormValue {
  return {
    title: property.title,
    projectId: property.projectId ?? "",
    operation: property.operation,
    type: property.type,
    city: property.city,
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    area: String(property.area),
    parkingSpaces: String(property.parkingSpaces),
    price: String(property.price),
    featuresText: property.features.join("\n"),
    images: property.images,
    active: property.active,
  };
}

export function propertyFormToPayload(value: PropertyFormValue) {
  return {
    title: value.title,
    projectId: value.projectId || undefined,
    operation: value.operation,
    type: value.type,
    city: value.city,
    bedrooms: Number(value.bedrooms),
    bathrooms: Number(value.bathrooms),
    area: Number(value.area),
    parkingSpaces: Number(value.parkingSpaces),
    price: Number(value.price),
    features: value.featuresText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    images: value.images,
    active: value.active,
  };
}

export function PropertyForm({
  value,
  projects,
  onChange,
  onSubmit,
  isSaving,
  submitLabel,
}: PropertyFormProps) {
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Título</span>
        <input
          className={fieldClassName}
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Proyecto</span>
        <select
          className={fieldClassName}
          value={value.projectId}
          onChange={(event) =>
            onChange({ ...value, projectId: event.target.value })
          }
        >
          <option value="">Sin proyecto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Operación</span>
          <select
            className={fieldClassName}
            value={value.operation}
            onChange={(event) =>
              onChange({
                ...value,
                operation: event.target.value as PropertyFormValue["operation"],
              })
            }
          >
            <option value="sale">Venta</option>
            <option value="rent">Arriendo</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Tipo</span>
          <select
            className={fieldClassName}
            value={value.type}
            onChange={(event) =>
              onChange({
                ...value,
                type: event.target.value as PropertyFormValue["type"],
              })
            }
          >
            <option value="house">Casa</option>
            <option value="apartment">Apartamento</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Ciudad</span>
        <input
          className={fieldClassName}
          value={value.city}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Habitaciones</span>
          <input
            type="number"
            min={0}
            className={fieldClassName}
            value={value.bedrooms}
            onChange={(event) =>
              onChange({ ...value, bedrooms: event.target.value })
            }
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Baños</span>
          <input
            type="number"
            min={0}
            className={fieldClassName}
            value={value.bathrooms}
            onChange={(event) =>
              onChange({ ...value, bathrooms: event.target.value })
            }
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Área (m²)</span>
          <input
            type="number"
            min={1}
            className={fieldClassName}
            value={value.area}
            onChange={(event) => onChange({ ...value, area: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-muted">Parqueaderos</span>
          <input
            type="number"
            min={0}
            className={fieldClassName}
            value={value.parkingSpaces}
            onChange={(event) =>
              onChange({ ...value, parkingSpaces: event.target.value })
            }
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Precio</span>
        <input
          type="number"
          min={0}
          className={fieldClassName}
          value={value.price}
          onChange={(event) => onChange({ ...value, price: event.target.value })}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">
          Características (una por línea)
        </span>
        <textarea
          className={fieldClassName}
          rows={4}
          value={value.featuresText}
          onChange={(event) =>
            onChange({ ...value, featuresText: event.target.value })
          }
        />
      </label>

      <MediaGalleryField
        images={value.images}
        onChange={(images) => onChange({ ...value, images })}
      />

      <label className="flex items-center gap-3 text-body-sm text-foreground">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(event) =>
            onChange({ ...value, active: event.target.checked })
          }
        />
        Visible en el catálogo público
      </label>

      <button type="submit" className={buttonClassName} disabled={isSaving}>
        {isSaving ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
