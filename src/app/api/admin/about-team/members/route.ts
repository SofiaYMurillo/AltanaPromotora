import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  createAboutTeamMember,
  getAdminAboutTeamBundle,
} from "@/backend/services/about-team-service";

export async function GET() {
  const auth = await requirePermission("page_content.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const bundle = await getAdminAboutTeamBundle();
    return NextResponse.json({ members: bundle.members });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const result = await createAboutTeamMember(body, {
      actor: auditActorFromUser(auth.context.user),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ member: result.member }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
