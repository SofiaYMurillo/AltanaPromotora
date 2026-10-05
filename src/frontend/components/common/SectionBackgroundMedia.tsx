import { CoverImage } from "@/frontend/components/common/CoverImage";
import { sectionBackgroundSurfaceClass } from "@/frontend/config/section-background-display";
import type { ResolvedSectionBackground } from "@/domain/media";

type SectionBackgroundMediaProps = {
  background: ResolvedSectionBackground;
  fallbackImage?: { src: string; alt: string; objectClassName?: string };
  sizes?: string;
};

export function SectionBackgroundMedia({
  background,
  fallbackImage,
  sizes = "100vw",
}: SectionBackgroundMediaProps) {
  if (background.type === "solid") {
    return (
      <div
        className={`absolute inset-0 ${sectionBackgroundSurfaceClass(background.token)}`}
        aria-hidden="true"
      />
    );
  }

  if (background.type === "video") {
    return (
      <>
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={background.posterSrc}
          aria-hidden="true"
        >
          <source src={background.src} />
        </video>
        {background.posterSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={background.posterSrc}
            alt={background.posterAlt ?? ""}
            className="sr-only"
          />
        ) : null}
      </>
    );
  }

  if (background.type === "image") {
    return (
      <CoverImage
        src={background.src}
        alt={background.alt}
        sizes={sizes}
        preload
        className={fallbackImage?.objectClassName ?? "object-center"}
      />
    );
  }

  if (fallbackImage) {
    return (
      <CoverImage
        src={fallbackImage.src}
        alt={fallbackImage.alt}
        sizes={sizes}
        preload
        className={fallbackImage.objectClassName ?? "object-center"}
      />
    );
  }

  return null;
}
