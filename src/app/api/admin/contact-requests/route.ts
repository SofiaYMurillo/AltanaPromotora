import { NextResponse } from "next/server";

import { requireContactRequestsReadAccess } from "@/backend/services/authorize-service";
import { listAdminContactRequests } from "@/backend/services/contact-request-service";

export async function GET(request: Request) {
  const auth = await requireContactRequestsReadAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);

  try {
    const contactRequests = await listAdminContactRequests(
      searchParams.get("search") ?? undefined,
    );
    return NextResponse.json({ contactRequests });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
