import type { WorkerInvitationDisplayStatus } from "@/domain/invitation-display";
import type { InvitationEmailDeliveryStatus } from "@/types/worker-invitation";
import type { Role } from "@/types/role";
import type { UserRole } from "@/types/user-role";

import type { AdminUserView } from "./users.types";

const INTERNAL_ROLE_IDS = new Set(["role-admin", "role-worker"]);
const WORKER_ROLE_ID = "role-worker";

export const invitationStatusLabels: Record<
  WorkerInvitationDisplayStatus,
  string
> = {
  active: "Activa",
  used: "Utilizada",
  revoked: "Revocada",
  expired: "Expirada",
  inactive: "Inactiva",
};

export const invitationEmailDeliveryLabels: Record<
  InvitationEmailDeliveryStatus,
  string
> = {
  not_attempted: "Correo pendiente",
  sent: "Correo enviado",
  failed: "Correo no enviado",
  simulated: "Correo simulado (desarrollo)",
};

export function normalizeFormEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isReasonableEmail(email: string) {
  const normalized = normalizeFormEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function isWorkerUser(userId: string, userRoles: UserRole[]) {
  return userRoles.some(
    (assignment) =>
      assignment.userId === userId && assignment.roleId === WORKER_ROLE_ID,
  );
}

export function isAdminRoleUser(userId: string, userRoles: UserRole[]) {
  return userRoles.some(
    (assignment) =>
      assignment.userId === userId && assignment.roleId === "role-admin",
  );
}

export function filterInternalUsers(
  users: AdminUserView[],
  userRoles: UserRole[],
): AdminUserView[] {
  return users.filter((user) =>
    userRoles.some(
      (assignment) =>
        assignment.userId === user.id &&
        INTERNAL_ROLE_IDS.has(assignment.roleId),
    ),
  );
}

export function getRoleLabel(
  userId: string,
  userRoles: UserRole[],
  roles: Role[],
) {
  const roleIds = userRoles
    .filter((assignment) => assignment.userId === userId)
    .map((assignment) => assignment.roleId);

  return roles
    .filter((role) => roleIds.includes(role.id))
    .map((role) => role.label)
    .join(", ");
}

export function isPrincipalAdminUser(
  userId: string,
  principalAdminUserId: string,
) {
  return userId === principalAdminUserId;
}

export function formatUserDisplayName(user: {
  firstName: string;
  lastName: string;
}) {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function mapUserAdminApiError(error: string | undefined): string {
  switch (error) {
    case "principal_admin":
      return "El administrador principal no puede desactivarse ni eliminarse.";
    case "self_delete":
      return "No puedes eliminar tu propia cuenta desde el panel.";
    case "self_deactivate":
      return "No puedes desactivar tu propia cuenta desde el panel.";
    case "self_revoke":
      return "No puedes quitarte tus propios permisos desde el panel.";
    case "already_decided":
      return "Esta solicitud ya fue atendida.";
    case "already_member":
      return "Ese correo ya tiene acceso interno.";
    case "not_internal_user":
      return "Este usuario no pertenece al directorio interno.";
    case "not_found":
      return "El usuario ya no está disponible.";
    case "forbidden":
    case "unauthorized":
      return "No tienes autorización para esta operación.";
    default:
      return "No se pudo completar la operación. Intenta de nuevo.";
  }
}

export function getWorkerRoleId(roles: Role[]) {
  return roles.find((role) => role.id === WORKER_ROLE_ID)?.id ?? WORKER_ROLE_ID;
}

export function mapInvitationApiError(error: string | undefined): string {
  switch (error) {
    case "invalid_email":
      return "El correo no es válido.";
    case "corporate_email_required":
      return "El correo debe pertenecer al dominio corporativo permitido.";
    case "invalid_role":
      return "Solo se pueden crear invitaciones para trabajadores.";
    case "client_conflict":
      return "Este correo pertenece a un cliente y no puede recibir acceso de trabajador.";
    case "principal_admin":
      return "No se puede invitar al administrador principal.";
    case "forbidden":
      return "No tienes autorización para gestionar invitaciones.";
    case "unauthorized":
      return "Tu sesión no es válida. Inicia sesión nuevamente.";
    case "used":
      return "Esta invitación ya fue utilizada y no se puede reenviar.";
    case "revoked":
      return "Esta invitación fue revocada. Crea una nueva si es necesario.";
    case "inactive":
      return "Esta invitación no está activa.";
    case "cooldown":
      return "Espera un momento antes de reenviar esta invitación.";
    case "limit_reached":
      return "Se alcanzó el límite de reenvíos para esta invitación.";
    case "conflict":
      return "La invitación acaba de actualizarse. Intenta de nuevo.";
    case "not_found":
      return "La invitación no fue encontrada.";
    case "missing_fields":
      return "Completa todos los campos obligatorios.";
    case "invalid_json":
    case "invalid_body":
      return "La solicitud no es válida. Intenta de nuevo.";
    default:
      return "No se pudo completar la operación. Intenta de nuevo.";
  }
}

export function getRoleLabelById(roleId: string, roles: Role[]) {
  return roles.find((role) => role.id === roleId)?.label ?? roleId;
}

export function formatAdminDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function mapInvitationEmailStatusMessage(
  email: string,
  status: InvitationEmailDeliveryStatus | undefined,
) {
  if (status === "sent") {
    return `Invitación creada y correo enviado a ${email}.`;
  }

  if (status === "simulated") {
    return `Invitación creada para ${email}. El correo se simuló en desarrollo.`;
  }

  if (status === "failed") {
    return `Invitación creada, pero no fue posible enviar el correo a ${email}.`;
  }

  return `Invitación creada para ${email}.`;
}

export function mapInvitationResendStatusMessage(
  email: string,
  status: InvitationEmailDeliveryStatus | undefined,
) {
  if (status === "sent") {
    return `Invitación reenviada a ${email}. El código anterior ya no es válido.`;
  }

  if (status === "simulated") {
    return `Invitación reenviada a ${email} (correo simulado en desarrollo). El código anterior ya no es válido.`;
  }

  if (status === "failed") {
    return `Se generó un nuevo código para ${email}, pero no fue posible enviar el correo.`;
  }

  return `Invitación reenviada a ${email}.`;
}
