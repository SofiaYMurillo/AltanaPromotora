import { randomUUID } from "node:crypto";

import { internalAccessPolicy } from "@/config/internal-access-policy.data";
import { permissionNameSet } from "@/config/permission.data";
import {
  evaluateInvitationResend,
  evaluateWorkerInvitationState,
  toInvitationAdminView,
  type AuditActor,
  type InvitationEmailDeliveryStatus,
  type WorkerInvitationAdminView,
} from "@/domain";
import { normalizeEmail } from "@/features/auth/access";
import type { WorkerInvitation } from "@/types/worker-invitation";

import {
  WORKER_INVITATION_TTL_MS,
  getPrincipalAdminUserId,
} from "../config/auth-config";
import {
  getInvitationMaxResends,
  getInvitationResendCooldownSeconds,
} from "../config/email-config";
import {
  sendWorkerInvitationEmail,
  toInvitationEmailDeliveryStatus,
} from "../email/invitation-mail-service";
import * as roleRepository from "../repositories/role-repository";
import * as userRepository from "../repositories/user-repository";
import * as workerInvitationRepository from "../repositories/worker-invitation-repository";
import {
  createInvitationCode,
  hashInvitationCode,
} from "../security/invitation-code";
import { recordAuditEntry } from "./audit-service";
import { recordSecurityEvent } from "./security-event-service";

const WORKER_ROLE_ID = "role-worker";

export type InvitationEmailResult = {
  status: InvitationEmailDeliveryStatus;
};

export type CreateInvitationResult =
  | {
      ok: true;
      invitation: WorkerInvitationAdminView;
      email: InvitationEmailResult;
      /** Shown once in non-production — never persisted or logged. */
      code: string;
    }
  | {
      ok: false;
      error:
        | "invalid_email"
        | "corporate_email_required"
        | "invalid_role"
        | "client_conflict"
        | "principal_admin";
    };

export type ResendInvitationResult =
  | {
      ok: true;
      invitation: WorkerInvitationAdminView;
      email: InvitationEmailResult;
      code: string;
    }
  | {
      ok: false;
      error:
        | "not_found"
        | "used"
        | "revoked"
        | "inactive"
        | "cooldown"
        | "limit_reached"
        | "conflict";
    };

function resendPolicy() {
  return {
    cooldownSeconds: getInvitationResendCooldownSeconds(),
    maxResends: getInvitationMaxResends(),
  };
}

function toAdminView(invitation: WorkerInvitation): WorkerInvitationAdminView {
  return toInvitationAdminView(invitation, resendPolicy());
}

async function deliverInvitationEmail(input: {
  invitationId: string;
  email: string;
  code: string;
  expiresAt: Date;
  route: string;
  eventType: "create" | "resend";
}) {
  const attemptedAt = new Date();
  const sendResult = await sendWorkerInvitationEmail({
    to: input.email,
    invitationCode: input.code,
    expiresAt: input.expiresAt,
  });
  const status = toInvitationEmailDeliveryStatus(sendResult);
  const emailSentAt =
    status === "sent" || status === "simulated" ? attemptedAt : null;

  const invitation = await workerInvitationRepository.updateInvitationDelivery({
    id: input.invitationId,
    emailDeliveryStatus: status,
    lastEmailAttemptAt: attemptedAt,
    emailSentAt,
  });

  if (status === "sent") {
    await recordSecurityEvent({
      type: "worker_invitation_email_sent",
      severity: "info",
      source: "admin_panel",
      emailAttempted: input.email,
      route: input.route,
      success: true,
      metadata: {
        invitationId: input.invitationId,
        delivery: status,
        action: input.eventType,
      },
    });
  }

  if (status === "failed") {
    await recordSecurityEvent({
      type: "worker_invitation_email_failed",
      severity: "medium",
      source: "admin_panel",
      emailAttempted: input.email,
      route: input.route,
      success: false,
      metadata: {
        invitationId: input.invitationId,
        action: input.eventType,
      },
    });
  }

  return { invitation, status };
}

export async function listInvitations(): Promise<WorkerInvitationAdminView[]> {
  const invitations = await workerInvitationRepository.listWorkerInvitations();
  return invitations.map(toAdminView);
}

function normalizeGrantedPermissions(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(
    (value): value is string =>
      typeof value === "string" && permissionNameSet.has(value),
  );
}

