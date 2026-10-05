import type { ReactNode } from "react";

type AdminPageProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminPage({ title, description, children }: AdminPageProps) {
  return (
    <div className="container py-8 md:py-10">
      <header>
        <h1 className="text-heading-lg text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 text-body-md text-muted">{description}</p>
        ) : null}
      </header>
      <div className="pt-8">{children}</div>
    </div>
  );
}
