/**
 * Auth composition constants.
 *
 * PRINCIPAL_ADMIN_USER_ID is the seed-default principal id for pure helpers.
 * Server authority must prefer process.env via getPrincipalAdminUserId().
 */
export const PRINCIPAL_ADMIN_USER_ID = "user-practicantes-001";

/**
 * Canonical principal-admin login email.
 * Password login looks up this address (case-insensitive) on the principal user.
 */
export const PRINCIPAL_ADMIN_EMAIL = "altanapromotorapracticantes@gmail.com";

/**
 * Extra spellings that still resolve to the principal mailbox.
 */
export const PRINCIPAL_ADMIN_EMAIL_ALIASES = [] as const;

/** Extra Gmail accounts allowed to enter the panel via Google (not principal admin). */
export const GOOGLE_AUTHORIZED_EMAILS = [
  "altanapromotorapracticantes@gmail.com",
] as const;

export const GOOGLE_PRACTICANTES_USER_ID = "user-practicantes-001";
