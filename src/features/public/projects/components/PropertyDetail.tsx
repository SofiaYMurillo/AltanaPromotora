import { AppointmentBooking } from "@/frontend/features/appointments/AppointmentBooking";

import type { OfficeLocation } from "../projects.types";
import { PropertyGallery } from "./PropertyGallery";

type PropertyDetailProps = {
  title: string;
  images: {
    src: string;
    alt: string;
  }[];
  operation: "sale" | "rent";
  type: "house" | "apartment";
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parkingSpaces: number;
  price: number;
  features: string[];
  project?: {
    id: string;
    title: string;
  };
  booking: {
    propertyId: string;
    propertyTitle: string;
    propertyCity: string;
    offices: OfficeLocation[];
  };
};

const operationLabels = {
  sale: "Venta",
  rent: "Arriendo",
} as const;

const typeLabels = {
  house: "Casa",
  apartment: "Apartamento",
} as const;

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function PropertyDetail({
  title,
  images,
  operation,
  type,
  city,
  bedrooms,
  bathrooms,
  area,
  parkingSpaces,
  price,
  features,
  project,
  booking,
}: PropertyDetailProps) {
  return (
    <article className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-14 xl:gap-16">
      <div className="lg:col-span-7">
        <PropertyGallery images={images} title={title} />
      </div>

      <aside className="flex flex-col gap-8 lg:col-span-5 lg:gap-10">
        <section aria-label="Información del inmueble">
          <p className="text-caption uppercase tracking-[0.16em] text-accent">
            {operationLabels[operation]} · {typeLabels[type]}
          </p>
          <p className="mt-3 text-body-md text-secondary">{city}</p>

          <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <dt className="field-label">Habitaciones</dt>
              <dd className="mt-1 text-body-md text-foreground tabular-nums">
                {bedrooms}
              </dd>
            </div>
            <div>
              <dt className="field-label">Baños</dt>
              <dd className="mt-1 text-body-md text-foreground tabular-nums">
                {bathrooms}
              </dd>
            </div>
            <div>
              <dt className="field-label">Área</dt>
              <dd className="mt-1 text-body-md text-foreground tabular-nums">
                {area} m²
              </dd>
            </div>
            <div>
              <dt className="field-label">Parqueaderos</dt>
              <dd className="mt-1 text-body-md text-foreground tabular-nums">
                {parkingSpaces}
              </dd>
            </div>
          </dl>

          <div className="accent-rule-sm" aria-hidden="true" />

          <p className="mt-6 text-heading-lg text-foreground tabular-nums">
            {formatPrice(price)}
          </p>
        </section>

        {features.length > 0 ? (
          <section aria-labelledby="property-features-heading">
            <h2
              id="property-features-heading"
              className="text-heading-sm text-foreground"
            >
              Características
            </h2>
            <ul className="mt-4 flex flex-col gap-2 border-l border-border pl-4">
              {features.map((feature) => (
                <li key={feature} className="text-body-md text-secondary">
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {project ? (
          <section
            aria-labelledby="property-project-heading"
            className="border-t border-border pt-6"
          >
            <h2
              id="property-project-heading"
              className="field-label"
            >
              Proyecto
            </h2>
            <p className="mt-2 text-heading-sm text-foreground">
              {project.title}
            </p>
          </section>
        ) : null}

        <div className="catalog-panel">
          <AppointmentBooking
            propertyId={booking.propertyId}
            propertyTitle={booking.propertyTitle}
            propertyCity={booking.propertyCity}
            offices={booking.offices}
          />
        </div>
      </aside>
    </article>
  );
}
