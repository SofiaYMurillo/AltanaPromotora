import { notFound } from "next/navigation";

import { getAdminAppointment } from "@/backend/services/appointment-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { AppointmentDetailPage } from "@/frontend/features/admin-appointments";

type AppointmentDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AppointmentDetailRoute({
  params,
}: AppointmentDetailRouteProps) {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.appointments,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const { id } = await params;
  const appointment = await getAdminAppointment(id);

  if (!appointment) {
    notFound();
  }

  return <AppointmentDetailPage initialAppointment={appointment} />;
}
