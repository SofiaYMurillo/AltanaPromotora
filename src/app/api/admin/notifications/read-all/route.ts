import { NextResponse } from "next/server";

import { requireNotificationsAccess } from "@/backend/services/authorize-service";
import { markAllNotificationsReadForUser } from "@/backend/services/notification-service";

export async function POST() {
  const auth = await requireNotificationsAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await markAllNotificationsReadForUser(auth.context.user!.id);
  return NextResponse.json(result);
}
