import type { WorkerInvitation } from "@/types/worker-invitation";

import type { InternalAccessPolicy } from "./access-policy";
import { isWorkerEmailCompliant } from "./access-policy";

export type InvitationEvaluationReason =
  | "valid"
  | "not_found"
  | "inactive"
  | "expired"
  | "revoked"
  | "used"
  | "email_mismatch"
  | "token_mismatch"
  | "corporate_email_required"
  | "email_domain_not_allowed";

export type InvitationEvaluation = {
  allowed: boolean;
  reason: InvitationEvaluationReason;
  invitationId?: string;
};

/**
 * Pure invitation state evaluation — no code verification here.
 * Code/hash checks belong to the authentication method layer (server).
 */
export function evaluateWorkerInvitationState(input: {
  invitation: WorkerInvitation | null | undefined;
  email: string;
  now?: Date;
  accessPolicy?: Pick<
    InternalAccessPolicy,
    "allowedEmailDomains" | "requireCorporateEmailForWorkers"
  >;
  /** When true, a used invitation may still be valid for re-authentication. */
  allowUsedForReauth?: boolean;
}): InvitationEvaluation {
  const now = input.now ?? new Date();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (
    input.accessPolicy &&
    !isWorkerEmailCompliant(normalizedEmail, input.accessPolicy)
  ) {
    return {
      allowed: false,
      reason: input.accessPolicy.requireCorporateEmailForWorkers
        ? "corporate_email_required"
        : "email_domain_not_allowed",
    };
  }

  const invitation = input.invitation;

  if (!invitation) {
    return { allowed: false, reason: "not_found" };
  }

  if (!invitation.active) {
    return {
      allowed: false,
      reason: "inactive",
      invitationId: invitation.id,
    };
  }

  if (invitation.email.trim().toLowerCase() !== normalizedEmail) {
    return {
      allowed: false,
      reason: "email_mismatch",
      invitationId: invitation.id,
    };
  }

  if (invitation.revokedAt) {
    return {
      allowed: false,
      reason: "revoked",
      invitationId: invitation.id,
    };
  }

  if (invitation.usedAt && !input.allowUsedForReauth) {
    return {
      allowed: false,
      reason: "used",
      invitationId: invitation.id,
    };
  }

  if (new Date(invitation.expiresAt).getTime() <= now.getTime()) {
    return {
      allowed: false,
      reason: "expired",
      invitationId: invitation.id,
    };
  }

  return {
    allowed: true,
    reason: "valid",
    invitationId: invitation.id,
  };
}
