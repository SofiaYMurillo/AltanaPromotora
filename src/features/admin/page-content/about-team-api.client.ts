import type { AboutTeamSectionContent } from "@/domain";

export type AdminAboutTeamMemberView = {
  id: string;
  name: string;
  role: string;
  description: string;
  mediaAssetId: string | null;
  sortOrder: number;
  published: boolean;
  image: { src: string; alt: string } | null;
};

export async function saveAboutTeamSectionRequest(
  section: AboutTeamSectionContent,
) {
  const response = await fetch("/api/admin/about-team/section", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(section),
  });
  return response.ok;
}

export async function fetchAboutTeamMembersRequest() {
  const response = await fetch("/api/admin/about-team/members");
  if (!response.ok) {
    return { ok: false as const };
  }
  const payload = (await response.json()) as {
    members: AdminAboutTeamMemberView[];
  };
  return { ok: true as const, members: payload.members };
}

export async function createAboutTeamMemberRequest(input: {
  name: string;
  role: string;
  description: string;
  mediaAssetId: string | null;
  sortOrder: number;
  published: boolean;
}) {
  const response = await fetch("/api/admin/about-team/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    return { ok: false as const };
  }
  const payload = (await response.json()) as {
    member: Omit<AdminAboutTeamMemberView, "image">;
  };
  return { ok: true as const, member: payload.member };
}

export async function updateAboutTeamMemberRequest(
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
  const response = await fetch(`/api/admin/about-team/members/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return response.ok;
}

export async function deleteAboutTeamMemberRequest(id: string) {
  const response = await fetch(`/api/admin/about-team/members/${id}`, {
    method: "DELETE",
  });
  return response.ok;
}
