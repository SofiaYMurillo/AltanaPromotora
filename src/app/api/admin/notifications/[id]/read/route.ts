import { NextResponse } from "next/server";

import { requireNotificationsAccess } from "@/backend/services/authorize-service";
import { markNotificationReadForUser } from "@/backend/services/notification-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const auth = await requireNotificationsAccess();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const result = await markNotificationReadForUser({
    notificationId: id,
    recipientUserId: auth.context.user!.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    notification: result.notification,
    unreadCount: result.unreadCount,
  });
}
