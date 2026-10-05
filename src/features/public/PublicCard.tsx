import type { ReactNode } from "react";

type PublicCardProps = {
  children: ReactNode;
};

export function PublicCard({ children }: PublicCardProps) {
  return (
    <section className="py-2">
      {children}
    </section>
  );
}
