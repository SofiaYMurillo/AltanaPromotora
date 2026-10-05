export type MediaKind = "image" | "video";

export type SectionBackgroundType = "none" | "image" | "video" | "solid";

export interface StoredMediaAsset {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  kind: MediaKind;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export type ResolvedSectionBackground =
  | { type: "none" }
  | { type: "solid"; token: string }
  | { type: "image"; src: string; alt: string }
  | {
      type: "video";
      src: string;
      posterSrc?: string;
      posterAlt?: string;
    };

export interface SectionBackgroundConfig {
  id: string;
  pageKey: string;
  sectionKey: string;
  backgroundType: SectionBackgroundType;
  mediaAssetId: string | null;
  posterMediaAssetId: string | null;
  backgroundToken: string | null;
  createdAt: string;
  updatedAt: string;
}
