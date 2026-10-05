import type { SiteEmail, SitePhone, SiteSocialLink } from "@/types/site-settings";

export type PersistedContactSettings = {
  emails?: SiteEmail[];
  phones?: SitePhone[];
  address?: string;
  socialLinks?: SiteSocialLink[];
};

export type SiteConfigurationRecord = {
  logoMediaAssetId: string | null;
  contact: PersistedContactSettings;
  updatedAt: string;
};
