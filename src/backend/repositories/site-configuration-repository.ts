import { prisma } from "../db";

import type { PersistedContactSettings } from "@/domain/site-configuration";

const SINGLETON_ID = "default";

function parseContactJson(raw: string): PersistedContactSettings {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as PersistedContactSettings;
  } catch {
    return {};
  }
}

export async function getSiteConfiguration() {
  const row = await prisma.siteConfiguration.findUnique({
    where: { id: SINGLETON_ID },
  });

  if (!row) {
    return {
      logoMediaAssetId: null as string | null,
      contact: {} as PersistedContactSettings,
      updatedAt: null as string | null,
    };
  }

  return {
    logoMediaAssetId: row.logoMediaAssetId,
    contact: parseContactJson(row.contactJson),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function upsertSiteLogo(logoMediaAssetId: string | null) {
  const now = new Date();
  const row = await prisma.siteConfiguration.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      logoMediaAssetId,
      contactJson: "{}",
      createdAt: now,
      updatedAt: now,
    },
    update: {
      logoMediaAssetId,
      updatedAt: now,
    },
  });

  return {
    logoMediaAssetId: row.logoMediaAssetId,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function upsertSiteContact(contact: PersistedContactSettings) {
  const now = new Date();
  const existing = await prisma.siteConfiguration.findUnique({
    where: { id: SINGLETON_ID },
  });

  const row = await prisma.siteConfiguration.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      logoMediaAssetId: null,
      contactJson: JSON.stringify(contact),
      createdAt: now,
      updatedAt: now,
    },
    update: {
      contactJson: JSON.stringify(contact),
      updatedAt: now,
    },
  });

  return {
    logoMediaAssetId: row.logoMediaAssetId ?? existing?.logoMediaAssetId ?? null,
    contact: parseContactJson(row.contactJson),
    updatedAt: row.updatedAt.toISOString(),
  };
}
