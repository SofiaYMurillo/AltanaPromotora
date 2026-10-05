import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { MEDIA_UPLOAD_DIR } from "../config/media-config";

function uploadsRoot() {
  return path.join(process.cwd(), "public", MEDIA_UPLOAD_DIR);
}

export function getMediaPublicUrl(fileName: string) {
  const normalized = fileName.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new Error("invalid_media_path");
  }
  return `/${MEDIA_UPLOAD_DIR}/${normalized}`;
}

export async function saveMediaFile(input: {
  fileName: string;
  bytes: Buffer;
}) {
  const safeName = path.basename(input.fileName);
  if (!safeName || safeName !== input.fileName) {
    throw new Error("invalid_media_path");
  }

  const dir = uploadsRoot();
  await mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, safeName);
  const resolvedDir = path.resolve(dir);
  const resolvedFile = path.resolve(absolutePath);

  if (!resolvedFile.startsWith(resolvedDir)) {
    throw new Error("invalid_media_path");
  }

  await writeFile(resolvedFile, input.bytes);
  return getMediaPublicUrl(safeName);
}

export async function deleteMediaFile(fileName: string) {
  const safeName = path.basename(fileName);
  const absolutePath = path.join(uploadsRoot(), safeName);
  const resolvedDir = path.resolve(uploadsRoot());
  const resolvedFile = path.resolve(absolutePath);

  if (!resolvedFile.startsWith(resolvedDir)) {
    throw new Error("invalid_media_path");
  }

  try {
    await unlink(resolvedFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
