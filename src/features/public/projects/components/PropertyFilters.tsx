import type {
  PropertyOperation,
  PropertyType,
} from "../projects.types";

export type PropertyCatalogSort =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "area-asc"
  | "area-desc";

export type PropertyCatalogFilters = {
  search: string;
  projectId?: string;
  operation?: PropertyOperation;
  type?: PropertyType;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  sort: PropertyCatalogSort;
};

export const initialPropertyCatalogFilters: PropertyCatalogFilters = {
  search: "",
  sort: "relevance",
};

type ProjectFilterOption = {
  id: string;
  title: string;
};

type PropertyFiltersProps = {
  filters: PropertyCatalogFilters;
  projects: ProjectFilterOption[];
  cities: string[];
  bedroomOptions: number[];
  bathroomOptions: number[];
  onChange: (filters: PropertyCatalogFilters) => void;
  onClear: () => void;
  panelEyebrow?: string;
  panelTitle?: string;
};

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function PropertyFilters({
  filters,
  projects,
  cities,
  bedroomOptions,
  bathroomOptions,
  onChange,
  onClear,
  panelEyebrow = "Filtros",
  panelTitle = "Buscar inmuebles",
}: PropertyFiltersProps) {
  return (
    <section
      aria-labelledby="property-filters-heading"
      className="catalog-editorial-panel flex flex-col gap-8 md:gap-10"
    >
      <header className="flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-eyebrow">{panelEyebrow}</p>
          <h2
            id="property-filters-heading"
            className="mt-4 font-display text-heading-md text-foreground md:text-heading-lg"
          >
            {panelTitle}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="link-editorial shrink-0 self-start md:self-auto"
        >
          Limpiar filtros
        </button>
      </header>

      <label className="flex flex-col gap-2">
        <span className="field-label">Búsqueda</span>
        <input
          type="search"
          className="field-control"
          value={filters.search}
          placeholder="Ejemplo: Apartamento, Pereira"
          onChange={(event) =>
            onChange({
              ...filters,
              search: event.target.value,
            })
          }
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
          <span className="field-label">Proyecto</span>
          <select
            className="field-control"
            value={filters.projectId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                projectId: event.target.value || undefined,
              })
            }
          >
            <option value="">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Operación</span>
          <select
            className="field-control"
            value={filters.operation ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                operation: (event.target.value || undefined) as
                  | PropertyOperation
                  | undefined,
              })
            }
          >
            <option value="">Todas</option>
            <option value="sale">Venta</option>
            <option value="rent">Arriendo</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Tipo</span>
          <select
            className="field-control"
            value={filters.type ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                type: (event.target.value || undefined) as
                  | PropertyType
                  | undefined,
              })
            }
          >
            <option value="">Todos</option>
            <option value="house">Casa</option>
            <option value="apartment">Apartamento</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Ciudad</span>
          <select
            className="field-control"
            value={filters.city ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                city: event.target.value || undefined,
              })
            }
          >
            <option value="">Todas</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Habitaciones</span>
          <select
            className="field-control"
            value={filters.bedrooms?.toString() ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                bedrooms: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          >
            <option value="">Cualquiera</option>
            {bedroomOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Baños</span>
          <select
            className="field-control"
            value={filters.bathrooms?.toString() ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                bathrooms: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          >
            <option value="">Cualquiera</option>
            {bathroomOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

      </div>

      <div className="grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-2 lg:col-span-1">
          <span className="field-label">Ordenar por</span>
          <select
            className="field-control"
            value={filters.sort}
            onChange={(event) =>
              onChange({
                ...filters,
                sort: event.target.value as PropertyCatalogSort,
              })
            }
          >
            <option value="relevance">Relevancia</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="area-asc">Menor área</option>
            <option value="area-desc">Mayor área</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Precio mínimo (COP)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="field-control"
            value={filters.minPrice?.toString() ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                minPrice: parseOptionalNumber(event.target.value),
              })
            }
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Precio máximo (COP)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="field-control"
            value={filters.maxPrice?.toString() ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                maxPrice: parseOptionalNumber(event.target.value),
              })
            }
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Área mínima (m²)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="field-control"
            value={filters.minArea?.toString() ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                minArea: parseOptionalNumber(event.target.value),
              })
            }
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="field-label">Área máxima (m²)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="field-control"
            value={filters.maxArea?.toString() ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                maxArea: parseOptionalNumber(event.target.value),
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
