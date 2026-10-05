type CatalogStatusBadgeProps = {
  active: boolean;
};

export function CatalogStatusBadge({ active }: CatalogStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-2 py-1 text-label ${
        active
          ? "border-accent bg-background text-foreground"
          : "border-border bg-surface text-muted"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
