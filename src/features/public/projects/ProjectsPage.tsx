"use client";

import { useMemo, useState } from "react";

import {
  initialPropertyCatalogFilters,
  PropertyFilters,
  type PropertyCatalogFilters,
} from "./components/PropertyFilters";
import { PropertyResult } from "./components/PropertyResult";
import { ProjectsEditorialHeader } from "./components/ProjectsEditorialHeader";
import type { ProjectsPageData, PropertyData } from "./projects.types";

type ProjectsPageProps = {
  data: ProjectsPageData;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasInvalidRanges(filters: PropertyCatalogFilters) {
  const invalidPrice =
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice;

  const invalidArea =
    filters.minArea !== undefined &&
    filters.maxArea !== undefined &&
    filters.minArea > filters.maxArea;

  return invalidPrice || invalidArea;
}

function filterProperties(
  properties: PropertyData[],
  filters: PropertyCatalogFilters,
) {
  const search = normalizeSearch(filters.search);

  return properties.filter((property) => {
    if (search) {
      const title = normalizeSearch(property.title);
      const city = normalizeSearch(property.city);

      if (!title.includes(search) && !city.includes(search)) {
        return false;
      }
    }

    if (filters.projectId && property.projectId !== filters.projectId) {
      return false;
    }

    if (filters.operation && property.operation !== filters.operation) {
      return false;
    }

    if (filters.type && property.type !== filters.type) {
      return false;
    }

    if (filters.city && property.city !== filters.city) {
      return false;
    }

    if (
      filters.bedrooms !== undefined &&
      property.bedrooms !== filters.bedrooms
    ) {
      return false;
    }

    if (
      filters.bathrooms !== undefined &&
      property.bathrooms !== filters.bathrooms
    ) {
      return false;
    }

    if (
      filters.minPrice !== undefined &&
      property.price < filters.minPrice
    ) {
      return false;
    }

    if (
      filters.maxPrice !== undefined &&
      property.price > filters.maxPrice
    ) {
      return false;
    }

    if (
      filters.minArea !== undefined &&
      property.area < filters.minArea
    ) {
      return false;
    }

    if (
      filters.maxArea !== undefined &&
      property.area > filters.maxArea
    ) {
      return false;
    }

    return true;
  });
}

function sortProperties(
  properties: PropertyData[],
  sort: PropertyCatalogFilters["sort"],
) {
  const sorted = [...properties];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "area-asc":
      return sorted.sort((a, b) => a.area - b.area);
    case "area-desc":
      return sorted.sort((a, b) => b.area - a.area);
    case "relevance":
    default:
      return sorted;
  }
}

function uniqueSortedNumbers(values: number[]) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function uniqueSortedStrings(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
}

function mapPropertyToResultProps(
  property: PropertyData,
  projects: ProjectsPageData["projects"],
) {
  const relatedProject = property.projectId
    ? projects.find((project) => project.id === property.projectId)
    : undefined;

  return {
    href: `/projects/${property.id}`,
    propertyId: property.id,
    title: property.title,
    images: property.images,
    operation: property.operation,
    type: property.type,
    city: property.city,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    price: property.price,
    project: relatedProject
      ? {
          id: relatedProject.id,
          title: relatedProject.title,
        }
      : undefined,
  };
}

export function ProjectsPage({ data }: ProjectsPageProps) {
  const [filters, setFilters] = useState<PropertyCatalogFilters>(
    initialPropertyCatalogFilters,
  );

  const cities = useMemo(
    () => uniqueSortedStrings(data.properties.map((property) => property.city)),
    [data.properties],
  );

  const bedroomOptions = useMemo(
    () =>
      uniqueSortedNumbers(
        data.properties.map((property) => property.bedrooms),
      ),
    [data.properties],
  );

  const bathroomOptions = useMemo(
    () =>
      uniqueSortedNumbers(
        data.properties.map((property) => property.bathrooms),
      ),
    [data.properties],
  );

  const invalidRanges = hasInvalidRanges(filters);

  const filteredProperties = useMemo(() => {
    if (invalidRanges) {
      return [];
    }

    return sortProperties(
      filterProperties(data.properties, filters),
      filters.sort,
    );
  }, [data.properties, filters, invalidRanges]);

  const resultCount = filteredProperties.length;
  const featuredProperty = filteredProperties[0];
  const remainingProperties = filteredProperties.slice(1);

  return (
    <main className="flex flex-col">
      <ProjectsEditorialHeader
        header={data.editorial.header}
        cmsBackground={data.headerCmsBackground}
      />

      <section
        id="catalogo"
        aria-labelledby="catalog-results-heading"
        className="bg-surface px-6 py-16 pb-20 md:px-10 md:py-20 md:pb-24"
      >
        <div className="container flex flex-col gap-12 md:gap-14">
          <PropertyFilters
            filters={filters}
            projects={data.projects.map((project) => ({
              id: project.id,
              title: project.title,
            }))}
            cities={cities}
            bedroomOptions={bedroomOptions}
            bathroomOptions={bathroomOptions}
            onChange={setFilters}
            onClear={() => setFilters(initialPropertyCatalogFilters)}
            panelEyebrow={data.editorial.filters.eyebrow}
            panelTitle={data.editorial.filters.title}
          />

          {invalidRanges ? (
            <p className="text-body-sm text-secondary" role="status">
              Revisa los rangos: el valor mínimo no puede ser mayor que el
              máximo.
            </p>
          ) : null}

          <p
            id="catalog-results-heading"
            className="border-t border-border/60 pt-8 text-caption uppercase tracking-[0.16em] text-secondary"
          >
            {resultCount === 1
              ? "1 inmueble encontrado"
              : `${resultCount} inmuebles encontrados`}
          </p>

          {resultCount === 0 ? (
            <div className="catalog-empty flex flex-col items-start gap-6 py-8">
              <p className="font-display text-heading-md text-foreground">
                No encontramos inmuebles con esos criterios.
              </p>
              <div className="h-px w-16 bg-accent" aria-hidden="true" />
              <p className="max-w-lg text-body-md text-secondary">
                Prueba modificando o eliminando algún filtro para ampliar la
                búsqueda.
              </p>
              <button
                type="button"
                onClick={() => setFilters(initialPropertyCatalogFilters)}
                className="link-editorial"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-12 md:gap-16">
              {featuredProperty ? (
                <PropertyResult
                  {...mapPropertyToResultProps(featuredProperty, data.projects)}
                  variant="featured"
                />
              ) : null}

              {remainingProperties.length > 0 ? (
                <ul className="grid list-none gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-14">
                  {remainingProperties.map((property) => (
                    <li key={property.id}>
                      <PropertyResult
                        {...mapPropertyToResultProps(property, data.projects)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
