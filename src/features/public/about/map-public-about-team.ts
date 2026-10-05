import type { PublicAboutTeamSection } from "@/domain";

import type { TeamSectionData } from "./team.types";

/** Public CMS → About presentation (no persistence or admin fields). */
export function mapPublicAboutTeamSection(
  section: PublicAboutTeamSection,
): TeamSectionData {
  return {
    title: section.title,
    description: section.description,
    pendingMessage: section.pendingMessage,
    members: section.members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      description: member.description,
      image: member.image,
    })),
  };
}
