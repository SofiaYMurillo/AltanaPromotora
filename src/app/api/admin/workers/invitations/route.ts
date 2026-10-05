import { NextResponse } from "next/server";

import { auditActorFromUser } from "@/backend/services/audit-service";
import { requirePermission } from "@/backend/services/authorize-service";
import {
  createInvitation,
  listInvitations,
} from "@/backend/services/worker-invitation-service";

export async function GET() {
  const auth = await requirePermission("users.manage");

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const invitations = await listInvitations();
  return NextResponse.json({ invitations });
}

export async function POST(request: Request) {
  const auth = await requirePermission("users.manage");

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = body as {
    email?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    permissionNames?: string[];
  };

  if (!input.email?.trim() || !input.roleId?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await createInvitation({
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    roleId: input.roleId,
    permissionNames: input.permissionNames,
    invitedByUserId: auth.context.user!.id,
    actor: auditActorFromUser(auth.context.user),
  });

  if (!result.ok) {
    const status = result.error === "invalid_email" ? 400 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }

  const payload: Record<string, unknown> = {
    invitation: result.invitation,
    email: result.email,
  };

  if (
    process.env.NODE_ENV !== "production" ||
    result.email.status === "simulated" ||
    result.email.status === "failed"
  ) {
    payload.devCode = result.code;
  }

  return NextResponse.json(payload, { status: 201 });
}
