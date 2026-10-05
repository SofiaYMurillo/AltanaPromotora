import Link from "next/link";

import type { FeaturedProjectsData } from "./projects.types";

type ProjectsProps = {
  data: FeaturedProjectsData;
};

export function Projects({ data }: ProjectsProps) {
  return (
    <section
      aria-labelledby="featured-projects-heading"
      className="flex min-h-[70vh] items-center bg-primary py-24 md:min-h-[85vh] md:py-32 lg:min-h-[90vh]"
    >
      <div className="container flex justify-center">
        <div className="portfolio-panel flex w-full max-w-[42rem] flex-col items-center border border-accent px-8 py-12 text-center md:px-14 md:py-[4.5rem]">
          <p className="text-[0.85rem] font-semibold uppercase tracking-[0.2em] text-accent">
            {data.eyebrow}
          </p>
          <h2
            id="featured-projects-heading"
            className="mt-4 font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-normal leading-[1.25] text-background"
          >
            {data.title}
          </h2>
          <div
            className="mt-6 h-px w-16 bg-accent"
            aria-hidden="true"
          />
          <p className="mt-6 max-w-lg text-body-md font-light text-on-primary-muted md:text-[1.1rem]">
            {data.description}
          </p>
          <Link
            href={data.primaryCta.href}
            className="btn-primary mt-8 md:mt-10"
          >
            {data.primaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
