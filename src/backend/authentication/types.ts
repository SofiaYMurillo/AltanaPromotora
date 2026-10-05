/**
 * Authentication method contracts — interchangeable strategies.
 * Identity, Session, and Authorization remain independent.
 */

export type AuthenticationMethod = "password" | "invitation_code";

export type AuthenticationChallenge = {
  method: AuthenticationMethod;
  email: string;
};

/**
 * Unsupported challenges use a single opaque reason so the public challenge
 * API does not enumerate account state (inactive / client / missing invite).
 */
export type AuthenticationChallengeResult =
  | AuthenticationChallenge
  | {
      method: "unsupported";
      email: string;
      reason: "not_allowed";
    };

export type LoginResult =
  | {
      ok: true;
      token: string;
      expiresAt: Date;
      userId: string;
    }
  | {
      ok: false;
      error:
        | "invalid_credentials"
        | "inactive"
        | "unauthorized"
        | "rate_limited"
        | "password_not_configured"
        | "expired"
        | "revoked";
      retryAfterSeconds?: number;
    };
