import type { ReactNode } from "react";

type ProjectSectionSubtitleProps = {
  children: ReactNode;
};

export function ProjectSectionSubtitle({
  children,
}: ProjectSectionSubtitleProps) {
  return (
    <p className="text-body-lg text-foreground">
      {children}
    </p>
  );
}
