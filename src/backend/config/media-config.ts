/** Server-only media upload limits and allowlists. */

export const MEDIA_UPLOAD_DIR = "uploads/media";

export const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 80 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

export const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm"]);

import {
  SECTION_BACKGROUND_TOKENS,
  type SectionBackgroundToken,
} from "@/config/section-background-tokens";

export { SECTION_BACKGROUND_TOKENS, type SectionBackgroundToken };
