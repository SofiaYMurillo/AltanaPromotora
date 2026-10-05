"use client";

import { useState } from "react";

import { MediaPicker } from "@/features/admin/media";
import {
  uploadMediaAssetRequest,
  type AdminMediaAsset,
} from "@/features/admin/media/media-api.client";
import { SECTION_BACKGROUND_TOKENS } from "@/config/section-background-tokens";

import { mapSectionBackgroundSaveError } from "./section-background-api.logic";

export type SectionBackgroundEditorRow = {
  definition: {
    id: string;
    pageKey: string;
    sectionKey: string;
    label: string;
    supportsImage: boolean;
    supportsVideo: boolean;
    supportsSolid: boolean;
  };
  config: {
    backgroundType: string;
    mediaAssetId: string | null;
    posterMediaAssetId: string | null;
    backgroundToken: string | null;
  } | null;
  media: {
    id: string;
    url: string;
    alt: string;
    kind: string;
    originalName: string;
  } | null;
  poster: {
    id: string;
    url: string;
    alt: string;
    originalName: string;
  } | null;
};

type SectionBackgroundEditorProps = {
  row: SectionBackgroundEditorRow;
  onSaved: () => void;
};

export function SectionBackgroundEditor({
  row,
  onSaved,
}: SectionBackgroundEditorProps) {
  const { definition, config, media, poster } = row;
  const [pickerTarget, setPickerTarget] = useState<
    "media" | "poster" | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");

  async function saveBackground(input: {
    backgroundType: string;
    mediaAssetId?: string | null;
    posterMediaAssetId?: string | null;
    backgroundToken?: string | null;
  }) {
    setMessage("");
    const response = await fetch("/api/admin/section-backgrounds", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageKey: definition.pageKey,
        sectionKey: definition.sectionKey,
        backgroundType: input.backgroundType,
        mediaAssetId:
          input.mediaAssetId !== undefined
            ? input.mediaAssetId
            : config?.mediaAssetId ?? null,
        posterMediaAssetId:
          input.posterMediaAssetId !== undefined
            ? input.posterMediaAssetId
            : config?.posterMediaAssetId ?? null,
        backgroundToken:
          input.backgroundToken !== undefined
            ? input.backgroundToken
            : config?.backgroundToken ?? null,
      }),
    });
    if (!response.ok) {
      let errorCode: string | undefined;
      try {
        const payload = (await response.json()) as { error?: string };
        errorCode = payload.error;
      } catch {
        errorCode = undefined;
      }
      if (process.env.NODE_ENV !== "production") {
        console.error("[section-backgrounds] save failed", {
          status: response.status,
          error: errorCode,
          pageKey: definition.pageKey,
          sectionKey: definition.sectionKey,
        });
      }
      setMessage(mapSectionBackgroundSaveError(response.status, errorCode));
      return;
    }
    setMessage("Guardado correctamente.");
    onSaved();
  }

  function handleBackgroundTypeChange(nextType: string) {
    if (nextType === "none") {
      void saveBackground({
        backgroundType: "none",
        mediaAssetId: null,
        posterMediaAssetId: null,
        backgroundToken: null,
      });
      return;
    }

    if (nextType === "solid") {
      void saveBackground({
        backgroundType: "solid",
        backgroundToken: config?.backgroundToken ?? SECTION_BACKGROUND_TOKENS[0],
        mediaAssetId: null,
        posterMediaAssetId: null,
      });
      return;
    }

    if (nextType === "image" || nextType === "video") {
      void saveBackground({
        backgroundType: nextType,
        mediaAssetId: null,
        posterMediaAssetId: null,
        backgroundToken: null,
      });
    }
  }

  async function uploadFiles(files: File[]) {
    const backgroundType = config?.backgroundType ?? "image";
    const file = files.find((item) =>
      backgroundType === "video"
        ? item.type.startsWith("video/")
        : item.type.startsWith("image/"),
    );
    if (!file) {
      setMessage("Archivo no permitido.");
      return;
    }
    setUploading(true);
    const result = await uploadMediaAssetRequest(file);
    setUploading(false);
    if (!result.ok) {
      setMessage("Error al cargar.");
      return;
    }
    await saveBackground({
      backgroundType: result.asset.kind === "video" ? "video" : "image",
      mediaAssetId: result.asset.id,
    });
  }

  function handlePick(asset: AdminMediaAsset) {
    if (pickerTarget === "poster") {
      void saveBackground({
        backgroundType: config?.backgroundType ?? "video",
        posterMediaAssetId: asset.id,
      });
    } else {
      void saveBackground({
        backgroundType: asset.kind === "video" ? "video" : "image",
        mediaAssetId: asset.id,
      });
    }
    setPickerTarget(null);
  }

  const backgroundType = config?.backgroundType ?? "none";
  const showMedia =
    backgroundType === "image" || backgroundType === "video";

  return (
    <article className="rounded-lg border border-border/50 bg-background/30 p-5">
      <h3 className="text-heading-sm text-foreground">{definition.label}</h3>

      {showMedia ? (
        <div
          className={`relative mt-4 overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
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
          {backgroundType === "video" && media ? (
            <video
              src={media.url}
              className="aspect-[16/9] max-h-48 w-full object-cover"
              controls
              muted
              playsInline
              poster={poster?.url}
            />
          ) : media ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.url}
              alt={media.alt || media.originalName}
              className="aspect-[16/9] max-h-48 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] max-h-48 items-center justify-center px-4 text-center text-body-sm text-muted">
              Sin recurso — arrastra aquí o sube desde PC
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="field-label">Tipo de fondo</span>
          <select
            className="admin-input"
            value={backgroundType}
            onChange={(event) => handleBackgroundTypeChange(event.target.value)}
          >
            <option value="none">Sin fondo multimedia</option>
            {definition.supportsImage ? (
              <option value="image">Imagen</option>
            ) : null}
            {definition.supportsVideo ? (
              <option value="video">Video</option>
            ) : null}
            {definition.supportsSolid ? (
              <option value="solid">Color sólido</option>
            ) : null}
          </select>
        </label>

        {backgroundType === "solid" ? (
          <label className="flex flex-col gap-2">
            <span className="field-label">Color ALTANA</span>
            <select
              className="admin-input"
              value={config?.backgroundToken ?? "primary"}
              onChange={(event) =>
                void saveBackground({
                  backgroundType: "solid",
                  backgroundToken: event.target.value,
                })
              }
            >
              {SECTION_BACKGROUND_TOKENS.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {showMedia ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="btn-secondary cursor-pointer">
            {uploading ? "Subiendo…" : "Subir desde PC"}
            <input
              type="file"
              accept={
                backgroundType === "video"
                  ? "video/mp4,video/webm"
                  : "image/jpeg,image/png,image/webp,image/avif"
              }
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                void uploadFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={uploading}
            onClick={() => setPickerTarget("media")}
          >
            Biblioteca multimedia
          </button>
          {backgroundType === "video" ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPickerTarget("poster")}
            >
              Poster / fallback
            </button>
          ) : null}
          {media ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                void saveBackground({
                  backgroundType: "none",
                  mediaAssetId: null,
                  posterMediaAssetId: null,
                })
              }
            >
              Quitar
            </button>
          ) : null}
          {media ? (
            <p className="w-full text-body-sm text-secondary">
              Recurso: {media.originalName}
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p
          className="mt-2 text-body-sm text-foreground"
          role={message === "Guardado correctamente." ? "status" : "alert"}
        >
          {message}
        </p>
      ) : null}

      <MediaPicker
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={handlePick}
        accept={
          pickerTarget === "poster"
            ? "image"
            : backgroundType === "video"
              ? "video"
              : "image"
        }
        title="Seleccionar recurso"
      />
    </article>
  );
}
