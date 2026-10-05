import type { SecurityRateLimitPolicy } from "@/domain";

export const securityRateLimitPolicy: SecurityRateLimitPolicy = {
  maxAttempts: 10,
  windowSeconds: 120,
  temporaryBlockSeconds: 300,
  scope: "combination",
  permanentBlockAllowed: false,
};
