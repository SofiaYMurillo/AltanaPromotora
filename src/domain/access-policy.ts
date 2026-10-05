/**
 * Configurable internal access policy.
 * Domains and auth methods must not be hardcoded in Presentation.
 *
 * Backend will enforce these rules authoritatively.
 * Frontend/domain helpers are provisional composition only.
 */

export type WorkerAuthenticationMethod =
  | "temporary_code"
  | "secure_link"
  | "identity_provider";

export type AdminAuthenticationMethod =
  | "password"
  | "password_and_mfa";

/**
 * Google Workspace (or other IdP) is a future integration option.
 * It must never be the sole authorization authority for the admin panel.
 */
export type IdentityProviderIntegration = {
  /** Conceptual flag — no SDK or OAuth in this sprint. */
  googleWorkspacePrepared: boolean;
  /** Application retains User / Role / Session regardless of IdP. */
  identityProviderIsSoleAuthority: false;
};

export interface InternalAccessPolicy {
  allowedEmailDomains: string[];
  requireCorporateEmailForWorkers: boolean;
  workerAuthenticationMethod: WorkerAuthenticationMethod;
  adminAuthenticationMethod: AdminAuthenticationMethod;
  /** Application-level recovery is available conceptually (see AccountRecoveryPolicy). */
  recoveryEnabled: boolean;
  /**
   * Workers never use passwords in this product model.
   * Clients never use passwords.
   * Only the principal admin uses password (backend-managed later).
   */
  workerRequiresPassword: false;
  clientRequiresPassword: false;
  identityProvider: IdentityProviderIntegration;
}

export function normalizeEmailDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^@/, "");
}

export function extractEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");

  if (at < 0 || at === normalized.length - 1) {
    return null;
  }

  return normalizeEmailDomain(normalized.slice(at + 1));
}

/**
 * Pure check against configurable domains.
 * Does not grant access by itself — authorization remains User + Role + Session.
 */
export function isEmailDomainAllowed(
  email: string,
  policy: Pick<InternalAccessPolicy, "allowedEmailDomains">,
) {
  const domain = extractEmailDomain(email);

  if (!domain) {
    return false;
  }

  const allowed = policy.allowedEmailDomains.map(normalizeEmailDomain);
  return allowed.includes(domain);
}

export function isWorkerEmailCompliant(
  email: string,
  policy: Pick<
    InternalAccessPolicy,
    "allowedEmailDomains" | "requireCorporateEmailForWorkers"
  >,
) {
  if (!policy.requireCorporateEmailForWorkers) {
    return true;
  }

  return isEmailDomainAllowed(email, policy);
}
