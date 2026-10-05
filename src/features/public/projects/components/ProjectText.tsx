import type { ReactNode } from "react";

type ProjectTextProps = {
  children: ReactNode;
};

export function ProjectText({
  children,
}: ProjectTextProps) {
  return (
    <p className="text-body-md leading-relaxed text-muted">
      {children}
    </p>
  );
}
