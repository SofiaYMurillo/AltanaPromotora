import { publicPaths } from "@/frontend/config/site";
import type { FeaturedProjectCardData } from "@/frontend/components/sections/projects";
import type { PropertyData } from "@/features/public/projects/projects.types";

const CATALOG_PLACEHOLDER = "/images/projects-placeholder.jpg";
const FEATURED_IMAGE_FALLBACK = "/images/home/featured.svg";

export function formatStartingPrice(amount: number) {
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);

  return `Desde ${formatted}`;
}

export function toFeaturedProjectCards(
  properties: PropertyData[],
  featuredIds: readonly string[],
): FeaturedProjectCardData[] {
  const byId = new Map(properties.map((property) => [property.id, property]));

  return featuredIds.flatMap((id) => {
    const property = byId.get(id);
    if (!property) {
      return [];
    }

    const image = property.images[0];
    const src =
      !image?.src || image.src === CATALOG_PLACEHOLDER
        ? FEATURED_IMAGE_FALLBACK
        : image.src;

    return [
      {
        id: property.id,
        title: property.title,
        location: property.city,
        priceLabel: formatStartingPrice(property.price),
        href: `${publicPaths.projects}/${property.id}`,
        image: {
          src,
          alt: image?.alt ?? property.title,
        },
      },
    ];
  });
}
