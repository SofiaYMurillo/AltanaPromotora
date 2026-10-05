import Image from "next/image";

import type { CatalogImage } from "@/domain";

type CatalogImageListFieldProps = {
  images: CatalogImage[];
  onChange: (images: CatalogImage[]) => void;
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const buttonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

export function CatalogImageListField({
  images,
  onChange,
}: CatalogImageListFieldProps) {
  function updateAt(index: number, patch: Partial<CatalogImage>) {
    onChange(
      images.map((image, current) =>
        current === index ? { ...image, ...patch } : image,
      ),
    );
  }

  function move(index: number, offset: number) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= images.length) {
      return;
    }
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-body-sm text-muted">
        Imágenes (rutas locales en /images/)
      </legend>
      {images.length === 0 ? (
        <p className="text-body-sm text-muted">Sin imágenes referenciadas.</p>
      ) : null}
      <ul className="flex flex-col gap-4">
        {images.map((image, index) => (
          <li
            key={`${image.src}-${index}`}
            className="flex flex-col gap-3 rounded-md border border-border p-4"
          >
            {image.src.startsWith("/images/") ? (
              <Image
                src={image.src}
                alt={image.alt || "Referencia de imagen"}
                width={480}
                height={192}
                className="h-28 w-full rounded-md object-cover"
              />
            ) : null}
            <label className="flex flex-col gap-2">
              <span className="text-body-sm text-muted">Ruta</span>
              <input
                className={fieldClassName}
                value={image.src}
                onChange={(event) => updateAt(index, { src: event.target.value })}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-body-sm text-muted">Texto alternativo</span>
              <input
                className={fieldClassName}
                value={image.alt}
                onChange={(event) => updateAt(index, { alt: event.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClassName}
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                Subir
              </button>
              <button
                type="button"
                className={buttonClassName}
                onClick={() => move(index, 1)}
                disabled={index === images.length - 1}
              >
                Bajar
              </button>
              <button
                type="button"
                className={buttonClassName}
                onClick={() => onChange(images.filter((_, current) => current !== index))}
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={buttonClassName}
        onClick={() =>
          onChange([...images, { src: "/images/projects-placeholder.jpg", alt: "" }])
        }
      >
        Agregar referencia
      </button>
    </fieldset>
  );
}
