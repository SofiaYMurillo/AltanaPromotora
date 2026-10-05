export interface HeroCta {
  label: string;
  href: string;
}

import type { ResolvedSectionBackground } from "@/domain/media";

export interface HeroData {
  headingLines: string[];
  accentText?: string;
  subheading: string;
  cta: HeroCta;
  secondaryCta?: HeroCta;
  image: {
    src: string;
    alt: string;
    objectClassName?: string;
  };
  cmsBackground?: ResolvedSectionBackground;
}
