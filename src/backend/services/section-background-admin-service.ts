import { sectionBackgroundDefinitions } from "@/config/section-background-definitions";
import type { SectionBackgroundConfig, StoredMediaAsset } from "@/domain/media";

import * as mediaRepository from "../repositories/media-repository";

export type SectionBackgroundAdminRow = {
  definition: (typeof sectionBackgroundDefinitions)[number];
  config: SectionBackgroundConfig | null;
  media: Pick<StoredMediaAsset, "id" | "url" | "alt" | "kind" | "originalName"> | null;
  poster: Pick<StoredMediaAsset, "id" | "url" | "alt" | "originalName"> | null;
};

function configKey(pageKey: string, sectionKey: string) {
  return `${pageKey}.${sectionKey}`;
}

export async function listSectionBackgroundAdminRows(): Promise<
  SectionBackgroundAdminRow[]
> {
  const configs = await mediaRepository.listSectionBackgrounds();
  const byKey = new Map(
    configs.map((item) => [configKey(item.pageKey, item.sectionKey), item]),
  );

  const rows: SectionBackgroundAdminRow[] = [];

  for (const definition of sectionBackgroundDefinitions) {
    const config =
      byKey.get(configKey(definition.pageKey, definition.sectionKey)) ?? null;

    let media: SectionBackgroundAdminRow["media"] = null;
    let poster: SectionBackgroundAdminRow["poster"] = null;

    if (config?.mediaAssetId) {
      const asset = await mediaRepository.getMediaAssetById(config.mediaAssetId);
      if (asset) {
        media = {
          id: asset.id,
          url: asset.url,
          alt: asset.alt,
          kind: asset.kind,
          originalName: asset.originalName,
        };
      }
    }

    if (config?.posterMediaAssetId) {
      const asset = await mediaRepository.getMediaAssetById(
        config.posterMediaAssetId,
      );
      if (asset) {
        poster = {
          id: asset.id,
          url: asset.url,
          alt: asset.alt,
          originalName: asset.originalName,
        };
      }
    }

    rows.push({ definition, config, media, poster });
  }

  return rows;
}
