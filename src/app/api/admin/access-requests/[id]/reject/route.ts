import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { rejectAccessRequest } from "@/backend/services/access-request-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePermission("users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const result = await rejectAccessRequest({
    requestId: id,
    actorUserId: auth.context.user!.id,
  });

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ request: result.request });
}
