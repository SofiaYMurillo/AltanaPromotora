import type { MediaAsset } from "./media";

export interface SiteEmail {
  id: string;
  label: string;
  address: string;
  sortOrder: number;
}

export interface SitePhone {
  id: string;
  label: string;
  number: string;
  sortOrder: number;
}

export interface SiteSocialLink {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
}

export interface SiteSettings {
  companyName: string;
  legalName: string;
  tagline?: string;
  locale: string;
  logo: MediaAsset;
  favicon: MediaAsset;
  emails: SiteEmail[];
  phones: SitePhone[];
  address: string;
  businessHours?: string;
  socialLinks: SiteSocialLink[];
  copyright: string;
}
