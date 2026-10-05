import type { WorkerInvitation } from "@/types/worker-invitation";

export type WorkerInvitationDisplayStatus =
  | "active"
  | "used"
  | "revoked"
  | "expired"
  | "inactive";

export function getWorkerInvitationDisplayStatus(
  invitation: WorkerInvitation,
  now: Date = new Date(),
): WorkerInvitationDisplayStatus {
  if (invitation.revokedAt) {
    return "revoked";
  }

  if (!invitation.active) {
    return "inactive";
  }

  if (new Date(invitation.expiresAt).getTime() <= now.getTime()) {
    return "expired";
  }

  if (invitation.usedAt) {
    return "used";
  }

  return "active";
}

export function canRevokeWorkerInvitation(
  invitation: WorkerInvitation,
  now: Date = new Date(),
): boolean {
  return getWorkerInvitationDisplayStatus(invitation, now) === "active";
}
