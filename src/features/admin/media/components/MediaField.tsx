"use client";

import { useCallback, useId, useState } from "react";

import type { CatalogImage } from "@/domain";

import {
  uploadMediaAssetRequest,
  type AdminMediaAsset,
} from "../media-api.client";
import {
  catalogImageLabel,
  isImageSrc,
  mediaAssetToCatalogImage,
} from "./media-field.utils";
import { MediaPicker } from "./MediaPicker";

type MediaFieldProps = {
  label: string;
  value: CatalogImage;
  onChange: (value: CatalogImage) => void;
  accept?: "image" | "video";
  allowRemove?: boolean;
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

export function MediaField({
  label,
  value,
  onChange,
  accept = "image",
  allowRemove = true,
}: MediaFieldProps) {
  const inputId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");

  const acceptMime =
    accept === "video"
      ? "video/mp4,video/webm"
      : "image/jpeg,image/png,image/webp,image/avif";

  const applyAsset = useCallback(
    (asset: AdminMediaAsset) => {
      if (accept === "image" && asset.kind !== "image") {
        setMessage("Selecciona una imagen.");
        return;
      }
      if (accept === "video" && asset.kind !== "video") {
        setMessage("Selecciona un video.");
        return;
      }
      setMessage("");
      onChange(mediaAssetToCatalogImage(asset));
    },
    [accept, onChange],
  );

  async function uploadFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    const result = await uploadMediaAssetRequest(file);
    setUploading(false);

    if (!result.ok) {
      setMessage(uploadErrorMessage(result.error));
      return;
    }

    applyAsset(result.asset);
  }

  function handleRemove() {
    setMessage("");
    onChange({ src: "", alt: "" });
  }

  const hasImage = isImageSrc(value.src);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="field-label">{label}</legend>

      <div
        className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-border/70 bg-background/40"
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
        {hasImage ? (
          accept === "video" ? (
            <video
              src={value.src}
              className="aspect-[16/9] max-h-56 w-full bg-primary object-cover"
              controls
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.src}
              alt={value.alt || "Vista previa"}
              className="aspect-[16/9] max-h-56 w-full object-cover"
            />
          )
        ) : (
          <div className="flex aspect-[16/9] max-h-56 w-full items-center justify-center px-4 text-center text-body-sm text-muted">
            {uploading
              ? "Subiendo…"
              : "Arrastra una imagen aquí o usa los botones"}
          </div>
        )}
      </div>

      {hasImage ? (
        <p className="text-body-sm text-secondary">
          Recurso seleccionado: {catalogImageLabel(value)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <label htmlFor={inputId} className="btn-secondary cursor-pointer">
          {uploading ? "Subiendo…" : "Subir desde PC"}
        </label>
        <input
          id={inputId}
          type="file"
          accept={acceptMime}
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
          onClick={() => setPickerOpen(true)}
        >
          Biblioteca multimedia
        </button>
        {allowRemove && hasImage ? (
          <button type="button" className="btn-ghost" onClick={handleRemove}>
            Quitar
          </button>
        ) : null}
      </div>

      {accept === "image" && hasImage ? (
        <label className="flex flex-col gap-2">
          <span className="field-label">Texto alternativo</span>
          <input
            className="admin-input"
            value={value.alt}
            onChange={(event) => onChange({ ...value, alt: event.target.value })}
          />
        </label>
      ) : null}

      {message ? (
        <p className="text-body-sm text-foreground" role="alert">
          {message}
        </p>
      ) : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={applyAsset}
        accept={accept}
        title="Seleccionar recurso"
      />
    </fieldset>
  );
}
