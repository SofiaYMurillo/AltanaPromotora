"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminCard, AdminPage } from "@/features/admin";

import {
  deleteMediaAssetRequest,
  listMediaAssetsRequest,
  updateMediaAltRequest,
  uploadMediaAssetRequest,
  type AdminMediaAsset,
} from "./media-api.client";
import { MediaDropzone } from "./components/MediaDropzone";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryPage() {
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"" | "image" | "video">("");
  const [selected, setSelected] = useState<AdminMediaAsset | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [message, setMessage] = useState("");
  const [uploads, setUploads] = useState<
    { name: string; progress: number; status: string }[]
  >([]);

  const reload = useCallback(async () => {
    const result = await listMediaAssetsRequest({
      search: search || undefined,
      kind: kind || undefined,
    });
    if (result.ok) {
      setAssets(result.assets);
    }
  }, [kind, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- list refresh on filters
    void reload();
  }, [reload]);

  async function handleUpload(files: File[]) {
    setMessage("");
    for (const file of files) {
      setUploads((current) => [
        ...current,
        { name: file.name, progress: 0, status: "uploading" },
      ]);
      const result = await uploadMediaAssetRequest(file, (progress) => {
        setUploads((current) =>
          current.map((item) =>
            item.name === file.name ? { ...item, progress } : item,
          ),
        );
      });
      setUploads((current) =>
        current.map((item) =>
          item.name === file.name
            ? {
                ...item,
                progress: 100,
                status: result.ok ? "success" : result.error,
              }
            : item,
        ),
      );
    }
    await reload();
  }

  async function handleSaveAlt() {
    if (!selected) return;
    const result = await updateMediaAltRequest(selected.id, altDraft);
    if (result.ok) {
      setSelected(result.asset);
      setMessage("Texto alternativo actualizado.");
      await reload();
    }
  }

  async function handleDelete() {
    if (!selected) return;
    const result = await deleteMediaAssetRequest(selected.id);
    if (result.ok) {
      setSelected(null);
      setMessage("Recurso eliminado.");
      await reload();
      return;
    }
    if (result.error === "in_use") {
      setMessage("Este recurso está siendo utilizado.");
      return;
    }
    setMessage("No se pudo eliminar el recurso.");
  }

  return (
    <AdminPage
      title="Biblioteca Multimedia"
      description="Sube, organiza y reutiliza imágenes y videos para el sitio público."
    >
      <div className="flex flex-col gap-8">
        <AdminCard>
          <MediaDropzone onFilesSelected={(files) => void handleUpload(files)} />
          {uploads.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {uploads.map((item) => (
                <li
                  key={`${item.name}-${item.status}`}
                  className="rounded-md border border-border/50 px-3 py-2 text-body-sm"
                >
                  <div className="flex justify-between gap-3">
                    <span className="truncate">{item.name}</span>
                    <span className="text-muted">
                      {item.status === "uploading"
                        ? `${item.progress}%`
                        : item.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminCard>

        <AdminCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar…"
                className="admin-input max-w-md"
              />
              <select
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as "" | "image" | "video")
                }
                className="admin-input max-w-xs"
              >
                <option value="">Todos</option>
                <option value="image">Imágenes</option>
                <option value="video">Videos</option>
              </select>
            </div>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(asset);
                    setAltDraft(asset.alt);
                    setMessage("");
                  }}
                  className={`flex w-full flex-col overflow-hidden rounded-lg border text-left transition ${
                    selected?.id === asset.id
                      ? "border-accent ring-1 ring-accent/40"
                      : "border-border/60 hover:border-accent/70"
                  }`}
                >
                  <div className="aspect-[4/3] bg-primary/10">
                    {asset.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.url}
                        alt={asset.alt || asset.originalName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-caption uppercase tracking-[0.2em] text-muted">
                        Video
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 px-3 py-3">
                    <p className="truncate text-body-sm text-foreground">
                      {asset.originalName}
                    </p>
                    <p className="text-caption text-muted">
                      {asset.kind} · {formatBytes(asset.size)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </AdminCard>

        {selected ? (
          <AdminCard>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="overflow-hidden rounded-lg border border-border/60 bg-primary/5">
                {selected.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.url}
                    alt={selected.alt || selected.originalName}
                    className="max-h-[420px] w-full object-contain"
                  />
                ) : (
                  <video
                    src={selected.url}
                    controls
                    className="max-h-[420px] w-full bg-primary"
                    playsInline
                    muted
                  />
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="field-label">Nombre</p>
                  <p className="text-body-md text-foreground">
                    {selected.originalName}
                  </p>
                </div>
                <div>
                  <p className="field-label">URL</p>
                  <p className="break-all text-body-sm text-secondary">
                    {selected.url}
                  </p>
                </div>
                {selected.kind === "image" ? (
                  <label className="flex flex-col gap-2">
                    <span className="field-label">Texto alternativo (alt)</span>
                    <input
                      value={altDraft}
                      onChange={(event) => setAltDraft(event.target.value)}
                      className="admin-input"
                    />
                  </label>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {selected.kind === "image" ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => void handleSaveAlt()}
                    >
                      Guardar alt
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => void handleDelete()}
                  >
                    Eliminar
                  </button>
                </div>
                {message ? (
                  <p className="text-body-sm text-secondary" role="status">
                    {message}
                  </p>
                ) : null}
              </div>
            </div>
          </AdminCard>
        ) : null}
      </div>
    </AdminPage>
  );
}
