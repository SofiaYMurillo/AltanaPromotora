export type AdminMediaAsset = {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  kind: "image" | "video";
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type MediaUploadError =
  | "file_missing"
  | "file_too_large"
  | "file_type_not_allowed"
  | "invalid_file_name"
  | "unauthorized"
  | "forbidden"
  | "network";

function mapHttpError(status: number): MediaUploadError {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  return "network";
}

export async function listMediaAssetsRequest(input?: {
  kind?: "image" | "video";
  search?: string;
}) {
  const params = new URLSearchParams();
  if (input?.kind) params.set("kind", input.kind);
  if (input?.search) params.set("search", input.search);
  const query = params.toString();
  const response = await fetch(
    `/api/admin/media${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    return { ok: false as const, error: mapHttpError(response.status) };
  }
  const data = (await response.json()) as { assets: AdminMediaAsset[] };
  return { ok: true as const, assets: data.assets };
}

export async function uploadMediaAssetRequest(
  file: File,
  onProgress?: (percent: number) => void,
) {
  return new Promise<
    | { ok: true; asset: AdminMediaAsset }
    | { ok: false; error: MediaUploadError; fileName: string }
  >((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as {
            asset: AdminMediaAsset;
          };
          resolve({ ok: true, asset: data.asset });
          return;
        } catch {
          resolve({ ok: false, error: "network", fileName: file.name });
          return;
        }
      }

      let error: MediaUploadError = mapHttpError(xhr.status);
      try {
        const data = JSON.parse(xhr.responseText) as { error?: string };
        if (data.error === "file_too_large") error = "file_too_large";
        if (data.error === "file_type_not_allowed") error = "file_type_not_allowed";
        if (data.error === "file_missing") error = "file_missing";
      } catch {
        // keep mapped http error
      }
      resolve({ ok: false, error, fileName: file.name });
    };
    xhr.onerror = () => {
      resolve({ ok: false, error: "network", fileName: file.name });
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export async function updateMediaAltRequest(id: string, alt: string) {
  const response = await fetch(`/api/admin/media/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alt }),
  });
  if (!response.ok) {
    return { ok: false as const, error: mapHttpError(response.status) };
  }
  const data = (await response.json()) as { asset: AdminMediaAsset };
  return { ok: true as const, asset: data.asset };
}

export async function deleteMediaAssetRequest(id: string) {
  const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (response.status === 409 && data?.error === "in_use") {
      return { ok: false as const, error: "in_use" as const };
    }
    return { ok: false as const, error: mapHttpError(response.status) };
  }
  return { ok: true as const };
}
