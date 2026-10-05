"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listMediaAssetsRequest,
  uploadMediaAssetRequest,
  type AdminMediaAsset,
} from "../media-api.client";
import { MediaDropzone } from "./MediaDropzone";

type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: AdminMediaAsset) => void;
  accept?: "image" | "video" | "any";
  title?: string;
};

function uploadErrorMessage(error: string) {
  switch (error) {
    case "file_too_large":
      return "Archivo demasiado grande";
    case "file_type_not_allowed":
      return "Archivo no permitido";
    case "file_missing":
      return "No se recibió el archivo";
    default:
      return "Error al cargar";
  }
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  accept = "any",
  title = "Biblioteca multimedia",
}: MediaPickerProps) {
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<
    { name: string; progress: number; status: "uploading" | "error" | "done" }[]
  >([]);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    const result = await listMediaAssetsRequest({
      kind: accept === "any" ? undefined : accept,
      search,
    });
    setLoading(false);
    if (result.ok) {
      setAssets(result.assets);
    }
  }, [accept, search]);

  useEffect(() => {
    if (!open) return;
    // Fetch library when the dialog opens (client-side data load).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on open
    void loadAssets();
  }, [open, loadAssets]);

  async function handleUpload(files: File[]) {
    for (const file of files) {
      setUploadQueue((current) => [
        ...current,
        { name: file.name, progress: 0, status: "uploading" },
      ]);
      const result = await uploadMediaAssetRequest(file, (progress) => {
        setUploadQueue((current) =>
          current.map((item) =>
            item.name === file.name && item.status === "uploading"
              ? { ...item, progress }
              : item,
          ),
        );
      });
      setUploadQueue((current) =>
        current.map((item) =>
          item.name === file.name
            ? {
                ...item,
                status: result.ok ? "done" : "error",
                progress: result.ok ? 100 : item.progress,
              }
            : item,
        ),
      );
    }
    await loadAssets();
  }

  if (!open) return null;

  const filtered = assets.filter((asset) => {
    if (accept === "any") return true;
    return asset.kind === accept;
  });

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-primary/70 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
    >
      <div className="admin-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border/40 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border/50 px-6 py-4">
          <div>
            <h2 id="media-picker-title" className="text-heading-sm text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-body-sm text-muted">
              Selecciona un recurso o sube uno nuevo.
            </p>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          <MediaDropzone onFilesSelected={(files) => void handleUpload(files)} />

          {uploadQueue.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {uploadQueue.map((item) => (
                <li
                  key={item.name}
                  className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-body-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-foreground">{item.name}</span>
                    <span className="text-muted">
                      {item.status === "uploading"
                        ? `${item.progress}%`
                        : item.status === "done"
                          ? "Listo"
                          : uploadErrorMessage("network")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o alt…"
            className="admin-input"
          />

          {loading ? (
            <p className="text-body-sm text-muted">Cargando biblioteca…</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    className="group flex w-full flex-col overflow-hidden rounded-lg border border-border/60 bg-background/30 text-left transition hover:border-accent"
                    onClick={() => {
                      onSelect(asset);
                      onClose();
                    }}
                  >
                    <div className="relative aspect-[4/3] bg-primary/10">
                      {asset.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.url}
                          alt={asset.alt || asset.originalName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-caption uppercase tracking-widest text-muted">
                          Video
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className="truncate text-body-sm text-foreground">
                        {asset.originalName}
                      </p>
                      <p className="text-caption text-muted">{asset.kind}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
