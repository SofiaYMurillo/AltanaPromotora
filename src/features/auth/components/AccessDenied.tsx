type AccessDeniedProps = {
  title?: string;
  description?: string;
};

export function AccessDenied({
  title = "Acceso no disponible",
  description = "No tienes autorización para entrar a esta área interna.",
}: AccessDeniedProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section
        className="flex w-full max-w-lg flex-col gap-4 rounded-md border border-border bg-surface p-6 shadow-sm"
        aria-labelledby="access-denied-title"
      >
        <h1
          id="access-denied-title"
          className="text-heading-md text-foreground"
        >
          {title}
        </h1>
        <p className="text-body-md text-muted">{description}</p>
        <p className="text-body-sm text-muted" role="status">
          Si crees que esto es un error, contacta al administrador principal de
          ALTANA PROMOTORA.
        </p>
        <a
          href="/admin/login"
          className="inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Ir al acceso interno
        </a>
      </section>
    </main>
  );
}
