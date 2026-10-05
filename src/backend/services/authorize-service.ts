import {
  resolveAuthFromToken,
  type ResolvedAuthContext,
} from "../services/session-service";
import { readSessionTokenFromCookies } from "../http/session-cookie";
import * as roleRepository from "../repositories/role-repository";
import * as userPermissionRepository from "../repositories/user-permission-repository";
import { recordSecurityEvent } from "../services/security-event-service";
import { userCan } from "@/domain/authorization";

/**
 * Single entry for server-side internal authorization (layouts + route handlers).
 */
export async function requireInternalAccess(): Promise<ResolvedAuthContext> {
  const token = await readSessionTokenFromCookies();
  return resolveAuthFromToken(token);
}

/**
 * Elevated appointment mutations (status + worker assignment) on the
 * non-admin collection route. Requires principal admin or the seeded
 * appointments.manage permission. Distinct from requireAppointmentsWriteAccess,
 * which admits any internal user for admin UI status changes only.
 */
export function appointmentManageDecision(
  context: ResolvedAuthContext,
  hasAppointmentsManage: boolean,
) {
  if (!context.access.allowed || !context.user) {
    const unauthenticated = isUnauthenticated(context);

    return {
      ok: false as const,
      status: (unauthenticated ? 401 : 403) as 401 | 403,
      error: (unauthenticated ? "unauthorized" : "forbidden") as
        | "unauthorized"
        | "forbidden",
      context,
    };
  }

  const canManage =
    context.access.isPrincipalAdmin || hasAppointmentsManage;

  if (!canManage) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "forbidden" as const,
      context,
    };
  }

  return { ok: true as const, context };
}

export async function requireAppointmentManageAccess(input?: {
  ipReference?: string;
  userAgentReference?: string;
  route?: string;
}) {
  const context = await requireInternalAccess();
  const hasManage =
    Boolean(context.user) &&
    (await roleRepository.userHasPermission(
      context.user!.id,
      "appointments.manage",
    ));
  const decision = appointmentManageDecision(context, hasManage);

  if (!decision.ok) {
    await recordSecurityEvent({
      type: "unauthorized_admin_access",
      severity: decision.status === 401 ? "high" : "medium",
      emailAttempted: context.user?.email,
      ipReference: input?.ipReference,
      userAgentReference: input?.userAgentReference,
      route: input?.route ?? "/api/appointments",
      success: false,
      metadata: {
        reason:
          decision.error === "forbidden" && context.access.allowed
            ? "missing_appointments_manage"
            : context.access.reason,
      },
    });
  }

  return decision;
}

/** No usable session at all, as opposed to a session without permission. */
function isUnauthenticated(context: ResolvedAuthContext) {
  return (
    context.access.reason === "session_missing" ||
    context.access.reason === "session_expired" ||
    context.access.reason === "visitor"
  );
}

/**
 * Principal administrator only — worker invitation management and similar.
 * Missing session answers 401 like every other gate; an authenticated user
 * without the principal role answers 403.
 */
export function principalAdminDecision(context: ResolvedAuthContext) {
  if (!context.access.allowed || !context.access.isPrincipalAdmin || !context.user) {
    const unauthenticated = isUnauthenticated(context);

    return {
      ok: false as const,
      status: (unauthenticated ? 401 : 403) as 401 | 403,
      error: (unauthenticated ? "unauthorized" : "forbidden") as
        | "unauthorized"
        | "forbidden",
      context,
    };
  }

  return { ok: true as const, context };
}

export async function requirePrincipalAdmin() {
  return principalAdminDecision(await requireInternalAccess());
}

/**
 * Internal users (principal admin + workers) may consult persisted clients.
 * Visitors, client-role users, and unauthenticated callers are denied.
 */
export function clientsReadDecision(context: ResolvedAuthContext) {
  if (!context.access.allowed || !context.user) {
    const unauthenticated = isUnauthenticated(context);

    return {
      ok: false as const,
      status: (unauthenticated ? 401 : 403) as 401 | 403,
      error: (unauthenticated ? "unauthorized" : "forbidden") as
        | "unauthorized"
        | "forbidden",
      context,
    };
  }

  return { ok: true as const, context };
}

export async function requireClientsReadAccess() {
  return requirePermission("clients.view");
}

/**
 * Internal users (principal admin + workers) may read appointments.
 * Same gate as clients — visitors and client-role users are denied.
 */
export function appointmentsReadDecision(context: ResolvedAuthContext) {
  return clientsReadDecision(context);
}

export async function requireAppointmentsReadAccess() {
  return requirePermission("appointments.read");
}

/**
 * Status changes are an internal operation.
 * Principal admin and workers already admitted by canAccessAdmin may write.
 */
