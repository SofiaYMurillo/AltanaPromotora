/**
 * Account / admin recovery policy contracts.
 *
 * Architectural rule:
 * Losing the principal admin account must not disable the application,
 * the repository, hosting, database, or require source-code changes to recover.
 *
 * Technical recovery is infrastructure/backend-authorized — never a frontend
 * backdoor, master password, secret URL, or hardcoded credential.
 */

export type ApplicationRecoveryMethod =
  | "identity_provider"
  | "application"
  | "technical";

export interface AccountRecoveryPolicy {
  recoveryEnabled: boolean;
  recoveryMethods: ApplicationRecoveryMethod[];
  /** Independent of Google / corporate mailbox availability. */
  technicalRecoveryAvailable: boolean;
  /** Contact channel configured in backend/ops — not a secret in frontend. */
  recoveryContactConfigured: boolean;
  recoveryRequiresVerification: boolean;
  /**
   * Explicit non-goals encoded as false so the contract cannot drift into
   * frontend backdoors.
   */
  frontendBackdoorAllowed: false;
  hardcodedMasterCredentialAllowed: false;
  secretUrlBypassAllowed: false;
}

/** Alias aligned with sprint naming. */
export type AdminRecoveryPolicy = AccountRecoveryPolicy;
