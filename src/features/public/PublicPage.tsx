import type { ReactNode } from "react";

type PublicPageProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function PublicPage({
  title,
  description,
  eyebrow,
  children,
}: PublicPageProps) {
  return (
    <div className="container section-y-compact">
      <header className="max-w-3xl lg:max-w-4xl">
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <h1
          className={`text-display-lg text-foreground ${eyebrow ? "mt-5" : ""}`}
        >
          {title}
        </h1>
        <div className="accent-rule-sm" aria-hidden="true" />

        {description ? (
          <p className="mt-6 max-w-2xl text-body-md text-secondary md:text-body-lg">
            {description}
          </p>
        ) : null}
      </header>

      <div className="section-header-gap">
        {children}
      </div>
    </div>
  );
}
