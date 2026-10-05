export const ABOUT_TEAM_SECTION_ID = "default";

export const ABOUT_TEAM_SECTION_FIELD_LIMITS = {
  title: 120,
  description: 600,
  pendingMessage: 600,
  memberName: 120,
  memberRole: 120,
  memberDescription: 800,
} as const;

export type AboutTeamSectionContent = {
  title: string;
  description: string;
  pendingMessage: string;
};

export type AboutTeamMemberRecord = {
  id: string;
  name: string;
  role: string;
  description: string;
  mediaAssetId: string | null;
  sortOrder: number;
  published: boolean;
};

export type PublicAboutTeamMember = {
  id: string;
  name: string;
  role: string;
  description?: string;
  image?: { src: string; alt: string };
};

export type PublicAboutTeamSection = {
  title: string;
  description: string;
  pendingMessage: string;
  members: PublicAboutTeamMember[];
};

export type AboutTeamSectionValidationError =
  | "invalid_body"
  | "invalid_title"
  | "invalid_description"
  | "invalid_pending_message";

export type AboutTeamMemberValidationError =
  | "invalid_body"
  | "invalid_name"
  | "invalid_role"
  | "invalid_description"
  | "invalid_sort_order"
  | "invalid_media_asset";

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateAboutTeamSectionDraft(
  input: unknown,
): AboutTeamSectionValidationError | null {
  if (!input || typeof input !== "object") {
    return "invalid_body";
  }

  const title = asTrimmedString((input as { title?: unknown }).title);
  const description = asTrimmedString(
    (input as { description?: unknown }).description,
  );
  const pendingMessage = asTrimmedString(
    (input as { pendingMessage?: unknown }).pendingMessage,
  );

  if (!title || title.length > ABOUT_TEAM_SECTION_FIELD_LIMITS.title) {
    return "invalid_title";
  }
  if (
    !description ||
    description.length > ABOUT_TEAM_SECTION_FIELD_LIMITS.description
  ) {
    return "invalid_description";
  }
  if (
    !pendingMessage ||
    pendingMessage.length > ABOUT_TEAM_SECTION_FIELD_LIMITS.pendingMessage
  ) {
    return "invalid_pending_message";
  }

  return null;
}

export function normalizeAboutTeamSectionDraft(
  input: unknown,
): AboutTeamSectionContent {
  const body = input as {
    title: string;
    description: string;
    pendingMessage: string;
  };
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    pendingMessage: body.pendingMessage.trim(),
  };
}

export function validateAboutTeamMemberDraft(
  input: unknown,
  options: { requireMedia?: boolean } = {},
): AboutTeamMemberValidationError | null {
  if (!input || typeof input !== "object") {
    return "invalid_body";
  }

  const record = input as Record<string, unknown>;
  const name = asTrimmedString(record.name);
  const role = asTrimmedString(record.role);
  const description = asTrimmedString(record.description);
  const sortOrder = record.sortOrder;
  const mediaAssetId =
    record.mediaAssetId === null || record.mediaAssetId === undefined
      ? null
      : asTrimmedString(record.mediaAssetId);

  if (!name || name.length > ABOUT_TEAM_SECTION_FIELD_LIMITS.memberName) {
    return "invalid_name";
  }
  if (!role || role.length > ABOUT_TEAM_SECTION_FIELD_LIMITS.memberRole) {
    return "invalid_role";
  }
  if (description.length > ABOUT_TEAM_SECTION_FIELD_LIMITS.memberDescription) {
    return "invalid_description";
  }
  if (
    sortOrder !== undefined &&
    (!Number.isInteger(sortOrder) || (sortOrder as number) < 0)
  ) {
    return "invalid_sort_order";
  }
  if (options.requireMedia && !mediaAssetId) {
    return "invalid_media_asset";
  }
  if (
    mediaAssetId !== null &&
    mediaAssetId !== undefined &&
    mediaAssetId.length === 0
  ) {
    return "invalid_media_asset";
  }

  return null;
}
