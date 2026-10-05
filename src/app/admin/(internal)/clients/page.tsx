import { ClientsPage, getClientsPageData } from "@/features/admin/clients";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";

export default async function ClientsRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.clients,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const data = await getClientsPageData();
  return <ClientsPage data={data} />;
}
