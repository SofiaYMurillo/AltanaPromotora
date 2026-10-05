import type { TeamSectionData } from "../team.types";
import { teamSectionGridClass } from "./team-section-grid";
import { TeamMemberCard } from "./TeamMemberCard";

type AboutEquipoSectionProps = {
  data: TeamSectionData;
};

export function AboutEquipoSection({ data }: AboutEquipoSectionProps) {
  const hasMembers = data.members.length > 0;

  return (
    <section
      aria-labelledby="about-equipo-heading"
      className="border-t border-border/60 bg-background px-6 py-20 md:px-8 md:py-28"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
          <h2
            id="about-equipo-heading"
            className="font-display text-heading-lg text-foreground md:text-heading-xl"
          >
            {data.title}
          </h2>
          <div className="accent-rule-sm mx-auto" aria-hidden="true" />
          <p className="mt-6 text-body-md text-secondary md:text-body-lg">
            {data.description}
          </p>
        </div>

        {hasMembers ? (
          <ul className={teamSectionGridClass(data.members.length)}>
            {data.members.map((member) => (
              <li key={member.id} className="min-w-0">
                <TeamMemberCard member={member} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-auto mt-14 max-w-2xl border-t border-border/70 pt-10 text-center text-body-md text-secondary">
            {data.pendingMessage}
          </p>
        )}
      </div>
    </section>
  );
}
