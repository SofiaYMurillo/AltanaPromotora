/**
 * Identified contact for follow-up.
 * Distinct from internal User and from anonymous visitors.
 * No password / access code / session required.
 */

export interface Client {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientContactInput = {
  email?: string;
  phone?: string;
};

/**
 * Email identity key: trim + lowercase.
 * No extra RFC rules — matches the booking form.
 */
export function normalizeClientEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Phone identity key used by this product.
 * Keeps a leading "+" when present; otherwise digits only.
 * Does not attempt international numbering plans.
 */
export function normalizeClientPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "";
  }

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return hasPlus ? `+${digits}` : digits;
}

export type ClientIdentityLookup =
  | { kind: "email"; email: string; phone?: string }
  | { kind: "phone"; phone: string }
  | { kind: "none" };

/**
 * How to look up an existing Client from booking contact data.
 *
 * Email is the primary match when present.
 * Phone is used only when there is no email.
 * If identity is insufficient, do not merge.
 */
export function resolveClientIdentityLookup(
  input: ClientContactInput | undefined,
): ClientIdentityLookup {
  const email = input?.email ? normalizeClientEmail(input.email) : "";
  const phone = input?.phone ? normalizeClientPhone(input.phone) : "";

  if (email) {
    return phone ? { kind: "email", email, phone } : { kind: "email", email };
  }

  if (phone) {
    return { kind: "phone", phone };
  }

  return { kind: "none" };
}
