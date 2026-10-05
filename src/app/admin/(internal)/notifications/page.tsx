import { NotificationsPage } from "@/features/admin/notifications";
import { getNotificationsPageData } from "@/features/admin/notifications/notifications.data";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";

export default async function NotificationsRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.notifications,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const data = await getNotificationsPageData(access.context.user!.id);

  return <NotificationsPage data={data} />;
}
