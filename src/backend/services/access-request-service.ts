import { randomUUID } from "node:crypto";

import type { AccessRequest } from "@/domain";
import type { AuditActor } from "@/domain";
import { normalizeEmail } from "@/features/auth/access";

import { prisma } from "../db";
import * as accessRequestRepository from "../repositories/access-request-repository";
import * as notificationRepository from "../repositories/notification-repository";
import * as roleRepository from "../repositories/role-repository";
import * as userRepository from "../repositories/user-repository";
import { createInvitation } from "./worker-invitation-service";

const ADMIN_ROLE_ID = "role-admin";
const WORKER_ROLE_ID = "role-worker";
const REQUEST_COOLDOWN_MS = 1000 * 60 * 5;
const lastRequestAt = new Map<string, number>();

export type SubmitAccessRequestResult =
  | { ok: true; request: AccessRequest; alreadyPending: boolean }
  | {
      ok: false;
      error:
        | "invalid_email"
        | "already_member"
        | "client_conflict"
        | "rate_limited";
      retryAfterSeconds?: number;
    };

function isReasonableEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function listAdminRecipientIds() {
  const rows = await prisma.userRole.findMany({
    where: { roleId: ADMIN_ROLE_ID, user: { active: true } },
    select: { userId: true },
  });

  return [...new Set(rows.map((row) => row.userId))];
}

async function notifyAdmins(request: AccessRequest) {
  const adminIds = await listAdminRecipientIds();
  const displayName = [request.firstName, request.lastName]
    .filter(Boolean)
    .join(" ");
  const subject = displayName
    ? `${displayName} (${request.email})`
    : request.email;

  await Promise.all(
    adminIds.map((recipientUserId) =>
      notificationRepository.createNotification({
        id: `notification-access-${request.id}-${recipientUserId}`,
        recipientUserId,
        category: "administrative",
        type: "access_request_received",
        title: "Nueva solicitud de ingreso",
        message: `${subject} pidió acceso al panel interno. Revísala en Usuarios para aceptar o rechazar.`,
      }),
    ),
  );
}

export async function submitAccessRequest(input: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<SubmitAccessRequestResult> {
  const email = normalizeEmail(input.email);

  if (!isReasonableEmail(email)) {
    return { ok: false, error: "invalid_email" };
  }

  const previous = lastRequestAt.get(email);
  if (previous && Date.now() - previous < REQUEST_COOLDOWN_MS) {
    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: Math.ceil(
        (REQUEST_COOLDOWN_MS - (Date.now() - previous)) / 1000,
      ),
    };
  }

  const existingUser = await userRepository.findUserForAuthentication(email);
  if (existingUser?.active) {
    const roles = await roleRepository.getRolesForUser(existingUser.id);
    if (roles.some((role) => role.name === "client")) {
      return { ok: false, error: "client_conflict" };
    }
    if (roles.some((role) => role.name === "admin" || role.name === "worker")) {
      return { ok: false, error: "already_member" };
    }
  }

  const pending = await accessRequestRepository.findPendingAccessRequestByEmail(
    email,
  );
  if (pending) {
    lastRequestAt.set(email, Date.now());
    return { ok: true, request: pending, alreadyPending: true };
  }

  const request = await accessRequestRepository.createAccessRequest({
    id: `access-request-${randomUUID()}`,
    email,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  lastRequestAt.set(email, Date.now());
  await notifyAdmins(request);

  return { ok: true, request, alreadyPending: false };
}

export async function listAccessRequests() {
  return accessRequestRepository.listAccessRequests();
}

export async function approveAccessRequest(input: {
  requestId: string;
  actorUserId: string;
  actor?: AuditActor | null;
}) {
  const request = await accessRequestRepository.findAccessRequestById(
    input.requestId,
  );

  if (!request) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (request.status !== "pending") {
    return { ok: false as const, error: "already_decided" as const };
  }

  const invitation = await createInvitation({
    email: request.email,
    firstName: request.firstName,
    lastName: request.lastName,
    roleId: WORKER_ROLE_ID,
    invitedByUserId: input.actorUserId,
    actor: input.actor,
    allowPersonalEmail: true,
  });

  if (!invitation.ok) {
    return { ok: false as const, error: invitation.error };
  }

  const updated = await accessRequestRepository.updateAccessRequestDecision({
    id: request.id,
    status: "approved",
    decidedByUserId: input.actorUserId,
    invitationId: invitation.invitation.id,
  });

  return {
    ok: true as const,
    request: updated,
    invitation: invitation.invitation,
    email: invitation.email,
    code: invitation.code,
  };
}

export async function rejectAccessRequest(input: {
  requestId: string;
  actorUserId: string;
}) {
  const request = await accessRequestRepository.findAccessRequestById(
    input.requestId,
  );

  if (!request) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (request.status !== "pending") {
    return { ok: false as const, error: "already_decided" as const };
  }

  const updated = await accessRequestRepository.updateAccessRequestDecision({
    id: request.id,
    status: "rejected",
    decidedByUserId: input.actorUserId,
  });

  return { ok: true as const, request: updated };
}
