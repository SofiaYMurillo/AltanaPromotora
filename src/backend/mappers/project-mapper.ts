import type { Project, ProjectSection } from "@/domain";
import type { Project as ProjectRow } from "@/generated/prisma/client";

function parseSections(value: string): ProjectSection[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as ProjectSection[]) : [];
  } catch {
    return [];
  }
}

export function toDomainProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    image: {
      src: row.imageSrc,
      alt: row.imageAlt,
    },
    sections: parseSections(row.sectionsJson),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPrismaProjectData(project: Project) {
  return {
    id: project.id,
    title: project.title,
    imageSrc: project.image.src,
    imageAlt: project.image.alt,
    sectionsJson: JSON.stringify(project.sections),
    active: project.active,
  };
}
