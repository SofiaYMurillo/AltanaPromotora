import { prisma } from "../db";
import {
  toSectionBackgroundConfig,
  toStoredMediaAsset,
} from "../mappers/media-mapper";
import type {
  SectionBackgroundConfig,
  StoredMediaAsset,
} from "@/domain/media";

export async function listMediaAssets(input?: {
  kind?: "image" | "video";
  search?: string;
}): Promise<StoredMediaAsset[]> {
  const search = input?.search?.trim().toLowerCase();
  const rows = await prisma.mediaAsset.findMany({
    where: {
      kind: input?.kind,
      OR: search
        ? [
            { originalName: { contains: search } },
            { alt: { contains: search } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toStoredMediaAsset);
}

export async function getMediaAssetById(
  id: string,
): Promise<StoredMediaAsset | null> {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  return row ? toStoredMediaAsset(row) : null;
}

export async function createMediaAsset(
  data: Omit<StoredMediaAsset, "createdAt" | "updatedAt">,
): Promise<StoredMediaAsset> {
  const now = new Date();
  const row = await prisma.mediaAsset.create({
    data: {
      ...data,
      createdAt: now,
      updatedAt: now,
    },
  });
  return toStoredMediaAsset(row);
}

export async function updateMediaAssetAlt(id: string, alt: string) {
  const row = await prisma.mediaAsset.update({
    where: { id },
    data: { alt, updatedAt: new Date() },
  });
  return toStoredMediaAsset(row);
}

export async function deleteMediaAssetById(id: string) {
  await prisma.mediaAsset.delete({ where: { id } });
}

export async function countMediaAssetUsage(id: string) {
  return prisma.sectionBackground.count({
    where: {
      OR: [{ mediaAssetId: id }, { posterMediaAssetId: id }],
    },
  });
}

export async function listSectionBackgrounds(): Promise<
  SectionBackgroundConfig[]
> {
  const rows = await prisma.sectionBackground.findMany({
    orderBy: [{ pageKey: "asc" }, { sectionKey: "asc" }],
  });
  return rows.map(toSectionBackgroundConfig);
}

export async function getSectionBackground(
  pageKey: string,
  sectionKey: string,
): Promise<SectionBackgroundConfig | null> {
  const row = await prisma.sectionBackground.findUnique({
    where: { pageKey_sectionKey: { pageKey, sectionKey } },
  });
  return row ? toSectionBackgroundConfig(row) : null;
}

export async function upsertSectionBackground(input: {
  id: string;
  pageKey: string;
  sectionKey: string;
  backgroundType: SectionBackgroundConfig["backgroundType"];
  mediaAssetId: string | null;
  posterMediaAssetId: string | null;
  backgroundToken: string | null;
}): Promise<SectionBackgroundConfig> {
  const now = new Date();
  const row = await prisma.sectionBackground.upsert({
    where: {
      pageKey_sectionKey: {
        pageKey: input.pageKey,
        sectionKey: input.sectionKey,
      },
    },
    create: {
      ...input,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      backgroundType: input.backgroundType,
      mediaAssetId: input.mediaAssetId,
      posterMediaAssetId: input.posterMediaAssetId,
      backgroundToken: input.backgroundToken,
      updatedAt: now,
    },
  });
  return toSectionBackgroundConfig(row);
}
