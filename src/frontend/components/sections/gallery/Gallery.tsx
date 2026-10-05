import type { GalleryData } from "./gallery.types";

type GalleryProps = {
  data: GalleryData;
};

export function Gallery({ data }: GalleryProps) {
  return <section aria-label="Gallery" data-ready={Boolean(data)} />;
}
