import type { HeaderCta, NavItem } from "@/types/navigation";
import type { SiteConfig } from "@/types/site";

export const siteConfig: SiteConfig = {
  name: "ALTANA PROMOTORA",
  description: "Promotora inmobiliaria de alto nivel.",
  locale: "es",
};

export const publicPaths = {
  home: "/",
  projects: "/projects",
  about: "/about",
  contact: "/contact",
  appointments: "/appointments",
} as const;

/** Public routes where the header sits over a dark hero. */
export const overlayHeaderPaths: readonly string[] = [
  publicPaths.home,
  publicPaths.about,
];

export const mainNavigation: NavItem[] = [
  { label: "Inicio", href: publicPaths.home },
  { label: "Proyectos", href: publicPaths.projects },
  { label: "Sobre Nosotros", href: publicPaths.about },
  { label: "Contacto", href: publicPaths.contact },
];

export const headerCta: HeaderCta = {
  label: "Agendar visita",
  href: publicPaths.appointments,
};

const propertyDetailPathPattern = /^\/projects\/[^/]+$/;

export const propertyBookingHash = "#agendar-visita" as const;

/**
 * Header quick action "Agendar visita".
 * Default: general entry `/appointments` (not the catalog).
 * Property detail: in-page booking anchor only.
 */
export function resolveHeaderCtaForPath(
  pathname: string,
  defaultCta: HeaderCta = headerCta,
): HeaderCta {
  if (propertyDetailPathPattern.test(pathname)) {
    return {
      label: defaultCta.label,
      href: `${pathname}${propertyBookingHash}`,
    };
  }

  return {
    label: defaultCta.label,
    href: publicPaths.appointments,
  };
}

export function propertyBookingHref(propertyId: string) {
  return `${publicPaths.projects}/${propertyId}${propertyBookingHash}`;
}
