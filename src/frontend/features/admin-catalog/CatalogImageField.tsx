import Image from "next/image";

import type { CatalogImage } from "@/domain";

type CatalogImageFieldProps = {
  label: string;
  value: CatalogImage;
  onChange: (value: CatalogImage) => void;
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function CatalogImageField({
  label,
  value,
  onChange,
}: CatalogImageFieldProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-body-sm text-muted">{label}</legend>
      {value.src.startsWith("/images/") ? (
        <Image
          src={value.src}
          alt={value.alt || "Referencia de imagen"}
          width={480}
          height={192}
          className="h-28 w-full rounded-md object-cover"
        />
      ) : null}
      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Ruta local</span>
        <input
          className={fieldClassName}
          value={value.src}
          onChange={(event) => onChange({ ...value, src: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-muted">Texto alternativo</span>
        <input
          className={fieldClassName}
          value={value.alt}
          onChange={(event) => onChange({ ...value, alt: event.target.value })}
        />
      </label>
    </fieldset>
  );
}
