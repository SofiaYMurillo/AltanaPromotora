import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { listAdminAppointments } from "@/backend/services/appointment-service";
import { AppointmentsAdminPage } from "@/frontend/features/admin-appointments";

export default async function AppointmentsRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.appointments,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const appointments = await listAdminAppointments();
  return <AppointmentsAdminPage initialAppointments={appointments} />;
}
