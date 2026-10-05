/**
 * Future rate-limiting contract.
 * No permanent blocks — temporary mitigation only (backend).
 */

export type SecurityRateLimitScope =
  | "account"
  | "ip"
  | "route"
  | "combination";

export interface SecurityRateLimitPolicy {
  maxAttempts: number;
  windowSeconds: number;
  temporaryBlockSeconds: number;
  scope: SecurityRateLimitScope;
  /** Permanent lockout is intentionally forbidden by product policy. */
  permanentBlockAllowed: false;
}
