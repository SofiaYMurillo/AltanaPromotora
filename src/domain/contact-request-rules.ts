import {
  normalizeClientEmail,
  normalizeClientPhone,
} from "./client";
import type {
  ContactRequestStatus,
  PublicContactRequestInput,
} from "./contact-request";
import { CONTACT_REQUEST_STATUSES } from "./contact-request";

export type PublicContactRequestValidationError =
  | "invalid_name"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_message"
  | "missing_contact";

export type ContactRequestValidationError =
  | PublicContactRequestValidationError
  | "invalid_status"
  | "invalid_transition"
  | "forbidden_field"
  | "invalid_body";

const MAX_NAME = 160;
const MAX_MESSAGE = 4000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidContactRequestStatus(
  value: unknown,
): value is ContactRequestStatus {
  return (
    typeof value === "string" &&
    CONTACT_REQUEST_STATUSES.includes(value as ContactRequestStatus)
  );
}

export function getAllowedContactRequestTransitions(
  status: ContactRequestStatus,
): ContactRequestStatus[] {
  switch (status) {
    case "pending":
      return ["responded", "closed"];
    case "responded":
      return ["closed"];
    case "closed":
      return [];
    default:
      return [];
  }
}

export function canTransitionContactRequestStatus(
  from: ContactRequestStatus,
  to: ContactRequestStatus,
) {
  return getAllowedContactRequestTransitions(from).includes(to);
}

export function validatePublicContactRequest(
  input: PublicContactRequestInput,
): PublicContactRequestValidationError | null {
  const name = normalizeContactName(input.name);
  if (!name || name.length > MAX_NAME) {
    return "invalid_name";
  }

  const message = input.message.trim();
  if (!message || message.length > MAX_MESSAGE) {
    return "invalid_message";
  }

  const email = input.email?.trim() ? normalizeClientEmail(input.email) : "";
  const phone = input.phone?.trim() ? normalizeClientPhone(input.phone) : "";

  if (email && !EMAIL_PATTERN.test(email)) {
    return "invalid_email";
  }

  if (input.phone?.trim() && !phone) {
    return "invalid_phone";
  }

  if (!email && !phone) {
    return "missing_contact";
  }

  return null;
}
