type AdminPermissionDeniedProps = {
  title?: string;
  description?: string;
};

/**
 * Shown inside the admin shell when the session is valid but the page permission is missing.
 */
export function AdminPermissionDenied({
  title = "Acceso no disponible",
  description = "No tienes autorización para ver esta sección del panel.",
}: AdminPermissionDeniedProps) {
  return (
    <section
      className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6 md:p-10"
      aria-labelledby="admin-permission-denied-title"
    >
      <h1
        id="admin-permission-denied-title"
        className="text-heading-md text-foreground"
      >
        {title}
      </h1>
      <p className="text-body-md text-muted">{description}</p>
      <p className="text-body-sm text-muted" role="status">
        Si necesitas acceso, solicítalo al administrador principal de ALTANA
        PROMOTORA.
      </p>
    </section>
  );
}
