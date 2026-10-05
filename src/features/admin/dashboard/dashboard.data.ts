import { listAppointmentsForAdmin } from "@/backend/services/appointment-service";
import { countProjects } from "@/backend/services/project-service";
import { countProperties } from "@/backend/services/property-service";
import * as roleRepository from "@/backend/repositories/role-repository";

import type { DashboardPageData } from "./dashboard.types";

const INTERNAL_ROLE_NAMES = new Set(["admin", "worker"]);

export async function getDashboardData(): Promise<DashboardPageData> {
  const [appointments, projectsCount, propertiesCount, roles, userRoles] =
    await Promise.all([
      listAppointmentsForAdmin(),
      countProjects(),
      countProperties(),
      roleRepository.listRoles(),
      roleRepository.listUserRoles(),
    ]);

  const internalRoleIds = new Set(
    roles
      .filter((role) => INTERNAL_ROLE_NAMES.has(role.name))
      .map((role) => role.id),
  );

  return {
    projectsCount,
    propertiesCount,
    appointmentsCount: appointments.length,
    pendingAppointmentsCount: appointments.filter(
      (appointment) => appointment.status === "pending",
    ).length,
    internalUsersCount: new Set(
      userRoles
        .filter((assignment) => internalRoleIds.has(assignment.roleId))
        .map((assignment) => assignment.userId),
    ).size,
  };
}
