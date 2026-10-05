import { CoverImage } from "@/frontend/components/common/CoverImage";

import type { TeamMember } from "../team.types";

type TeamMemberCardProps = {
  member: TeamMember;
};

function memberInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "A";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const displayName = member.name.trim() || "Integrante Altana";
  const displayRole = member.role.trim() || "Equipo ALTANA";

  return (
    <article className="about-team-card group flex h-full flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/10">
        {member.image ? (
          <CoverImage
            src={member.image.src}
            alt={member.image.alt || displayName}
            sizes="(max-width: 768px) min(92vw, 22rem), (max-width: 1280px) 45vw, 22rem"
            className="transition-transform duration-[680ms] ease-out group-hover:scale-[1.015]"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/10 px-4 text-center"
            aria-hidden="true"
          >
            <span className="font-display text-[clamp(2rem,1.5rem+1.5vw,2.75rem)] tracking-[0.08em] text-secondary/35">
              {memberInitials(displayName)}
            </span>
          </div>
        )}
        {!member.image ? (
          <span className="sr-only">{displayName}</span>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-start">
        <div
          className="about-team-card-rule mb-4 h-px w-10 bg-accent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        <h3 className="font-display text-heading-sm text-foreground md:text-heading-md">
          {displayName}
        </h3>
        <p className="mt-2 text-body-sm uppercase tracking-[0.12em] text-secondary">
          {displayRole}
        </p>
        {member.description ? (
          <p className="mt-4 text-body-sm leading-relaxed text-secondary">
            {member.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
