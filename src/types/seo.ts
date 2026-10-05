import type { MediaAsset } from "./media";

export interface SeoOpenGraph {
  title?: string;
  description?: string;
  image?: MediaAsset;
}

export interface SeoMetadata {
  title: string;
  description: string;
  openGraph?: SeoOpenGraph;
  isIndexable: boolean;
  canonicalUrl?: string;
}
