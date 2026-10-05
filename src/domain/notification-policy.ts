import type { SecurityEvent, SecurityEventSeverity } from "./security-event";
import type { SecurityNotificationPolicy } from "./security-notification-policy";
import type {
  InternalNotification,
  NotificationCategory,
  NotificationType,
} from "./notification";

const SEVERITY_RANK: Record<SecurityEventSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const VISITOR_ACCESS_REASONS = new Set(["session_missing", "session_expired"]);

export type NotificationDraft = Omit<
  InternalNotification,
  "id" | "createdAt" | "readAt"
>;

export type NotificationPolicyDecision =
  | { notify: false }
  | { notify: true; draft: NotificationDraft };

function readMetaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readMetaBoolean(
  metadata: Record<string, unknown> | undefined,
  key: string,
): boolean {
  return metadata?.[key] === true;
}

function meetsMinimumSeverity(
  severity: SecurityEventSeverity,
  minimum: SecurityEventSeverity,
) {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[minimum];
}

function draft(input: {
  recipientUserId: string;
  securityEventId: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
}): NotificationDraft {
  return {
    recipientUserId: input.recipientUserId,
    securityEventId: input.securityEventId,
    category: input.category,
    type: input.type,
    title: input.title,
    message: input.message,
  };
}

function emailLabel(emailAttempted: string | undefined) {
  return emailAttempted?.trim() || "un correo interno";
}

/**
 * Pure policy: which SecurityEvents become in-app Notifications.
 * Does not create records. Ignores login_success and isolated failed attempts.
 */
export function resolveInternalNotification(input: {
  event: Pick<
    SecurityEvent,
    "id" | "type" | "severity" | "emailAttempted" | "metadata"
  >;
  recipientUserId: string;
  policy: SecurityNotificationPolicy;
}): NotificationPolicyDecision {
  const { event, recipientUserId, policy } = input;

  if (!policy.enabled) {
    return { notify: false };
  }

  const email = emailLabel(event.emailAttempted);

  switch (event.type) {
    case "worker_invitation_created":
      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "administrative",
          type: "invitation_created",
          title: "Invitación creada",
          message: `Se ha creado una invitación para ${email}.`,
        }),
      };

    case "worker_invitation_revoked":
      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "administrative",
          type: "invitation_revoked",
          title: "Invitación revocada",
          message: `La invitación de ${email} fue revocada.`,
        }),
      };

    case "worker_invitation_resent":
      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "administrative",
          type: "invitation_resent",
          title: "Invitación reenviada",
          message: `Se reenvió la invitación a ${email}.`,
        }),
      };

    case "worker_invitation_email_failed":
      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "administrative",
          type: "invitation_email_failed",
          title: "Correo de invitación no enviado",
          message: `No fue posible enviar el correo de invitación a ${email}.`,
        }),
      };

    case "worker_code_success":
      if (!readMetaBoolean(event.metadata, "firstAccess")) {
        return { notify: false };
      }

      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "administrative",
          type: "worker_access_granted",
          title: "Acceso concedido",
          message: `Se ha dado acceso a ${email} al panel administrativo.`,
        }),
      };

    case "worker_access_granted":
      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "administrative",
          type: "worker_access_granted",
          title: "Acceso concedido",
          message: `Se ha dado acceso a ${email} al panel administrativo.`,
        }),
      };

    case "unauthorized_admin_access":
    case "unauthorized_worker_access": {
      const reason = readMetaString(event.metadata, "reason");
      if (reason && VISITOR_ACCESS_REASONS.has(reason)) {
        return { notify: false };
      }

      if (!policy.notifyOnUnauthorizedAdminAccess) {
        return { notify: false };
      }

      if (!meetsMinimumSeverity(event.severity, policy.minimumSeverity)) {
        return { notify: false };
      }

      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "security",
          type: "unauthorized_access",
          title: "Intento de acceso no autorizado",
          message:
            "Se detectó un intento de acceso no autorizado al panel administrativo.",
        }),
      };
    }

    case "repeated_failed_login":
    case "repeated_failed_worker_code": {
      if (!policy.notifyOnRepeatedFailures) {
        return { notify: false };
      }

      if (!meetsMinimumSeverity(event.severity, policy.minimumSeverity)) {
        return { notify: false };
      }

      return {
        notify: true,
        draft: draft({
          recipientUserId,
          securityEventId: event.id,
          category: "security",
          type: "repeated_failed_auth",
          title: "Intentos de acceso fallidos",
          message:
            "Se detectaron múltiples intentos fallidos de autenticación.",
        }),
      };
    }

    default:
      return { notify: false };
  }
}
