import type { ReactNode } from "react";

import { ProjectImage } from "./ProjectImage";

type ProjectContentProps = {
  title: string;
  image: {
    src: string;
    alt: string;
  };
  children: ReactNode;
};

export function ProjectContent({
  title,
  image,
  children,
}: ProjectContentProps) {
  return (
    <article className="flex flex-col gap-10">
      <header className="flex flex-col gap-8">
        <h2 className="text-heading-xl text-foreground">
          {title}
        </h2>

        <ProjectImage
          src={image.src}
          alt={image.alt}
        />
      </header>

      <div className="flex flex-col gap-6">
        {children}
      </div>
    </article>
  );
}
