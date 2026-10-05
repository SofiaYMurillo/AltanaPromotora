import { NextResponse } from "next/server";

import { requireClientsReadAccess } from "@/backend/services/authorize-service";
import { listClientsForAdmin } from "@/backend/services/client-service";

export async function GET() {
  const auth = await requireClientsReadAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const clients = await listClientsForAdmin();
  return NextResponse.json({ clients });
}
