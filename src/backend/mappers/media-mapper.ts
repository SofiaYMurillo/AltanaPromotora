import type { MediaAsset as PrismaMediaAsset } from "../../generated/prisma/client";
import type { SectionBackground as PrismaSectionBackground } from "../../generated/prisma/client";
import type {
  SectionBackgroundConfig,
  StoredMediaAsset,
} from "@/domain/media";

export function toStoredMediaAsset(row: PrismaMediaAsset): StoredMediaAsset {
  return {
    id: row.id,
    fileName: row.fileName,
    originalName: row.originalName,
    mimeType: row.mimeType,
    kind: row.kind as StoredMediaAsset["kind"],
    url: row.url,
    alt: row.alt,
    width: row.width,
    height: row.height,
    size: row.size,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSectionBackgroundConfig(
  row: PrismaSectionBackground,
): SectionBackgroundConfig {
  return {
    id: row.id,
    pageKey: row.pageKey,
    sectionKey: row.sectionKey,
    backgroundType: row.backgroundType as SectionBackgroundConfig["backgroundType"],
    mediaAssetId: row.mediaAssetId,
    posterMediaAssetId: row.posterMediaAssetId,
    backgroundToken: row.backgroundToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
