import { randomUUID } from "node:crypto";

import {
  normalizeAboutTeamSectionDraft,
  validateAboutTeamMemberDraft,
  validateAboutTeamSectionDraft,
  type AboutTeamMemberRecord,
  type AboutTeamSectionContent,
  type AuditActor,
  type PublicAboutTeamSection,
} from "@/domain";

import * as aboutTeamRepository from "../repositories/about-team-repository";
import * as mediaRepository from "../repositories/media-repository";
import { recordAuditEntry } from "./audit-service";

const FORBIDDEN_MEMBER_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "userId",
  "clientId",
]);

const ALLOWED_MEMBER_FIELDS = new Set([
  "name",
  "role",
  "description",
  "mediaAssetId",
  "sortOrder",
  "published",
]);

export type AboutTeamWriteError =
  | "invalid_body"
  | "invalid_title"
  | "invalid_description"
  | "invalid_pending_message"
  | "invalid_name"
  | "invalid_role"
  | "invalid_sort_order"
  | "invalid_media_asset"
  | "not_found"
  | "forbidden_field";

type WriteOptions = { actor?: AuditActor | null };

const DEFAULT_SECTION: AboutTeamSectionContent = {
  title: "Las personas detrás de ALTANA",
  description:
    "Profesionales que acompañan cada búsqueda y arrendamiento con cercanía, criterio y compromiso.",
  pendingMessage:
    "Estamos preparando la presentación de nuestro equipo. Muy pronto podrás conocer a las personas que hacen posible Altana Promotora.",
};

async function resolveMemberImage(mediaAssetId: string | null) {
  if (!mediaAssetId) {
    return undefined;
  }
  const asset = await mediaRepository.getMediaAssetById(mediaAssetId);
  if (!asset || asset.kind !== "image") {
    return undefined;
  }
  return {
    src: asset.url,
    alt: asset.alt.trim() || asset.originalName,
  };
}

export async function ensureAboutTeamSectionDefaults() {
  const existing = await aboutTeamRepository.getAboutTeamSection();
  if (existing) {
    return existing;
  }
  return aboutTeamRepository.upsertAboutTeamSection(DEFAULT_SECTION);
}

export async function getPublicAboutTeamSection(): Promise<PublicAboutTeamSection> {
  const section =
    (await aboutTeamRepository.getAboutTeamSection()) ??
    (await ensureAboutTeamSectionDefaults());
  const records = await aboutTeamRepository.listPublishedAboutTeamMembers();
  const members: PublicAboutTeamSection["members"] = [];

  for (const record of records) {
    const image = await resolveMemberImage(record.mediaAssetId);
    members.push({
      id: record.id,
      name: record.name,
      role: record.role,
      description: record.description.trim() || undefined,
      ...(image ? { image } : {}),
    });
  }

  return {
    title: section.title,
    description: section.description,
    pendingMessage: section.pendingMessage,
    members,
  };
}

export type AdminAboutTeamMember = AboutTeamMemberRecord & {
  image: { src: string; alt: string } | null;
};

export async function getAdminAboutTeamBundle() {
  const section = await ensureAboutTeamSectionDefaults();
  const members = await aboutTeamRepository.listAboutTeamMembersAdmin();
  const enriched: AdminAboutTeamMember[] = [];

  for (const member of members) {
    const image = (await resolveMemberImage(member.mediaAssetId)) ?? null;
    enriched.push({ ...member, image });
  }

  return { section, members: enriched };
}

function rejectForbiddenMemberFields(body: Record<string, unknown>) {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_MEMBER_FIELDS.has(key) || !ALLOWED_MEMBER_FIELDS.has(key)) {
      return "forbidden_field" as const;
    }
  }
  return null;
}

async function validateMediaAssetId(mediaAssetId: string | null) {
  if (!mediaAssetId) {
    return null;
  }
  const asset = await mediaRepository.getMediaAssetById(mediaAssetId);
  if (!asset || asset.kind !== "image") {
    return "invalid_media_asset" as const;
  }
  return null;
}

