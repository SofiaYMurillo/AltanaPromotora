import type { WorkerInvitation as PrismaWorkerInvitation } from "@/generated/prisma/client";
import type { InvitationEmailDeliveryStatus } from "@/types/worker-invitation";
import type { WorkerInvitation } from "@/types/worker-invitation";

function toDeliveryStatus(value: string): InvitationEmailDeliveryStatus {
  if (
    value === "sent" ||
    value === "failed" ||
    value === "simulated" ||
    value === "not_attempted"
  ) {
    return value;
  }

  return "not_attempted";
}

export function parseGrantedPermissionNamesJson(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function toDomainWorkerInvitation(
  row: PrismaWorkerInvitation,
): WorkerInvitation {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    grantedPermissionNames: parseGrantedPermissionNamesJson(
      row.grantedPermissionNamesJson,
    ),
    roleId: row.roleId,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString(),
    usedAt: row.usedAt?.toISOString(),
    emailDeliveryStatus: toDeliveryStatus(row.emailDeliveryStatus),
    emailSentAt: row.emailSentAt?.toISOString(),
    lastEmailAttemptAt: row.lastEmailAttemptAt?.toISOString(),
    resendCount: row.resendCount,
  };
}

export function toPrismaWorkerInvitationData(input: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  grantedPermissionNames?: string[];
  roleId: string;
  active: boolean;
  codeHash: string;
  expiresAt: Date;
  invitedByUserId?: string;
}) {
  return {
    id: input.id,
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName?.trim() || null,
    lastName: input.lastName?.trim() || null,
    grantedPermissionNamesJson: JSON.stringify(input.grantedPermissionNames ?? []),
    roleId: input.roleId,
    active: input.active,
    codeHash: input.codeHash,
    expiresAt: input.expiresAt,
    invitedByUserId: input.invitedByUserId ?? null,
  };
}
