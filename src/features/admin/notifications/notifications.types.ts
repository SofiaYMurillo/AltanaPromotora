import type { InternalNotification } from "@/domain";

export interface NotificationsPageData {
  notifications: InternalNotification[];
  unreadCount: number;
}
