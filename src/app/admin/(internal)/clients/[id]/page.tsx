import { notFound } from "next/navigation";

import { ClientDetailPage } from "@/features/admin/clients/ClientDetailPage";
import { getClientDetailPageData } from "@/features/admin/clients/client-detail.data";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";

type ClientDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailRoute({
  params,
}: ClientDetailRouteProps) {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.clients,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const { id } = await params;
  const data = await getClientDetailPageData(id);

  if (!data) {
    notFound();
  }

  return <ClientDetailPage data={data} />;
}
