import {
  adminPagePermissions,
  requireAdminPage,
} from "@/features/admin/server";
import {
  getAdminAvailabilityScope,
} from "@/backend/services/availability-admin-service";
import { AvailabilityAdminPage } from "@/frontend/features/admin-availability";

export default async function AvailabilityRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.availability,
    },
    deniedDescription: "No tienes permiso para administrar horarios.",
  });
  if (!access.allowed) {
    return access.element;
  }

  const [office, property] = await Promise.all([
    getAdminAvailabilityScope("office"),
    getAdminAvailabilityScope("property"),
  ]);

  return (
    <AvailabilityAdminPage initialOffice={office} initialProperty={property} />
  );
}
