import path from "node:path";

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_EXTENSIONS,
  ALLOWED_VIDEO_MIME_TYPES,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  type SectionBackgroundToken,
  SECTION_BACKGROUND_TOKENS,
} from "../config/media-config";
import type { MediaKind } from "@/domain/media";

export type MediaValidationError =
  | "file_too_large"
  | "file_type_not_allowed"
  | "invalid_file_name";

function extensionOf(name: string) {
  return path.extname(name).toLowerCase();
}

export function detectMediaKind(
  mimeType: string,
  fileName: string,
): MediaKind | null {
  const ext = extensionOf(fileName);
  if (
    ALLOWED_IMAGE_MIME_TYPES.has(mimeType) &&
    ALLOWED_IMAGE_EXTENSIONS.has(ext)
  ) {
    return "image";
  }
  if (
    ALLOWED_VIDEO_MIME_TYPES.has(mimeType) &&
    ALLOWED_VIDEO_EXTENSIONS.has(ext)
  ) {
    return "video";
  }
  return null;
}

export function validateUploadFile(input: {
  mimeType: string;
  fileName: string;
  size: number;
}):
  | { ok: true; kind: MediaKind }
  | { ok: false; error: MediaValidationError } {
  const baseName = path.basename(input.fileName);
  if (!baseName || baseName !== input.fileName.replace(/\\/g, "/")) {
    return { ok: false, error: "invalid_file_name" };
  }

  const kind = detectMediaKind(input.mimeType, baseName);
  if (!kind) {
    return { ok: false, error: "file_type_not_allowed" };
  }

  const maxSize = kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
  if (input.size > maxSize) {
    return { ok: false, error: "file_too_large" };
  }

  return { ok: true, kind };
}

export function isSectionBackgroundToken(
  value: string,
): value is SectionBackgroundToken {
  return (SECTION_BACKGROUND_TOKENS as readonly string[]).includes(value);
}

export function createSafeStorageFileName(input: {
  id: string;
  originalName: string;
}) {
  const ext = extensionOf(input.originalName);
  if (!ext) {
    throw new Error("invalid_file_name");
  }
  const allowed =
    ALLOWED_IMAGE_EXTENSIONS.has(ext) || ALLOWED_VIDEO_EXTENSIONS.has(ext);
  if (!allowed) {
    throw new Error("invalid_file_name");
  }
  return `${input.id}${ext}`;
}
