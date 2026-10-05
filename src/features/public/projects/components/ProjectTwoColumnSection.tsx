import type { ReactNode } from "react";

type ProjectTwoColumnSectionProps = {
  image: ReactNode;
  content: ReactNode;
};

export function ProjectTwoColumnSection({
  image,
  content,
}: ProjectTwoColumnSectionProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      {image}
      {content}
    </div>
  );
}
