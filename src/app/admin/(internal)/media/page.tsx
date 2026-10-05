import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { MediaLibraryPage } from "@/features/admin/media";

export default async function AdminMediaRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.media,
    },
    deniedDescription: "No tienes permiso para gestionar multimedia.",
  });
  if (!access.allowed) {
    return access.element;
  }

  return <MediaLibraryPage />;
}
