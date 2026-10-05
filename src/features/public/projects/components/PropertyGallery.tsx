"use client";

import { useCallback, useState, type KeyboardEvent } from "react";

import { CoverImage } from "@/frontend/components/common/CoverImage";

type GalleryImage = {
  src: string;
  alt: string;
};

type PropertyGalleryProps = {
  images: GalleryImage[];
  title: string;
};

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasMultipleImages = images.length > 1;

  const selectImage = useCallback(
    (index: number) => {
      if (index < 0 || index >= images.length) {
        return;
      }

      setSelectedIndex(index);
    },
    [images.length],
  );

  const handleMainKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!hasMultipleImages) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        selectImage(Math.min(images.length - 1, selectedIndex + 1));
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectImage(Math.max(0, selectedIndex - 1));
      }
    },
    [hasMultipleImages, images.length, selectImage, selectedIndex],
  );

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-[4/3] items-center justify-center rounded-md border border-border bg-surface"
        role="img"
        aria-label={`${title} — imagen no disponible`}
      >
        <p className="text-body-sm text-secondary">Imagen no disponible</p>
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <figure
        className="relative aspect-[4/3] overflow-hidden rounded-md md:aspect-[5/4] lg:aspect-[4/3]"
        tabIndex={hasMultipleImages ? 0 : undefined}
        onKeyDown={handleMainKeyDown}
        aria-label={
          hasMultipleImages
            ? `Imagen ${selectedIndex + 1} de ${images.length}`
            : undefined
        }
      >
        <CoverImage
          src={selectedImage.src}
          alt={selectedImage.alt}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 50vw"
          preload
          className="object-cover"
        />
      </figure>

      {hasMultipleImages ? (
        <ul
          className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-5"
          aria-label="Miniaturas de la galería"
        >
          {images.map((image, index) => {
            const isSelected = index === selectedIndex;

            return (
              <li key={`${image.src}-${index}`}>
                <button
                  type="button"
                  onClick={() => selectImage(index)}
                  aria-label={`Ver imagen ${index + 1}: ${image.alt}`}
                  aria-pressed={isSelected}
                  className={`relative aspect-square w-full overflow-hidden rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isSelected
                      ? "border-accent"
                      : "border-border hover:border-accent"
                  }`}
                >
                  <CoverImage
                    src={image.src}
                    alt=""
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
