import type { InternalAccessPolicy } from "@/domain";

/**
 * Mock / composition policy only — not production enforcement.
 *
 * `altana.test` is MOCK / DEVELOPMENT ONLY.
 * It exists so current test fixtures keep working before corporate mail exists.
 * It must never be treated as a production corporate domain.
 *
 * Principal admin password login is identity-based (user id + Credential),
 * not domain-based. A Gmail mailbox for the principal admin is valid even
 * though gmail.com is not listed here — this list is for worker invitations.
 *
 * Production domains belong in configuration / environment-backed policy later
 * (e.g. altanapromotora.com) without changing Presentation components.
 */
export const internalAccessPolicy: InternalAccessPolicy = {
  allowedEmailDomains: [
    "altanapromotora.com",
    /** MOCK / DEVELOPMENT ONLY — replace via config for production. */
    "altana.test",
  ],
  requireCorporateEmailForWorkers: true,
  workerAuthenticationMethod: "temporary_code",
  adminAuthenticationMethod: "password",
  recoveryEnabled: true,
  workerRequiresPassword: false,
  clientRequiresPassword: false,
  identityProvider: {
    /** Google OAuth is implemented as identity proof, not authorization. */
    googleWorkspacePrepared: true,
    identityProviderIsSoleAuthority: false,
  },
};
