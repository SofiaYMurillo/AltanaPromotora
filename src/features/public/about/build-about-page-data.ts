import { getPublicAboutTeamSection } from "@/backend/services/about-team-service";
import { resolveSectionBackground } from "@/backend/services/public-section-background-service";

import { aboutData } from "./about.data";
import type { AboutPageData } from "./about.types";
import { mapPublicAboutTeamSection } from "./map-public-about-team";

export async function buildAboutPageData(): Promise<AboutPageData> {
  const [heroBackground, equipoSection] = await Promise.all([
    resolveSectionBackground("about", "hero"),
    getPublicAboutTeamSection(),
  ]);

  return {
    ...aboutData,
    hero: {
      ...aboutData.hero,
      cmsBackground: heroBackground,
    },
    equipo: mapPublicAboutTeamSection(equipoSection),
  };
}
