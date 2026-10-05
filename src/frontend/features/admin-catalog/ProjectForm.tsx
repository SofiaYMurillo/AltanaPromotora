import type { CatalogImage, Project, ProjectSection } from "@/domain";

import { MediaField } from "@/features/admin/media";

export type ProjectFormValue = {
  title: string;
  image: CatalogImage;
  sections: ProjectSection[];
  active: boolean;
};

type ProjectFormProps = {
  value: ProjectFormValue;
  onChange: (value: ProjectFormValue) => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
};

const fieldClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const buttonClassName =
  "inline-flex w-fit items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-label text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function emptyProjectForm(): ProjectFormValue {
  return {
    title: "",
    image: { src: "/images/projects-placeholder.jpg", alt: "" },
    sections: [],
    active: true,
  };
}

export function projectToForm(project: Project): ProjectFormValue {
  return {
    title: project.title,
    image: project.image,
    sections: project.sections,
    active: project.active,
  };
}

export function ProjectForm({
  value,
  onChange,
  onSubmit,
  isSaving,
  submitLabel,
}: ProjectFormProps) {
  function updateSection(index: number, patch: Partial<ProjectSection>) {
    onChange({
      ...value,
      sections: value.sections.map((section, current) =>
        current === index ? { ...section, ...patch } : section,
      ),
    });
  }

  return (
    <form
      className="flex flex-col gap-10"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <section className="flex flex-col gap-6" aria-labelledby="project-general-heading">
        <div>
          <h2 id="project-general-heading" className="text-heading-sm text-foreground">
            Información general
          </h2>
          <p className="mt-1 text-body-sm text-muted">
            Datos del desarrollo inmobiliario. No configuran la página pública
            `/projects`.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="field-label">Título del desarrollo</span>
          <input
            className={fieldClassName}
            value={value.title}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            required
          />
        </label>

        <MediaField
          label="Imagen principal del desarrollo"
          value={value.image}
          onChange={(image) => onChange({ ...value, image })}
          accept="image"
        />

        <label className="flex items-center gap-3 text-body-sm text-foreground">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(event) =>
              onChange({ ...value, active: event.target.checked })
            }
          />
          Proyecto publicado (desarrollo visible en catálogo)
        </label>
      </section>

      <section
        className="flex flex-col gap-4 border-t border-border/60 pt-8"
        aria-labelledby="project-development-content-heading"
      >
        <div>
          <h2
            id="project-development-content-heading"
            className="text-heading-sm text-foreground"
          >
            Contenido del desarrollo
          </h2>
          <p className="mt-1 text-body-sm text-muted">
            Bloques informativos del proyecto (historia, amenidades, ubicación…).
            Son contenido del desarrollo, no secciones de la página del sitio.
          </p>
        </div>

        {value.sections.map((section, index) => (
          <div
            key={`${section.title}-${index}`}
            className="flex flex-col gap-3 rounded-md border border-border p-4"
          >
            <p className="text-caption uppercase tracking-[0.14em] text-accent">
              Bloque {index + 1}
            </p>
            <label className="flex flex-col gap-2">
              <span className="field-label">Título</span>
              <input
                className={fieldClassName}
                value={section.title}
                onChange={(event) =>
                  updateSection(index, { title: event.target.value })
                }
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label">Subtítulo (opcional)</span>
              <input
                className={fieldClassName}
                value={section.subtitle ?? ""}
                onChange={(event) =>
                  updateSection(index, {
                    subtitle: event.target.value || undefined,
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label">Descripción</span>
              <textarea
                className={fieldClassName}
                rows={4}
                value={section.description}
                onChange={(event) =>
                  updateSection(index, { description: event.target.value })
                }
              />
            </label>
            <MediaField
              label="Imagen del bloque"
              value={section.image}
              onChange={(image) => updateSection(index, { image })}
              accept="image"
            />
            <button
              type="button"
              className={buttonClassName}
              onClick={() =>
                onChange({
                  ...value,
                  sections: value.sections.filter((_, current) => current !== index),
                })
              }
            >
              Quitar bloque
            </button>
          </div>
        ))}
        <button
          type="button"
          className={buttonClassName}
          onClick={() =>
            onChange({
              ...value,
              sections: [
                ...value.sections,
                {
                  title: "",
                  description: "",
                  image: { src: "", alt: "" },
                },
              ],
            })
          }
        >
          Agregar bloque de contenido
        </button>
      </section>

      <button type="submit" className="btn-primary w-fit" disabled={isSaving}>
        {isSaving ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
