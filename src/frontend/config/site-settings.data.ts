import type { MediaAsset } from "@/types/media";
import type { SiteSettings } from "@/types/site-settings";

const placeholderMedia: MediaAsset = {
  id: "media-placeholder",
  url: "",
  alt: "",
  width: 0,
  height: 0,
  mimeType: "image/png",
  size: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/** Static defaults — merged with persisted CMS overrides at runtime. */
export const defaultSiteSettings: SiteSettings = {
  companyName: "ALTANA PROMOTORA",
  legalName: "ALTANA PROMOTORA",
  locale: "es",
  logo: placeholderMedia,
  favicon: placeholderMedia,
  emails: [
    {
      id: "email-main",
      address: "Altanapromotorasas@gmail.com",
      label: "Correo",
      sortOrder: 0,
    },
  ],
  phones: [
    {
      id: "phone-main",
      number: "+57 300 3252704",
      label: "Teléfono",
      sortOrder: 0,
    },
  ],
  address: "Cra. 10 #5-60, La Tebaida, Quindío",
  socialLinks: [
    {
      id: "social-instagram",
      platform: "Instagram",
      url: "https://www.instagram.com/altana.promotora/",
      sortOrder: 0,
    },
  ],
  copyright: "© ALTANA PROMOTORA",
};

/** @deprecated Prefer resolvePublicSiteSettings() for public/admin runtime. */
export const siteSettings = defaultSiteSettings;
