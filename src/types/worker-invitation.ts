/**
 * Temporary worker access authorization.
 * The token reference is mock/test data only — not a production secret store.
 * Invitation codes are never stored here — only delivery metadata, never hashes.
 */

export type InvitationEmailDeliveryStatus =
  | "not_attempted"
  | "sent"
  | "failed"
  | "simulated";

export interface WorkerInvitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  grantedPermissionNames?: string[];
  roleId: string;
  active: boolean;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  usedAt?: string;
  emailDeliveryStatus?: InvitationEmailDeliveryStatus;
  emailSentAt?: string;
  lastEmailAttemptAt?: string;
  resendCount?: number;
  /** Opaque test reference for invitation validation mocks only — not persisted. */
  tokenRef?: string;
}
