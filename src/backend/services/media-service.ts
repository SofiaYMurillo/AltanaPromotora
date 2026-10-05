import { randomUUID } from "node:crypto";

import { SECTION_BACKGROUND_TOKENS } from "@/config/section-background-tokens";
import type { SectionBackgroundType } from "@/domain/media";

import { isSectionBackgroundToken } from "../media/media-validation";
import {
  createSafeStorageFileName,
  validateUploadFile,
} from "../media/media-validation";
import * as mediaRepository from "../repositories/media-repository";
import {
  deleteMediaFile,
  saveMediaFile,
} from "../storage/local-media-storage";
import type { AuditActor } from "@/domain";

import { recordAuditEntry } from "./audit-service";
import { revalidateSectionBackgroundPublic } from "./section-background-public-cache";

export type MediaServiceError =
  | "file_missing"
  | "file_too_large"
  | "file_type_not_allowed"
  | "invalid_file_name"
  | "not_found"
  | "in_use"
  | "invalid_payload"
  | "invalid_background";

function mapValidationError(
  error: "file_too_large" | "file_type_not_allowed" | "invalid_file_name",
): MediaServiceError {
  return error;
}

export async function uploadMediaAsset(input: {
  file: File;
  actor?: AuditActor;
}) {
  if (!input.file || input.file.size === 0) {
    return { ok: false as const, error: "file_missing" as const };
  }

  const validation = validateUploadFile({
    mimeType: input.file.type,
    fileName: input.file.name,
    size: input.file.size,
  });

  if (!validation.ok) {
    return {
      ok: false as const,
      error: mapValidationError(validation.error),
    };
  }

  const id = `media-${randomUUID()}`;
  const fileName = createSafeStorageFileName({
    id,
    originalName: input.file.name,
  });
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const url = await saveMediaFile({ fileName, bytes });

  const asset = await mediaRepository.createMediaAsset({
    id,
    fileName,
    originalName: input.file.name,
    mimeType: input.file.type,
    kind: validation.kind,
    url,
    alt: "",
    width: null,
    height: null,
    size: input.file.size,
  });

  if (input.actor) {
    await recordAuditEntry({
      actor: input.actor,
      action: "created",
      entityType: "media_asset",
      entityId: asset.id,
      entityLabel: asset.originalName,
      metadata: { kind: asset.kind, size: asset.size },
    });
  }

  return { ok: true as const, asset };
}

export async function updateMediaAssetAlt(input: {
  id: string;
  alt: string;
  actor?: AuditActor;
}) {
  const existing = await mediaRepository.getMediaAssetById(input.id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  const asset = await mediaRepository.updateMediaAssetAlt(
    input.id,
    input.alt.trim(),
  );

  if (input.actor) {
    await recordAuditEntry({
      actor: input.actor,
      action: "updated",
      entityType: "media_asset",
      entityId: asset.id,
      entityLabel: asset.originalName,
    });
  }

  return { ok: true as const, asset };
}

export async function deleteMediaAsset(input: {
  id: string;
  actor?: AuditActor;
}) {
  const existing = await mediaRepository.getMediaAssetById(input.id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  const usageCount = await mediaRepository.countMediaAssetUsage(input.id);
  if (usageCount > 0) {
    return { ok: false as const, error: "in_use" as const };
  }

  await mediaRepository.deleteMediaAssetById(input.id);
  await deleteMediaFile(existing.fileName);

  if (input.actor) {
    await recordAuditEntry({
      actor: input.actor,
      action: "updated",
      metadata: { operation: "delete" },
      entityType: "media_asset",
      entityId: existing.id,
      entityLabel: existing.originalName,
    });
  }

  return { ok: true as const };
}

export async function listAdminMediaAssets(input?: {
  kind?: "image" | "video";
  search?: string;
}) {
  const assets = await mediaRepository.listMediaAssets(input);
  return { ok: true as const, assets };
}

async function finalizeSectionBackgroundAssign(
  config: Awaited<ReturnType<typeof mediaRepository.upsertSectionBackground>>,
  actor?: AuditActor,
) {
  if (actor) {
    await recordAuditEntry({
      actor,
      action: "updated",
      entityType: "section_background",
      entityId: config.id,
      entityLabel: `${config.pageKey}/${config.sectionKey}`,
      metadata: {
        backgroundType: config.backgroundType,
        mediaAssetId: config.mediaAssetId,
        backgroundToken: config.backgroundToken,
      },
    });
  }

  revalidateSectionBackgroundPublic(config.pageKey);
}

export async function assignSectionBackground(input: {
  pageKey: string;
  sectionKey: string;
  backgroundType: SectionBackgroundType;
  mediaAssetId?: string | null;
  posterMediaAssetId?: string | null;
  backgroundToken?: string | null;
  actor?: AuditActor;
}) {
  const id = `${input.pageKey}.${input.sectionKey}`;

  if (input.backgroundType === "none") {
    const config = await mediaRepository.upsertSectionBackground({
      id,
      pageKey: input.pageKey,
      sectionKey: input.sectionKey,
      backgroundType: "none",
      mediaAssetId: null,
      posterMediaAssetId: null,
      backgroundToken: null,
    });
    await finalizeSectionBackgroundAssign(config, input.actor);
    return { ok: true as const, config };
  }

  if (input.backgroundType === "solid") {
    const trimmed = input.backgroundToken?.trim();
    const token =
      trimmed && isSectionBackgroundToken(trimmed)
        ? trimmed
        : SECTION_BACKGROUND_TOKENS[0];
    const config = await mediaRepository.upsertSectionBackground({
      id,
      pageKey: input.pageKey,
      sectionKey: input.sectionKey,
      backgroundType: "solid",
      mediaAssetId: null,
      posterMediaAssetId: null,
      backgroundToken: token,
    });
    await finalizeSectionBackgroundAssign(config, input.actor);
    return { ok: true as const, config };
  }

  if (!input.mediaAssetId) {
    const config = await mediaRepository.upsertSectionBackground({
      id,
      pageKey: input.pageKey,
      sectionKey: input.sectionKey,
      backgroundType: input.backgroundType,
      mediaAssetId: null,
      posterMediaAssetId:
        input.backgroundType === "video"
          ? (input.posterMediaAssetId ?? null)
          : null,
      backgroundToken: null,
    });
    await finalizeSectionBackgroundAssign(config, input.actor);
    return { ok: true as const, config };
  }

  const media = await mediaRepository.getMediaAssetById(input.mediaAssetId);
  if (!media) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (input.backgroundType === "image" && media.kind !== "image") {
    return { ok: false as const, error: "invalid_background" as const };
  }

  if (input.backgroundType === "video" && media.kind !== "video") {
    return { ok: false as const, error: "invalid_background" as const };
  }

  let posterMediaAssetId: string | null = null;
  if (input.posterMediaAssetId) {
    const poster = await mediaRepository.getMediaAssetById(
      input.posterMediaAssetId,
    );
    if (!poster || poster.kind !== "image") {
      return { ok: false as const, error: "invalid_background" as const };
    }
    posterMediaAssetId = poster.id;
  }

  const config = await mediaRepository.upsertSectionBackground({
    id,
    pageKey: input.pageKey,
    sectionKey: input.sectionKey,
    backgroundType: input.backgroundType,
    mediaAssetId: media.id,
    posterMediaAssetId,
    backgroundToken: null,
  });

  await finalizeSectionBackgroundAssign(config, input.actor);

  return { ok: true as const, config };
}
