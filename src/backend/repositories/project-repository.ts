import type { Project } from "@/domain";

import { prisma } from "../db";
import {
  toDomainProject,
  toPrismaProjectData,
} from "../mappers/project-mapper";

export async function listProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    orderBy: { title: "asc" },
  });
  return rows.map(toDomainProject);
}

export async function listActiveProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: { active: true },
    orderBy: { title: "asc" },
  });
  return rows.map(toDomainProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({ where: { id } });
  return row ? toDomainProject(row) : null;
}

export async function createProject(project: Project): Promise<Project> {
  const row = await prisma.project.create({
    data: toPrismaProjectData(project),
  });
  return toDomainProject(row);
}

export async function updateProject(project: Project): Promise<Project | null> {
  const existing = await prisma.project.findUnique({ where: { id: project.id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.project.update({
    where: { id: project.id },
    data: toPrismaProjectData(project),
  });
  return toDomainProject(row);
}

export async function updateProjectActive(id: string, active: boolean) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.project.update({
    where: { id },
    data: { active },
  });
  return toDomainProject(row);
}

export async function countProjects() {
  return prisma.project.count();
}
