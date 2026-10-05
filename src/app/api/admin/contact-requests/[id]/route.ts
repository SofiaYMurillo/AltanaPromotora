import { NextResponse } from "next/server";

import {
  requireContactRequestsReadAccess,
  requireContactRequestsWriteAccess,
} from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  getAdminContactRequest,
  parseAdminContactRequestStatusPatch,
  updateContactRequestStatus,
} from "@/backend/services/contact-request-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function statusForError(error: string) {
  switch (error) {
    case "not_found":
      return 404;
    case "invalid_transition":
      return 400;
    default:
      return 400;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireContactRequestsReadAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const contactRequest = await getAdminContactRequest(id);
    if (!contactRequest) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ contactRequest });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const forwarded = request.headers.get("x-forwarded-for");
  const auth = await requireContactRequestsWriteAccess({
    ipReference: forwarded?.split(",")[0]?.trim() || undefined,
    userAgentReference: request.headers.get("user-agent") ?? undefined,
    route: `/api/admin/contact-requests/${id}`,
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

  const parsed = parseAdminContactRequestStatusPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await updateContactRequestStatus(id, parsed.status, {
      actor: auditActorFromUser(auth.context.user),
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: statusForError(result.error) },
      );
    }
    return NextResponse.json({ contactRequest: result.contactRequest });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
