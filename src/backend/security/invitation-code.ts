import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Invitation code helpers — server only.
 * Codes are shown once at creation; only hashes are persisted.
 */

export function createInvitationCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function normalizeInvitationCode(code: string): string {
  return code.trim().toUpperCase();
}

export function hashInvitationCode(code: string): string {
  return createHash("sha256")
    .update(normalizeInvitationCode(code))
    .digest("hex");
}

export function verifyInvitationCode(code: string, storedHash: string): boolean {
  const actual = Buffer.from(hashInvitationCode(code), "hex");
  const expected = Buffer.from(storedHash, "hex");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
