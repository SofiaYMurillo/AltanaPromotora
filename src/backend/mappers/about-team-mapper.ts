import type { AboutTeamMemberRecord, AboutTeamSectionContent } from "@/domain";
import type {
  AboutTeamMember as AboutTeamMemberRow,
  AboutTeamSection as AboutTeamSectionRow,
} from "@/generated/prisma/client";

export function toDomainAboutTeamSection(
  row: AboutTeamSectionRow,
): AboutTeamSectionContent {
  return {
    title: row.title,
    description: row.description,
    pendingMessage: row.pendingMessage,
  };
}

export function toDomainAboutTeamMember(
  row: AboutTeamMemberRow,
): AboutTeamMemberRecord {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    description: row.description,
    mediaAssetId: row.mediaAssetId,
    sortOrder: row.sortOrder,
    published: row.published,
  };
}
