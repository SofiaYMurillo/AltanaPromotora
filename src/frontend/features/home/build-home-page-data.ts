import { resolveSectionBackground } from "@/backend/services/public-section-background-service";
import { homeData } from "./home.data";
import type { HomePageData } from "./home.types";

export async function buildHomePageData(): Promise<HomePageData> {
  const heroBackground = await resolveSectionBackground("home", "hero");

  return {
    ...homeData,
    hero: {
      ...homeData.hero,
      cmsBackground: heroBackground,
    },
  };
}
