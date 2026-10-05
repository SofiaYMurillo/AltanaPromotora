import type { ResolvedSectionBackground } from "@/domain/media";

import type { TeamSectionData } from "./team.types";

export type { TeamMember, TeamSectionData } from "./team.types";

export type AboutHeroData = {
  title: string;
  subtitle: string;
  architecturalImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  cmsBackground?: ResolvedSectionBackground;
};

export type AboutHistoriaData = {
  eyebrow: string;
  title: string;
  paragraphs: readonly [string, string];
  cta: {
    label: string;
    href: string;
  };
  image: {
    src: string;
    alt: string;
  };
};

export type AboutConfianzaData = {
  title: string;
  quote: string;
};

export type AboutValueItem = {
  id: string;
  title: string;
  description: string;
  icon: "transparency" | "commitment" | "responsibility";
};

export type AboutValoresData = {
  eyebrow: string;
  title: string;
  items: readonly AboutValueItem[];
};

export type AboutFinalCtaData = {
  title: string;
  description: string;
  cta: {
    label: string;
    href: string;
  };
};

export interface AboutPageData {
  hero: AboutHeroData;
  historia: AboutHistoriaData;
  confianza: AboutConfianzaData;
  valores: AboutValoresData;
  equipo: TeamSectionData;
  finalCta: AboutFinalCtaData;
}
