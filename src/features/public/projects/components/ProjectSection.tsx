import type { ReactNode } from "react";

import { PublicCard } from "@/features/public";

type ProjectSectionProps = {
  title: string;
  children: ReactNode;
};

export function ProjectSection({
  title,
  children,
}: ProjectSectionProps) {
  return (
    <PublicCard>
      <div className="flex flex-col">
        <header className="border-b border-border pb-6">
          <h2 className="text-heading-lg text-foreground">
            {title}
          </h2>
        </header>

        <section className="pt-6">
          {children}
        </section>
      </div>
    </PublicCard>
  );
}
