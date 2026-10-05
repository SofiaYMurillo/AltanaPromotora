import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { listAccessRequests } from "@/backend/services/access-request-service";

export async function GET() {
  const auth = await requirePermission("users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const accessRequests = await listAccessRequests();
  return NextResponse.json({ accessRequests });
}
