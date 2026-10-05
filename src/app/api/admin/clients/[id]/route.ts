import { NextResponse } from "next/server";

import { requireClientsReadAccess } from "@/backend/services/authorize-service";
import { getClientDetailForAdmin } from "@/backend/services/client-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireClientsReadAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const detail = await getClientDetailForAdmin(id);

  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
