import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  getAdminAboutTeamBundle,
  updateAboutTeamSection,
} from "@/backend/services/about-team-service";

export async function GET() {
  const auth = await requirePermission("page_content.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const bundle = await getAdminAboutTeamBundle();
    return NextResponse.json({ section: bundle.section });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requirePermission("page_content.manage");
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
    const result = await updateAboutTeamSection(body, {
      actor: auditActorFromUser(auth.context.user),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ section: result.section });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
