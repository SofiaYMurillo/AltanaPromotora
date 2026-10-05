import type {
  InvitationEmailDeliveryStatus,
  WorkerInvitation,
} from "@/types/worker-invitation";

import { getWorkerInvitationDisplayStatus } from "./invitation-display";

export type { InvitationEmailDeliveryStatus };

export type InvitationResendBlockReason =
  | "used"
  | "revoked"
  | "inactive"
  | "cooldown"
  | "limit_reached";

export type InvitationResendDecision =
  | { allowed: true }
  | { allowed: false; reason: InvitationResendBlockReason };

export type InvitationResendPolicy = {
  cooldownSeconds: number;
  maxResends: number;
};

export type WorkerInvitationAdminView = WorkerInvitation & {
  canResend: boolean;
  resendBlockReason?: InvitationResendBlockReason;
};

export function evaluateInvitationResend(input: {
  invitation: WorkerInvitation;
  policy: InvitationResendPolicy;
  now?: Date;
}): InvitationResendDecision {
  const now = input.now ?? new Date();
  const status = getWorkerInvitationDisplayStatus(input.invitation, now);

  if (status === "used") {
    return { allowed: false, reason: "used" };
  }

  if (status === "revoked") {
    return { allowed: false, reason: "revoked" };
  }

  if (status === "inactive") {
    return { allowed: false, reason: "inactive" };
  }

  const resendCount = input.invitation.resendCount ?? 0;
  if (resendCount >= input.policy.maxResends) {
    return { allowed: false, reason: "limit_reached" };
  }

  const lastAttempt = input.invitation.lastEmailAttemptAt;
  if (lastAttempt) {
    const elapsedMs = now.getTime() - new Date(lastAttempt).getTime();
    if (elapsedMs < input.policy.cooldownSeconds * 1000) {
      return { allowed: false, reason: "cooldown" };
    }
  }

  return { allowed: true };
}

export function toInvitationAdminView(
  invitation: WorkerInvitation,
  policy: InvitationResendPolicy,
  now?: Date,
): WorkerInvitationAdminView {
  const decision = evaluateInvitationResend({ invitation, policy, now });

  if (decision.allowed) {
    return { ...invitation, canResend: true };
  }

  return {
    ...invitation,
    canResend: false,
    resendBlockReason: decision.reason,
  };
}
