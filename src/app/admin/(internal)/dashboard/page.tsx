import { DashboardPage } from "@/features/admin/dashboard";
import { getDashboardData } from "@/features/admin/dashboard/dashboard.data";
import { requireAdminPage } from "@/features/admin/server";

export default async function DashboardRoute() {
  const access = await requireAdminPage({ requirement: { type: "internal" } });
  if (!access.allowed) {
    return access.element;
  }

  const data = await getDashboardData();
  return <DashboardPage data={data} />;
}
