import { securityRateLimitPolicy } from "@/config/security-rate-limit-policy.data";

type AttemptBucket = {
  count: number;
  windowStartedAt: number;
  blockedUntil?: number;
};

/**
 * Process-local login rate limit (not distributed).
 * Uses SecurityRateLimitPolicy contract values.
 * permanentBlockAllowed remains false.
 */
const buckets = new Map<string, AttemptBucket>();

function bucketKey(email: string, ipReference?: string) {
  return `${email.trim().toLowerCase()}|${ipReference ?? "unknown"}`;
}

export function getLoginThrottleStatus(email: string, ipReference?: string) {
  const key = bucketKey(email, ipReference);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    return { blocked: false as const };
  }

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      blocked: true as const,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  if (
    now - bucket.windowStartedAt >
    securityRateLimitPolicy.windowSeconds * 1000
  ) {
    buckets.delete(key);
    return { blocked: false as const };
  }

  return { blocked: false as const };
}

export function registerFailedLoginAttempt(
  email: string,
  ipReference?: string,
) {
  const key = bucketKey(email, ipReference);
  const now = Date.now();
  const windowMs = securityRateLimitPolicy.windowSeconds * 1000;
  const existing = buckets.get(key);

  if (
    !existing ||
    now - existing.windowStartedAt > windowMs
  ) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { repeated: false, count: 1 };
  }

  const count = existing.count + 1;
  const blocked =
    count >= securityRateLimitPolicy.maxAttempts
      ? {
          count,
          windowStartedAt: existing.windowStartedAt,
          blockedUntil:
            now + securityRateLimitPolicy.temporaryBlockSeconds * 1000,
        }
      : {
          count,
          windowStartedAt: existing.windowStartedAt,
          blockedUntil: existing.blockedUntil,
        };

  buckets.set(key, blocked);

  return {
    repeated: count >= securityRateLimitPolicy.maxAttempts,
    count,
  };
}

export function clearLoginAttempts(email: string, ipReference?: string) {
  buckets.delete(bucketKey(email, ipReference));
}
