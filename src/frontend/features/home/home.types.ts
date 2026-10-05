import type { AboutUsData } from "@/frontend/components/sections/about-us";
import type { HeroData } from "@/frontend/components/sections/hero";
import type { FeaturedProjectsData } from "@/frontend/components/sections/projects";
import type { FaqData } from "@/frontend/components/sections/faq";

export type HomePageData = {
  hero: HeroData;
  aboutUs: AboutUsData;
  featuredProjects: FeaturedProjectsData;
  faq: FaqData;
};
