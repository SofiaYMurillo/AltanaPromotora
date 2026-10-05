import { resolveSectionBackground } from "@/backend/services/public-section-background-service";

import { contactPageData } from "./contact.data";
import type { ContactPageData } from "./contact.types";

export async function buildContactPageData(): Promise<ContactPageData> {
  const heroBackground = await resolveSectionBackground("contact", "hero");

  return {
    ...contactPageData,
    hero: {
      ...contactPageData.hero,
      cmsBackground: heroBackground,
    },
  };
}
