/**
 * Process-local public contact-request throttle.
 * Not distributed. Does not affect administrative operations.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Bucket = {
  count: number;
  windowStartedAt: number;
};

const buckets = new Map<string, Bucket>();

function keyFor(ipReference?: string) {
  return ipReference?.trim() || "unknown";
}

export function getContactRequestThrottleStatus(ipReference?: string) {
  const key = keyFor(ipReference);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    return { blocked: false as const };
  }

  if (now - bucket.windowStartedAt > WINDOW_MS) {
    buckets.delete(key);
    return { blocked: false as const };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return {
      blocked: true as const,
      retryAfterSeconds: Math.ceil(
        (bucket.windowStartedAt + WINDOW_MS - now) / 1000,
      ),
    };
  }

  return { blocked: false as const };
}

export function registerContactRequestAttempt(ipReference?: string) {
  const key = keyFor(ipReference);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartedAt > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { count: 1, blocked: false };
  }

  const count = existing.count + 1;
  buckets.set(key, { count, windowStartedAt: existing.windowStartedAt });
  return { count, blocked: count > MAX_ATTEMPTS };
}
