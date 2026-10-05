"use client";

import { useId, useState } from "react";

import type { CatalogImage } from "@/domain";

import {
  uploadMediaAssetRequest,
  type AdminMediaAsset,
} from "../media-api.client";
import {
  catalogImageLabel,
  mediaAssetToCatalogImage,
} from "./media-field.utils";
import { MediaPicker } from "./MediaPicker";

type MediaGalleryFieldProps = {
  label?: string;
  images: CatalogImage[];
  onChange: (images: CatalogImage[]) => void;
};

function uploadErrorMessage(error: string) {
  switch (error) {
    case "file_too_large":
      return "Archivo demasiado grande";
    case "file_type_not_allowed":
      return "Archivo no permitido";
    default:
      return "Error al cargar";
  }
}

export function MediaGalleryField({
  label = "Galería de imágenes",
  images,
  onChange,
}: MediaGalleryFieldProps) {
  const inputId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  function updateAt(index: number, patch: Partial<CatalogImage>) {
    onChange(
      images.map((image, current) =>
        current === index ? { ...image, ...patch } : image,
      ),
    );
  }

  function move(index: number, offset: number) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(images.filter((_, current) => current !== index));
  }

  function applyAsset(asset: AdminMediaAsset, index: number | null) {
    if (asset.kind !== "image") {
      setMessage("Solo imágenes en la galería del inmueble.");
      return;
    }
    setMessage("");
    const image = mediaAssetToCatalogImage(asset);
    if (index === null) {
      onChange([...images, image]);
      return;
    }
    updateAt(index, image);
  }

  async function uploadFiles(fileList: File[]) {
    const files = fileList.filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      setMessage("Archivo no permitido");
      return;
    }

    setUploading(true);
    setMessage("");
    const uploaded: CatalogImage[] = [];

    for (const file of files) {
      const result = await uploadMediaAssetRequest(file);
      if (!result.ok) {
        setMessage(`${file.name}: ${uploadErrorMessage(result.error)}`);
        break;
      }
      if (result.asset.kind === "image") {
        uploaded.push(mediaAssetToCatalogImage(result.asset));
      }
    }

    setUploading(false);
    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
    }
  }

  function handleDropReorder(from: number, to: number) {
    if (from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="field-label">{label}</legend>
      <p className="text-body-sm text-muted">
        Sube desde el PC, arrastra imágenes o elige recursos de la biblioteca.
        Quitar solo desvincula la foto del inmueble.
      </p>

      {images.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={`${image.src}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) {
                  handleDropReorder(dragIndex, index);
                  setDragIndex(null);
                }
              }}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/30 p-3"
            >
              {image.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.src}
                  alt={image.alt || "Imagen del inmueble"}
                  className="aspect-[4/3] w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-primary/10 text-caption text-muted">
                  Sin imagen
                </div>
              )}
              <p className="truncate text-caption text-secondary">
                {catalogImageLabel(image)}
              </p>
              <label className="flex flex-col gap-1">
                <span className="field-label">Alt</span>
                <input
                  className="admin-input"
                  value={image.alt}
                  onChange={(event) =>
                    updateAt(index, { alt: event.target.value })
                  }
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost text-body-sm"
                  onClick={() => {
                    setReplaceIndex(index);
                    setPickerOpen(true);
                  }}
                >
                  Reemplazar
                </button>
                <button
                  type="button"
                  className="btn-ghost text-body-sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost text-body-sm"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-ghost text-body-sm"
                  onClick={() => removeAt(index)}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-muted">Todavía no hay imágenes.</p>
      )}

      <div
        className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-border/70"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void uploadFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <p className="text-body-sm text-foreground">
          Arrastra imágenes aquí para agregarlas a la galería
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label htmlFor={inputId} className="btn-secondary cursor-pointer">
          {uploading ? "Subiendo…" : "Subir desde PC"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn-primary"
          disabled={uploading}
          onClick={() => {
            setReplaceIndex(null);
            setPickerOpen(true);
          }}
        >
          Biblioteca multimedia
        </button>
      </div>

      {message ? (
        <p className="text-body-sm text-foreground" role="alert">
          {message}
        </p>
      ) : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setReplaceIndex(null);
        }}
        onSelect={(asset) => {
          applyAsset(asset, replaceIndex);
          setPickerOpen(false);
          setReplaceIndex(null);
        }}
        accept="image"
        title={
          replaceIndex === null
            ? "Agregar imagen a la galería"
            : "Reemplazar imagen"
        }
      />
    </fieldset>
  );
}
