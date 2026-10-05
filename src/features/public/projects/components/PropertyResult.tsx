import Link from "next/link";

import { CoverImage } from "@/frontend/components/common/CoverImage";
import { propertyBookingHref } from "@/frontend/config/site";

type PropertyResultProps = {
  href: string;
  propertyId: string;
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
  price: number;
  project?: {
    id: string;
    title: string;
  };
  variant?: "default" | "featured";
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

function PropertyResultContent({
  href,
  propertyId,
  title,
  operation,
  type,
  city,
  bedrooms,
  bathrooms,
  area,
  price,
  project,
  featured = false,
}: Omit<PropertyResultProps, "images" | "variant"> & { featured?: boolean }) {
  const bookingHref = propertyBookingHref(propertyId);
  return (
    <div className={`flex flex-1 flex-col ${featured ? "justify-center" : "pt-5 md:pt-6"}`}>
      <p className="text-caption uppercase tracking-[0.16em] text-accent">
        {operationLabels[operation]} · {typeLabels[type]}
      </p>

      <h3
        className={`mt-3 text-foreground ${featured ? "font-display text-heading-lg md:text-heading-xl" : "text-heading-sm"}`}
      >
        <Link
          href={href}
          className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {title}
        </Link>
      </h3>

      <p className="mt-3 text-body-sm text-secondary">{city}</p>

      <p className="mt-4 text-body-sm text-muted">
        {bedrooms} hab · {bathrooms} baños · {area} m²
      </p>

      <p
        className={`mt-4 tabular-nums text-foreground ${featured ? "text-heading-sm md:text-heading-md" : "text-body-md md:mt-4"}`}
      >
        {formatPrice(price)}
      </p>

      {project ? (
        <p className="mt-3 text-body-sm text-secondary">
          Proyecto · {project.title}
        </p>
      ) : null}

      <div className="accent-rule-sm mt-6" aria-hidden="true" />

      <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <Link href={href} className="link-editorial">
          Ver inmueble →
        </Link>
        <Link href={bookingHref} className="btn-primary">
          Agendar visita
        </Link>
      </div>
    </div>
  );
}

export function PropertyResult({
  href,
  propertyId,
  title,
  images,
  operation,
  type,
  city,
  bedrooms,
  bathrooms,
  area,
  price,
  project,
  variant = "default",
}: PropertyResultProps) {
  const primaryImage = images[0];
  const featured = variant === "featured";

  if (featured) {
    return (
      <article className="group grid gap-8 border-b border-border/70 pb-12 lg:grid-cols-12 lg:items-stretch lg:gap-12">
        {primaryImage ? (
          <div className="relative aspect-[4/3] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[22rem]">
            <CoverImage
              src={primaryImage.src}
              alt={primaryImage.alt}
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        ) : null}
        <div className="lg:col-span-5">
          <PropertyResultContent
            href={href}
            propertyId={propertyId}
            title={title}
            operation={operation}
            type={type}
            city={city}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            area={area}
            price={price}
            project={project}
            featured
          />
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col">
      {primaryImage ? (
        <div className="relative aspect-[5/4] overflow-hidden md:aspect-[4/3]">
          <CoverImage
            src={primaryImage.src}
            alt={primaryImage.alt}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      <PropertyResultContent
        href={href}
        propertyId={propertyId}
        title={title}
        operation={operation}
        type={type}
        city={city}
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        area={area}
        price={price}
        project={project}
      />
    </article>
  );
}
