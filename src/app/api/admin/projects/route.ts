import { NextResponse } from "next/server";

import {
  requireCatalogReadAccess,
  requireCatalogWriteAccess,
} from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  createProject,
  listAdminProjects,
} from "@/backend/services/project-service";

export async function GET() {
  const auth = await requireCatalogReadAccess("projects.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const projects = await listAdminProjects();
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const auth = await requireCatalogWriteAccess("projects.manage", {
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: request.headers.get("user-agent") ?? undefined,
    route: "/api/admin/projects",
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
    const result = await createProject(body, {
      actor: auditActorFromUser(auth.context.user),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ project: result.project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
