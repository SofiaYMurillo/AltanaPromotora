import { revalidatePath } from "next/cache";

import type { PersistedContactSettings } from "@/domain/site-configuration";
import type { StoredMediaAsset } from "@/domain/media";
import { defaultSiteSettings } from "@/frontend/config/site-settings.data";
import type { MediaAsset } from "@/types/media";
import type { SiteSettings } from "@/types/site-settings";

import * as mediaRepository from "../repositories/media-repository";
import * as siteConfigurationRepository from "../repositories/site-configuration-repository";

function storedToPresentationMedia(asset: StoredMediaAsset): MediaAsset {
  return {
    id: asset.id,
    url: asset.url,
    alt: asset.alt,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    mimeType: asset.mimeType,
    size: asset.size,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

function mergeContactSettings(
  persisted: PersistedContactSettings,
): Pick<
  SiteSettings,
  "emails" | "phones" | "address" | "socialLinks"
> {
  return {
    emails:
      persisted.emails && persisted.emails.length > 0
        ? persisted.emails
        : defaultSiteSettings.emails,
    phones:
      persisted.phones && persisted.phones.length > 0
        ? persisted.phones
        : defaultSiteSettings.phones,
    address:
      typeof persisted.address === "string" && persisted.address.trim()
        ? persisted.address.trim()
        : defaultSiteSettings.address,
    socialLinks:
      persisted.socialLinks && persisted.socialLinks.length > 0
        ? persisted.socialLinks
        : defaultSiteSettings.socialLinks,
  };
}

export async function resolvePublicSiteSettings(): Promise<SiteSettings> {
  const config = await siteConfigurationRepository.getSiteConfiguration();
  const contact = mergeContactSettings(config.contact);

  let logo = defaultSiteSettings.logo;
  if (config.logoMediaAssetId) {
    const row = await mediaRepository.getMediaAssetById(config.logoMediaAssetId);
    if (row && row.kind === "image") {
      logo = storedToPresentationMedia(row);
    }
  }

  return {
    ...defaultSiteSettings,
    ...contact,
    logo,
  };
}

export async function getAdminSiteConfiguration() {
  const config = await siteConfigurationRepository.getSiteConfiguration();
  let logoAsset: StoredMediaAsset | null = null;
  if (config.logoMediaAssetId) {
    logoAsset = await mediaRepository.getMediaAssetById(config.logoMediaAssetId);
  }

  return {
    logoMediaAssetId: config.logoMediaAssetId,
    logoAsset,
    contact: config.contact,
    resolved: await resolvePublicSiteSettings(),
    updatedAt: config.updatedAt,
  };
}

export async function assignSiteLogo(input: {
  logoMediaAssetId: string | null;
}) {
  if (input.logoMediaAssetId) {
    const asset = await mediaRepository.getMediaAssetById(input.logoMediaAssetId);
    if (!asset || asset.kind !== "image") {
      return { ok: false as const, error: "invalid_logo" as const };
    }
  }

  await siteConfigurationRepository.upsertSiteLogo(input.logoMediaAssetId);

  try {
    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
  } catch {
    // revalidatePath requires a Next.js request context.
  }

  return { ok: true as const };
}

export async function updateSiteContact(input: PersistedContactSettings) {
  const current = await siteConfigurationRepository.getSiteConfiguration();
  const merged: PersistedContactSettings = {
    ...current.contact,
    ...input,
  };

  await siteConfigurationRepository.upsertSiteContact(merged);

  try {
    revalidatePath("/", "layout");
    revalidatePath("/contact");
  } catch {
    // revalidatePath requires a Next.js request context.
  }

  return { ok: true as const };
}

/** Primary WhatsApp / phone digits for public widgets (when present). */
export function primaryPhoneFromSettings(settings: SiteSettings) {
  const phone = settings.phones[0]?.number?.trim();
  return phone || null;
}
