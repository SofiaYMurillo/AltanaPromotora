export interface FeaturedProjectCardData {
  id: string;
  title: string;
  location: string;
  priceLabel: string;
  href: string;
  image: {
    src: string;
    alt: string;
  };
}

export interface FeaturedProjectsLink {
  label: string;
  href: string;
}

export interface FeaturedProjectsData {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: FeaturedProjectsLink;
  /** Reserved for catalog integrations; not rendered on the ALTANA home reference. */
  items?: FeaturedProjectCardData[];
}
