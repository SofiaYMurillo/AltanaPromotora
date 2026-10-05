import type { MediaAsset } from "@/types/media";
import type { Publishable } from "@/types/publishable";

export interface GalleryItem extends Publishable {
  id: string;
  media: MediaAsset;
  caption?: string;
}

export interface GalleryData extends Partial<Pick<Publishable, "isPublished">> {
  title: string;
  description?: string;
  items: GalleryItem[];
}