function parseMemberBody(body: unknown):
  | {
      ok: true;
      name: string;
      role: string;
      description: string;
      mediaAssetId: string | null;
      sortOrder: number;
      published: boolean;
    }
  | { ok: false; error: AboutTeamWriteError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const input = body as Record<string, unknown>;
  const forbidden = rejectForbiddenMemberFields(input);
  if (forbidden) {
    return { ok: false, error: forbidden };
  }

  const validation = validateAboutTeamMemberDraft(input);
  if (validation) {
    return { ok: false, error: validation };
  }

  const mediaAssetId =
    input.mediaAssetId === null || input.mediaAssetId === undefined
      ? null
      : String(input.mediaAssetId).trim();

  return {
    ok: true,
    name: String(input.name).trim(),
    role: String(input.role).trim(),
    description: String(input.description ?? "").trim(),
    mediaAssetId: mediaAssetId || null,
    sortOrder:
      input.sortOrder === undefined ? 0 : (input.sortOrder as number),
    published: Boolean(input.published),
  };
}

export async function updateAboutTeamSection(
  body: unknown,
  options: WriteOptions = {},
) {
  const validation = validateAboutTeamSectionDraft(body);
  if (validation) {
    return { ok: false as const, error: validation };
  }

  const content = normalizeAboutTeamSectionDraft(body);
  const section = await aboutTeamRepository.upsertAboutTeamSection(content);

  await recordAuditEntry({
    actor: options.actor,
    action: "updated",
    entityType: "about_team_section",
    entityId: "default",
    entityLabel: section.title,
  });

  return { ok: true as const, section };
}

export async function createAboutTeamMember(
  body: unknown,
  options: WriteOptions = {},
) {
  const parsed = parseMemberBody(body);
  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error };
  }

  const mediaError = await validateMediaAssetId(parsed.mediaAssetId);
  if (mediaError) {
    return { ok: false as const, error: mediaError };
  }

  const member = await aboutTeamRepository.createAboutTeamMember({
    id: `about-team-member-${randomUUID()}`,
    name: parsed.name,
    role: parsed.role,
    description: parsed.description,
    mediaAssetId: parsed.mediaAssetId,
    sortOrder: parsed.sortOrder,
    published: parsed.published,
  });

  await recordAuditEntry({
    actor: options.actor,
    action: "created",
    entityType: "about_team_member",
    entityId: member.id,
    entityLabel: member.name,
    metadata: { published: member.published },
  });

  return { ok: true as const, member };
}

export async function updateAboutTeamMember(
  id: string,
  body: unknown,
  options: WriteOptions = {},
) {
  const existing = await aboutTeamRepository.getAboutTeamMemberById(id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  const parsed = parseMemberBody(body);
  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error };
  }

  const mediaError = await validateMediaAssetId(parsed.mediaAssetId);
  if (mediaError) {
    return { ok: false as const, error: mediaError };
  }

  const member = await aboutTeamRepository.updateAboutTeamMember(id, {
    name: parsed.name,
    role: parsed.role,
    description: parsed.description,
    mediaAssetId: parsed.mediaAssetId,
    sortOrder: parsed.sortOrder,
    published: parsed.published,
  });

  const action =
    existing.published !== member.published ? "status_changed" : "updated";

  await recordAuditEntry({
    actor: options.actor,
    action,
    entityType: "about_team_member",
    entityId: member.id,
    entityLabel: member.name,
    metadata: {
      published: member.published,
      ...(action === "status_changed"
        ? { previousPublished: existing.published }
        : {}),
    },
  });

  return { ok: true as const, member };
}

export async function deleteAboutTeamMember(
  id: string,
  options: WriteOptions = {},
) {
  const existing = await aboutTeamRepository.getAboutTeamMemberById(id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  await aboutTeamRepository.deleteAboutTeamMember(id);

  await recordAuditEntry({
    actor: options.actor,
    action: "deleted",
    entityType: "about_team_member",
    entityId: id,
    entityLabel: existing.name,
  });

  return { ok: true as const };
}
