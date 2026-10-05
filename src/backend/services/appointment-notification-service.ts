import { randomUUID } from "node:crypto";

import { userCanAny } from "@/domain/authorization";
import type { Appointment } from "@/domain";

import { getPrincipalAdminUserId } from "../config/auth-config";
import { resolveVisitResourceDisplay } from "../catalog/visit-resource-display";
import * as clientRepository from "../repositories/client-repository";
import * as notificationRepository from "../repositories/notification-repository";
import * as roleRepository from "../repositories/role-repository";
import * as userPermissionRepository from "../repositories/user-permission-repository";
import * as userRepository from "../repositories/user-repository";

const APPOINTMENT_NOTIFY_PERMISSIONS = [
  "appointments.read",
  "appointments.manage",
] as const;

async function recipientShouldReceiveAppointments(userId: string) {
  if (userId === getPrincipalAdminUserId()) {
    return true;
  }

  const permissionNames =
    await userPermissionRepository.listPermissionNamesForUser(userId);

  return userCanAny(
    {
      isPrincipalAdmin: false,
      permissionNames,
    },
    [...APPOINTMENT_NOTIFY_PERMISSIONS],
  );
}

async function formatContactLine(appointment: Appointment) {
  let name: string | undefined;
  if (appointment.clientId) {
    const client = await clientRepository.findById(appointment.clientId);
    if (client) {
      name = [client.firstName, client.lastName].filter(Boolean).join(" ").trim();
    }
  }

  const email = appointment.contact?.email?.trim();
  const phone = appointment.contact?.phone?.trim();
  const parts = [name, email, phone].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Sin datos de contacto";
}

export async function notifyInternalUsersOfNewAppointment(
  appointment: Appointment,
) {
  const users = await userRepository.listUsers();
  const activeUsers = users.filter((user) => user.active);

  const resource = await resolveVisitResourceDisplay({
    type: appointment.type,
    resourceId:
      appointment.type === "property"
        ? appointment.propertyId
        : appointment.officeLocationId,
  });

  const resourceLabel =
    appointment.type === "property"
      ? `Inmueble: ${resource.title}`
      : `Sede: ${resource.title}`;

  const title = "Nueva solicitud de visita";
  const message = [
    await formatContactLine(appointment),
    resourceLabel,
    `Fecha: ${appointment.date} ${appointment.time}`,
    `Estado: ${appointment.status}`,
  ].join("\n");

  for (const user of activeUsers) {
    const roles = await roleRepository.getRolesForUser(user.id);
    const isInternal = roles.some(
      (role) => role.id === "role-admin" || role.id === "role-worker",
    );
    if (!isInternal) {
      continue;
    }

    const shouldNotify = await recipientShouldReceiveAppointments(user.id);
    if (!shouldNotify) {
      continue;
    }

    await notificationRepository.createNotification({
      id: `notification-${randomUUID()}`,
      recipientUserId: user.id,
      category: "administrative",
      type: "appointment_requested",
      title,
      message,
    });
  }
}
