export type AppointmentEntryChoice = "office" | "property";

type AppointmentTypeSelectorProps = {
  onChooseOffice: () => void;
  onChooseProperty: () => void;
};

export function AppointmentTypeSelector({
  onChooseOffice,
  onChooseProperty,
}: AppointmentTypeSelectorProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <article className="flex flex-col gap-4 rounded-lg border border-border/70 bg-background/40 p-6 md:p-8">
        <h2 className="font-display text-heading-sm text-foreground">
          Visita a oficina
        </h2>
        <p className="flex-1 text-body-md text-secondary">
          Agenda un espacio para conversar con nuestro equipo y conocer más
          sobre nuestros proyectos.
        </p>
        <button type="button" className="btn-primary w-fit" onClick={onChooseOffice}>
          Elegir
        </button>
      </article>

      <article className="flex flex-col gap-4 rounded-lg border border-border/70 bg-background/40 p-6 md:p-8">
        <h2 className="font-display text-heading-sm text-foreground">
          Visitar un inmueble
        </h2>
        <p className="flex-1 text-body-md text-secondary">
          Explora nuestros inmuebles disponibles y encuentra el espacio que
          deseas conocer.
        </p>
        <button
          type="button"
          className="btn-primary-outline w-fit"
          onClick={onChooseProperty}
        >
          Ver inmuebles
        </button>
      </article>
    </div>
  );
}
