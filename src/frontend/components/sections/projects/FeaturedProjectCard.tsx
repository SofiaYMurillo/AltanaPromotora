import Link from "next/link";

import { CoverImage } from "@/frontend/components/common/CoverImage";

import type { FeaturedProjectCardData } from "./projects.types";

type FeaturedProjectCardProps = {
  project: FeaturedProjectCardData;
};

export function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[5/4] overflow-hidden rounded-md md:aspect-[4/3]">
        <CoverImage
          src={project.image.src}
          alt={project.image.alt}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col pt-5 md:pt-6">
        <h3 className="text-heading-sm text-background">{project.title}</h3>
        <p className="mt-2 text-body-sm text-on-primary-muted">
          {project.location}
        </p>
        <p className="mt-3 text-body-md text-accent md:mt-4">{project.priceLabel}</p>
        <div className="accent-rule-sm" aria-hidden="true" />
        <Link
          href={project.href}
          className="link-editorial link-editorial-inverse mt-5"
        >
          Ver proyecto →
        </Link>
      </div>
    </article>
  );
}