export async function createInvitation(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  permissionNames?: string[];
  invitedByUserId: string;
  expiresAt?: Date;
  actor?: AuditActor | null;
  allowPersonalEmail?: boolean;
}): Promise<CreateInvitationResult> {
  const email = normalizeEmail(input.email);

  if (!email.includes("@") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "invalid_email" as const };
  }

  if (input.roleId !== WORKER_ROLE_ID) {
    return { ok: false as const, error: "invalid_role" as const };
  }

  const role = await roleRepository.findRoleById(input.roleId);
  if (!role || role.name !== "worker") {
    return { ok: false as const, error: "invalid_role" as const };
  }

  const existingUser = await userRepository.findUserByEmail(email);

  if (existingUser) {
    const roles = await roleRepository.getRolesForUser(existingUser.id);
    const isClient = roles.some((r) => r.name === "client");
    const isPrincipal =
      existingUser.id === getPrincipalAdminUserId() ||
      roles.some((r) => r.name === "admin");

    if (isPrincipal) {
      return { ok: false as const, error: "principal_admin" as const };
    }

    if (isClient) {
      return { ok: false as const, error: "client_conflict" as const };
    }
  }

  const code = createInvitationCode();
  const expiresAt =
    input.expiresAt ?? new Date(Date.now() + WORKER_INVITATION_TTL_MS);

  const grantedPermissionNames = normalizeGrantedPermissions(
    input.permissionNames,
  );

  const invitation = await workerInvitationRepository.createWorkerInvitation({
    id: `invitation-${randomUUID()}`,
    email,
    firstName: input.firstName,
    lastName: input.lastName,
    grantedPermissionNames,
    roleId: input.roleId,
    active: true,
    codeHash: hashInvitationCode(code),
    expiresAt,
    invitedByUserId: input.invitedByUserId,
  });

  await recordSecurityEvent({
    type: "worker_invitation_created",
    severity: "info",
    source: "admin_panel",
    emailAttempted: email,
    route: "/api/admin/workers/invitations",
    success: true,
    metadata: {
      invitationId: invitation.id,
      roleId: input.roleId,
      invitedByUserId: input.invitedByUserId,
    },
  });

  // Security fact stays a SecurityEvent; this is the administrative action.
  await recordAuditEntry({
    actor: input.actor,
    action: "invitation_created",
    entityType: "invitation",
    entityId: invitation.id,
    entityLabel: email,
    metadata: { roleId: input.roleId },
  });

  const delivery = await deliverInvitationEmail({
    invitationId: invitation.id,
    email,
    code,
    expiresAt,
    route: "/api/admin/workers/invitations",
    eventType: "create",
  });

  return {
    ok: true as const,
    invitation: toAdminView(delivery.invitation),
    email: { status: delivery.status },
    code,
  };
}

export async function revokeInvitation(input: {
  invitationId: string;
  revokedByUserId: string;
  actor?: AuditActor | null;
}) {
  const existing = await workerInvitationRepository.findWorkerInvitationById(
    input.invitationId,
  );

  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (existing.revokedAt) {
    return {
      ok: true as const,
      invitation: toAdminView(existing),
      alreadyRevoked: true,
    };
  }

  const invitation = await workerInvitationRepository.revokeWorkerInvitation(
    input.invitationId,
    new Date(),
  );

  await recordSecurityEvent({
    type: "worker_invitation_revoked",
    severity: "medium",
    source: "admin_panel",
    emailAttempted: invitation.email,
    route: `/api/admin/workers/invitations/${input.invitationId}/revoke`,
    success: true,
    metadata: {
      invitationId: invitation.id,
      revokedByUserId: input.revokedByUserId,
    },
  });

  await recordAuditEntry({
    actor: input.actor,
    action: "invitation_revoked",
    entityType: "invitation",
    entityId: invitation.id,
    entityLabel: invitation.email,
  });

  return {
    ok: true as const,
    invitation: toAdminView(invitation),
    alreadyRevoked: false,
  };
}

export async function resendInvitation(input: {
  invitationId: string;
  resentByUserId: string;
}): Promise<ResendInvitationResult> {
  const existing = await workerInvitationRepository.findWorkerInvitationById(
    input.invitationId,
  );

  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  const decision = evaluateInvitationResend({
    invitation: existing,
    policy: resendPolicy(),
  });

  if (!decision.allowed) {
    return { ok: false as const, error: decision.reason };
  }

  const code = createInvitationCode();
  const expiresAt = new Date(Date.now() + WORKER_INVITATION_TTL_MS);
  const now = new Date();

  const rotated = await workerInvitationRepository.rotateInvitationCode({
    id: existing.id,
    expectedResendCount: existing.resendCount ?? 0,
    codeHash: hashInvitationCode(code),
    expiresAt,
    lastEmailAttemptAt: now,
  });

  if (!rotated) {
    return { ok: false as const, error: "conflict" as const };
  }

  await recordSecurityEvent({
    type: "worker_invitation_resent",
    severity: "info",
    source: "admin_panel",
    emailAttempted: rotated.email,
    route: `/api/admin/workers/invitations/${input.invitationId}/resend`,
    success: true,
    metadata: {
      invitationId: rotated.id,
      resentByUserId: input.resentByUserId,
    },
  });

  const delivery = await deliverInvitationEmail({
    invitationId: rotated.id,
    email: rotated.email,
    code,
    expiresAt,
    route: `/api/admin/workers/invitations/${input.invitationId}/resend`,
    eventType: "resend",
  });

  return {
    ok: true as const,
    invitation: toAdminView(delivery.invitation),
    email: { status: delivery.status },
    code,
  };
}

export function evaluateInvitationForAuth(input: {
  invitation: NonNullable<
    Awaited<
      ReturnType<
        typeof workerInvitationRepository.findActiveInvitationForEmail
      >
    >
  >["domain"];
  email: string;
  allowUsedForReauth: boolean;
}) {
  return evaluateWorkerInvitationState({
    invitation: input.invitation,
    email: input.email,
    accessPolicy: internalAccessPolicy,
    allowUsedForReauth: input.allowUsedForReauth,
  });
}
