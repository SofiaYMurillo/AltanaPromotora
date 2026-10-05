import type { ResolvedSectionBackground } from "@/domain/media";

export type ContactPageData = {
  hero: {
    eyebrow: string;
    titleLines: readonly [string, string, string];
    description: string;
    cmsBackground?: ResolvedSectionBackground;
  };
  bridge: {
    eyebrow: string;
    text: string;
  };
  talk: {
    title: string;
    lead: string;
  };
  directContact: {
    title: string;
  };
};

export type ContactDirectInfo = {
  phones: readonly string[];
  emails: readonly string[];
  address: string;
};