export async function requireAppointmentsWriteAccess(input?: {
  ipReference?: string;
  userAgentReference?: string;
  route?: string;
}) {
  const decision = await requirePermission("appointments.read");

  if (!decision.ok) {
    await recordSecurityEvent({
      type: "unauthorized_admin_access",
      severity: decision.status === 401 ? "high" : "medium",
      emailAttempted: decision.context.user?.email,
      ipReference: input?.ipReference,
      userAgentReference: input?.userAgentReference,
      route: input?.route ?? "/api/admin/appointments",
      success: false,
      metadata: { reason: decision.context.access.reason },
    });
  }

  return decision;
}

/**
 * Internal users may manage the persisted project/property catalog.
 * Same gate as clients and appointments — visitors and client-role users denied.
 */
export function catalogAccessDecision(context: ResolvedAuthContext) {
  return clientsReadDecision(context);
}

export async function requireCatalogReadAccess(permission: string) {
  return requirePermission(permission);
}

export async function requireCatalogWriteAccess(
  permission: string,
  input?: {
    ipReference?: string;
    userAgentReference?: string;
    route?: string;
  },
) {
  const decision = await requirePermission(permission);

  if (!decision.ok) {
    await recordSecurityEvent({
      type: "unauthorized_admin_access",
      severity: decision.status === 401 ? "high" : "medium",
      emailAttempted: decision.context.user?.email,
      ipReference: input?.ipReference,
      userAgentReference: input?.userAgentReference,
      route: input?.route ?? "/api/admin/catalog",
      success: false,
      metadata: { reason: decision.context.access.reason },
    });
  }

  return decision;
}

/**
 * Internal users may consult and update contact requests.
 * Same gate as clients — visitors and client-role users are denied.
 */
export function contactRequestsAccessDecision(context: ResolvedAuthContext) {
  return clientsReadDecision(context);
}

/**
 * Notifications are per-recipient, but reaching the endpoint is still an
 * internal operation: an authenticated client must get 403, not 401.
 */
export function notificationsAccessDecision(context: ResolvedAuthContext) {
  return clientsReadDecision(context);
}

export async function requireNotificationsAccess() {
  return requirePermission("notifications.view");
}

/**
 * Administrative activity history is readable by internal users.
 * Audit writing never goes through an authorization gate from the client:
 * it is only reachable from backend services.
 */
export function activityReadDecision(context: ResolvedAuthContext) {
  return clientsReadDecision(context);
}

export async function requireActivityReadAccess() {
  return requirePermission("history.view");
}

export async function requireContactRequestsReadAccess() {
  return requirePermission("contact-requests.read");
}

export async function listEffectivePermissionNames(userId: string) {
  const { prisma } = await import("../db");
  const [roleGranted, userGranted] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { role: { userRoles: { some: { userId } } } },
      include: { permission: true },
    }),
    userPermissionRepository.listPermissionNamesForUser(userId),
  ]);

  return [
    ...new Set([
      ...roleGranted.map((row) => row.permission.name),
      ...userGranted,
    ]),
  ];
}

export function permissionDecision(
  context: ResolvedAuthContext,
  permissionNames: string[],
  permission: string,
) {
  if (!context.access.allowed || !context.user) {
    const unauthenticated = isUnauthenticated(context);

    return {
      ok: false as const,
      status: (unauthenticated ? 401 : 403) as 401 | 403,
      error: (unauthenticated ? "unauthorized" : "forbidden") as
        | "unauthorized"
        | "forbidden",
      context,
    };
  }

  const allowed = userCan(
    {
      isPrincipalAdmin: context.access.isPrincipalAdmin,
      permissionNames,
    },
    permission,
  );

  if (!allowed) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "forbidden" as const,
      context,
    };
  }

  return { ok: true as const, context, permissionNames };
}

export async function requirePermission(permission: string) {
  const context = await requireInternalAccess();
  const permissionNames = context.user
    ? await listEffectivePermissionNames(context.user.id)
    : [];

  return permissionDecision(context, permissionNames, permission);
}

export async function requireContactRequestsWriteAccess(input?: {
  ipReference?: string;
  userAgentReference?: string;
  route?: string;
}) {
  const decision = await requirePermission("contact-requests.manage");

  if (!decision.ok) {
    await recordSecurityEvent({
      type: "unauthorized_admin_access",
      severity: decision.status === 401 ? "high" : "medium",
      emailAttempted: decision.context.user?.email,
      ipReference: input?.ipReference,
      userAgentReference: input?.userAgentReference,
      route: input?.route ?? "/api/admin/contact-requests",
      success: false,
      metadata: { reason: decision.context.access.reason },
    });
  }

  return decision;
}
