import { SectionBackgroundMedia } from "@/frontend/components/common/SectionBackgroundMedia";
import type { ResolvedSectionBackground } from "@/domain/media";

import type { ProjectsPageEditorial } from "../projects.types";

type ProjectsEditorialHeaderProps = {
  header: ProjectsPageEditorial["header"];
  cmsBackground?: ResolvedSectionBackground;
};

export function ProjectsEditorialHeader({
  header,
  cmsBackground,
}: ProjectsEditorialHeaderProps) {
  const background = cmsBackground ?? { type: "none" as const };

  return (
    <section
      aria-labelledby="projects-hero-heading"
      className="relative isolate overflow-hidden px-6 py-20 md:px-10 md:py-28 lg:py-32"
    >
      <div className="absolute inset-0">
        <SectionBackgroundMedia background={background} sizes="100vw" />
        {background.type === "none" ? (
          <div className="absolute inset-0 bg-primary" aria-hidden="true" />
        ) : null}
      </div>
      {(background.type === "none" ||
        background.type === "image" ||
        background.type === "video") && (
        <div
          className="absolute inset-0 bg-[rgb(25_28_33/0.55)]"
          aria-hidden="true"
        />
      )}
      <div className="container relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-5 lg:col-start-8 lg:text-right">
            <p className="section-eyebrow text-accent">{header.eyebrow}</p>
          </div>
          <div className="lg:col-span-7 lg:row-start-1 lg:col-start-1">
            <h1
              id="projects-hero-heading"
              className="font-display text-[clamp(2.5rem,1.4rem+4vw,4.25rem)] font-normal leading-[1.05] text-background"
            >
              {header.title}
            </h1>
            <div className="mt-8 h-0.5 w-24 bg-accent lg:mt-10" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
