import type { AboutTeamSectionContent } from "@/domain";

import { prisma } from "../db";
import {
  toDomainAboutTeamMember,
  toDomainAboutTeamSection,
} from "../mappers/about-team-mapper";

export async function getAboutTeamSection() {
  const row = await prisma.aboutTeamSection.findUnique({
    where: { id: "default" },
  });
  return row ? toDomainAboutTeamSection(row) : null;
}

export async function upsertAboutTeamSection(content: AboutTeamSectionContent) {
  const row = await prisma.aboutTeamSection.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      title: content.title,
      description: content.description,
      pendingMessage: content.pendingMessage,
      updatedAt: new Date(),
    },
    update: {
      title: content.title,
      description: content.description,
      pendingMessage: content.pendingMessage,
      updatedAt: new Date(),
    },
  });
  return toDomainAboutTeamSection(row);
}

export async function listAboutTeamMembersAdmin() {
  const rows = await prisma.aboutTeamMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toDomainAboutTeamMember);
}

export async function listPublishedAboutTeamMembers() {
  const rows = await prisma.aboutTeamMember.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toDomainAboutTeamMember);
}

export async function getAboutTeamMemberById(id: string) {
  const row = await prisma.aboutTeamMember.findUnique({ where: { id } });
  return row ? toDomainAboutTeamMember(row) : null;
}

export async function createAboutTeamMember(input: {
  id: string;
  name: string;
  role: string;
  description: string;
  mediaAssetId: string | null;
  sortOrder: number;
  published: boolean;
}) {
  const row = await prisma.aboutTeamMember.create({
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
  return toDomainAboutTeamMember(row);
}

export async function updateAboutTeamMember(
  id: string,
  input: {
    name: string;
    role: string;
    description: string;
    mediaAssetId: string | null;
    sortOrder: number;
    published: boolean;
  },
) {
  const row = await prisma.aboutTeamMember.update({
    where: { id },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
  return toDomainAboutTeamMember(row);
}

export async function deleteAboutTeamMember(id: string) {
  await prisma.aboutTeamMember.delete({ where: { id } });
}
