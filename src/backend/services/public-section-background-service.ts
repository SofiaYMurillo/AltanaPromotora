import type {
  ResolvedSectionBackground,
  SectionBackgroundType,
} from "@/domain/media";

import * as mediaRepository from "../repositories/media-repository";

export type { ResolvedSectionBackground };

export async function resolveSectionBackground(
  pageKey: string,
  sectionKey: string,
): Promise<ResolvedSectionBackground> {
  const config = await mediaRepository.getSectionBackground(
    pageKey,
    sectionKey,
  );

  if (!config || config.backgroundType === "none") {
    return { type: "none" };
  }

  if (config.backgroundType === "solid") {
    if (!config.backgroundToken) {
      return { type: "none" };
    }
    return { type: "solid", token: config.backgroundToken };
  }

  if (!config.mediaAssetId) {
    return { type: "none" };
  }

  const media = await mediaRepository.getMediaAssetById(config.mediaAssetId);
  if (!media) {
    return { type: "none" };
  }

  if (config.backgroundType === "image") {
    if (media.kind !== "image") {
      return { type: "none" };
    }
    return { type: "image", src: media.url, alt: media.alt || media.originalName };
  }

  if (config.backgroundType === "video") {
    if (media.kind !== "video") {
      return { type: "none" };
    }
    let posterSrc: string | undefined;
    let posterAlt: string | undefined;
    if (config.posterMediaAssetId) {
      const poster = await mediaRepository.getMediaAssetById(
        config.posterMediaAssetId,
      );
      if (poster?.kind === "image") {
        posterSrc = poster.url;
        posterAlt = poster.alt || poster.originalName;
      }
    }
    return {
      type: "video",
      src: media.url,
      posterSrc,
      posterAlt,
    };
  }

  return { type: "none" };
}

export function isSectionBackgroundType(
  value: string,
): value is SectionBackgroundType {
  return (
    value === "none" ||
    value === "image" ||
    value === "video" ||
    value === "solid"
  );
}
