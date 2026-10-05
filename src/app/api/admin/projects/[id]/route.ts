import { NextResponse } from "next/server";

import {
  requireCatalogReadAccess,
  requireCatalogWriteAccess,
} from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  getAdminProject,
  updateProject,
  updateProjectStatus,
} from "@/backend/services/project-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function statusForError(error: string) {
  return error === "not_found" ? 404 : 400;
}

function isStatusOnlyPatch(body: unknown): body is { active: boolean } {
  return (
    Boolean(body) &&
    typeof body === "object" &&
    Object.keys(body as object).length === 1 &&
    typeof (body as { active?: unknown }).active === "boolean"
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireCatalogReadAccess("projects.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const project = await getAdminProject(id);
    if (!project) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const forwarded = request.headers.get("x-forwarded-for");
  const auth = await requireCatalogWriteAccess("projects.manage", {
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: request.headers.get("user-agent") ?? undefined,
    route: `/api/admin/projects/${id}`,
  });

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const options = { actor: auditActorFromUser(auth.context.user) };
    const result = isStatusOnlyPatch(body)
      ? await updateProjectStatus(id, body.active, options)
      : await updateProject(id, body, options);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: statusForError(result.error) },
      );
    }

    return NextResponse.json({ project: result.project });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
