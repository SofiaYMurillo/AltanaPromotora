"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminCard } from "@/features/admin";
import { MediaPicker } from "@/features/admin/media";
import {
  uploadMediaAssetRequest,
  type AdminMediaAsset,
} from "@/features/admin/media/media-api.client";
import type { MediaAsset } from "@/types/media";

type SiteIdentityPanelProps = {
  initialLogo: MediaAsset | null;
  logoMediaAssetId: string | null;
};

export function SiteIdentityPanel({
  initialLogo,
  logoMediaAssetId: initialLogoId,
}: SiteIdentityPanelProps) {
  const router = useRouter();
  const [logo, setLogo] = useState<MediaAsset | null>(initialLogo);
  const [logoMediaAssetId, setLogoMediaAssetId] = useState(initialLogoId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("");

  async function persistLogo(mediaAssetId: string | null) {
    setStatus("");
    const response = await fetch("/api/admin/site-settings/logo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoMediaAssetId: mediaAssetId }),
    });
    if (!response.ok) {
      setStatus("No se pudo guardar el logo.");
      return false;
    }
    setLogoMediaAssetId(mediaAssetId);
    setStatus("Logo actualizado.");
    router.refresh();
    return true;
  }

  async function applyAsset(asset: AdminMediaAsset) {
    if (asset.kind !== "image") {
      setStatus("El logo debe ser una imagen.");
      return;
    }
    const ok = await persistLogo(asset.id);
    if (ok) {
      setLogo({
        id: asset.id,
        url: asset.url,
        alt: asset.alt,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      });
    }
  }

  async function uploadFiles(files: File[]) {
    const file = files.find((item) => item.type.startsWith("image/"));
    if (!file) {
      setStatus("Archivo no permitido.");
      return;
    }
    setUploading(true);
    setStatus("");
    const result = await uploadMediaAssetRequest(file);
    setUploading(false);
    if (!result.ok) {
      setStatus("Error al cargar.");
      return;
    }
    await applyAsset(result.asset);
  }

  async function handleRemove() {
    const ok = await persistLogo(null);
    if (ok) {
      setLogo(null);
    }
  }

  const hasLogo = Boolean(logo?.url);

  return (
    <AdminCard>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-heading-sm text-foreground">Identidad del sitio</h2>
          <p className="mt-1 text-body-sm text-muted">
            Logo global para Header y Footer públicos. No afecta la imagen de
            perfil del panel administrativo.
          </p>
        </div>

        <div
          className={`flex min-h-[8rem] items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver ? "border-accent bg-accent/10" : "border-border/70 bg-background/30"
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
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo!.url}
              alt={logo!.alt || "Logo ALTANA"}
              className="max-h-20 w-auto object-contain"
            />
          ) : (
            <p className="text-center text-body-sm text-muted">
              {uploading
                ? "Subiendo…"
                : "Sin logo administrable — se usa texto en Header y Footer"}
            </p>
          )}
        </div>

        {hasLogo ? (
          <p className="text-body-sm text-secondary">
            Recurso seleccionado:{" "}
            {logo!.url.split("/").pop() ?? logo!.id}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary cursor-pointer">
            {uploading ? "Subiendo…" : "Subir desde PC"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
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
            onClick={() => setPickerOpen(true)}
          >
            Biblioteca multimedia
          </button>
          {logoMediaAssetId ? (
            <button type="button" className="btn-ghost" onClick={() => void handleRemove()}>
              Quitar logo
            </button>
          ) : null}
        </div>

        {status ? (
          <p className="text-body-sm text-secondary" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          void applyAsset(asset);
          setPickerOpen(false);
        }}
        accept="image"
        title="Seleccionar logo"
      />
    </AdminCard>
  );
}
