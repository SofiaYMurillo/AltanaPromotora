import { UsersPage } from "@/features/admin/users";
import { getUsersPageData } from "@/features/admin/users/users.data";
import { getPrincipalAdminUserId } from "@/backend/config/auth-config";
import { requireAdminPage } from "@/features/admin/server";

export default async function UsersRoute() {
  const access = await requireAdminPage({
    requirement: { type: "permission", permission: "users.manage" },
    deniedDescription:
      "No tienes permiso para gestionar usuarios internos ni solicitudes de ingreso.",
  });
  if (!access.allowed) {
    return access.element;
  }

  const context = access.context;
  const data = await getUsersPageData();

  return (
    <UsersPage
      data={data}
      isPrincipalAdmin={Boolean(context.access.isPrincipalAdmin)}
      principalAdminUserId={getPrincipalAdminUserId()}
      currentUserId={context.user?.id ?? ""}
    />
  );
}
