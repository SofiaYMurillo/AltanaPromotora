import { aboutUsData } from "@/frontend/components/sections/about-us/aboutUs.data";
import { faqData } from "@/frontend/components/sections/faq/faq.data";
import { heroData } from "@/frontend/components/sections/hero/hero.data";
import { publicPaths } from "@/frontend/config/site";

import type { HomePageData } from "./home.types";

export const FEATURED_PROPERTY_IDS = [
  "property-001",
  "property-004",
  "property-007",
] as const;

export const homeData: HomePageData = {
  hero: heroData,
  aboutUs: aboutUsData,
  featuredProjects: {
    eyebrow: "Portafolio",
    title: "Proyecto Destacado: Terraza Colibrí",
    description: "Una obra maestra de ingeniería y lujo sin precedentes.",
    primaryCta: {
      label: "Explorar proyectos",
      href: publicPaths.projects,
    },
  },
  faq: faqData,
};
