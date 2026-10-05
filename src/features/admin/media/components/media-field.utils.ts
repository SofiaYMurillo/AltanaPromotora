import type { CatalogImage } from "@/domain";

import type { AdminMediaAsset } from "../media-api.client";

export function mediaAssetToCatalogImage(asset: AdminMediaAsset): CatalogImage {
  return {
    src: asset.url,
    alt: asset.alt || asset.originalName,
  };
}

export function catalogImageLabel(image: CatalogImage) {
  if (!image.src) {
    return "Sin recurso";
  }
  const parts = image.src.split("/");
  return parts[parts.length - 1] || image.src;
}

export function isImageSrc(value: string) {
  return Boolean(value.trim());
}
