import { listNotificationsForUser } from "@/backend/services/notification-service";

import type { NotificationsPageData } from "./notifications.types";

export async function getNotificationsPageData(
  recipientUserId: string,
): Promise<NotificationsPageData> {
  return listNotificationsForUser(recipientUserId);
}
