import { randomUUID } from "node:crypto";

import {
  normalizeCatalogTitle,
  normalizeProjectSections,
  validateProjectDraft,
} from "@/domain";
import type {
  CatalogImage,
  CatalogValidationError,
  Project,
  ProjectSection,
} from "@/domain";

import type { AuditActor } from "@/domain";

import * as projectRepository from "../repositories/project-repository";
import { recordAuditEntry } from "./audit-service";
import { revalidatePublicCatalog } from "./catalog-public-cache";

export type CatalogWriteOptions = {
  actor?: AuditActor | null;
};

const FORBIDDEN_PROJECT_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "userId",
  "appointmentCount",
  "clientId",
  "assignedWorkerId",
  "capacity",
  "sessionId",
  "securityEventId",
]);

const ALLOWED_PROJECT_FIELDS = new Set([
  "title",
  "image",
  "sections",
  "active",
]);

export type ProjectWriteError =
  | CatalogValidationError
  | "not_found"
  | "invalid_body";

function rejectForbiddenFields(body: Record<string, unknown>) {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_PROJECT_FIELDS.has(key) || !ALLOWED_PROJECT_FIELDS.has(key)) {
      return "forbidden_field" as const;
    }
  }
  return null;
}

export function parseProjectWriteInput(body: unknown):
  | {
      ok: true;
      title: string;
      image: CatalogImage;
      sections: ProjectSection[];
      active: boolean;
    }
  | { ok: false; error: ProjectWriteError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const input = body as Record<string, unknown>;
  const forbidden = rejectForbiddenFields(input);
  if (forbidden) {
    return { ok: false, error: forbidden };
  }

  const validation = validateProjectDraft(input);
  if (validation) {
    return { ok: false, error: validation };
  }

  const sections = normalizeProjectSections(input.sections as ProjectSection[]);

  return {
    ok: true,
    title: normalizeCatalogTitle(input.title as string),
    image: {
      src: (input.image as CatalogImage).src,
      alt: (input.image as CatalogImage).alt.trim(),
    },
    sections,
    active: input.active as boolean,
  };
}

export async function listAdminProjects() {
  return projectRepository.listProjects();
}

export async function listPublicProjects() {
  return projectRepository.listActiveProjects();
}

export async function getAdminProject(id: string) {
  return projectRepository.getProjectById(id);
}

export async function getPublicProject(id: string) {
  const project = await projectRepository.getProjectById(id);
  return project?.active ? project : null;
}

export async function createProject(
  body: unknown,
  options: CatalogWriteOptions = {},
) {
  const parsed = parseProjectWriteInput(body);
  if (!parsed.ok) {
    return parsed;
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: `project-${randomUUID()}`,
    title: parsed.title,
    image: parsed.image,
    sections: parsed.sections,
    active: parsed.active,
    createdAt: now,
    updatedAt: now,
  };

  const created = await projectRepository.createProject(project);

  await recordAuditEntry({
    actor: options.actor,
    action: "created",
    entityType: "project",
    entityId: created.id,
    entityLabel: created.title,
    metadata: { active: created.active },
  });

  await revalidatePublicCatalog({ projectId: created.id });

  return { ok: true as const, project: created };
}

export async function updateProject(
  id: string,
  body: unknown,
  options: CatalogWriteOptions = {},
) {
  const existing = await projectRepository.getProjectById(id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  const parsed = parseProjectWriteInput(body);
  if (!parsed.ok) {
    return parsed;
  }

  const updated = await projectRepository.updateProject({
    ...existing,
    title: parsed.title,
    image: parsed.image,
    sections: parsed.sections,
    active: parsed.active,
  });

  if (!updated) {
    return { ok: false as const, error: "not_found" as const };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "updated",
    entityType: "project",
    entityId: updated.id,
    entityLabel: updated.title,
    metadata: {
      previousTitle: existing.title,
      active: updated.active,
    },
  });

  await revalidatePublicCatalog({ projectId: updated.id });

  return { ok: true as const, project: updated };
}

export async function updateProjectStatus(
  id: string,
  active: boolean,
  options: CatalogWriteOptions = {},
) {
  if (typeof active !== "boolean") {
    return { ok: false as const, error: "invalid_active" as const };
  }

  const updated = await projectRepository.updateProjectActive(id, active);
  if (!updated) {
    return { ok: false as const, error: "not_found" as const };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "status_changed",
    entityType: "project",
    entityId: updated.id,
    entityLabel: updated.title,
    metadata: { active: updated.active },
  });

  await revalidatePublicCatalog({ projectId: updated.id });

  return { ok: true as const, project: updated };
}

export async function countProjects() {
  return projectRepository.countProjects();
}
