import { randomUUID } from "node:crypto";

import {
  canTransitionContactRequestStatus,
  isValidContactRequestStatus,
  normalizeClientEmail,
  normalizeClientPhone,
  normalizeContactName,
  validatePublicContactRequest,
} from "@/domain";
import type {
  AuditActor,
  ContactRequest,
  ContactRequestStatus,
} from "@/domain";

import * as contactRequestRepository from "../repositories/contact-request-repository";
import { recordAuditEntry } from "./audit-service";
import {
  getContactRequestThrottleStatus,
  registerContactRequestAttempt,
} from "../security/contact-request-rate-limit";

const PUBLIC_ALLOWED_FIELDS = new Set(["name", "email", "phone", "message"]);
const FORBIDDEN_PUBLIC_FIELDS = new Set([
  "id",
  "status",
  "createdAt",
  "updatedAt",
  "clientId",
  "assignedUserId",
  "assignedWorkerId",
  "handledBy",
]);

export type PublicContactRequestError =
  | "invalid_body"
  | "forbidden_field"
  | "invalid_name"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_message"
  | "missing_contact"
  | "rate_limited";

export type AdminContactRequestError =
  | "not_found"
  | "invalid_body"
  | "forbidden_field"
  | "invalid_status"
  | "invalid_transition";

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function parsePublicContactRequestInput(body: unknown):
  | {
      ok: true;
      name: string;
      email?: string;
      phone?: string;
      message: string;
    }
  | { ok: false; error: PublicContactRequestError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const input = body as Record<string, unknown>;
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_PUBLIC_FIELDS.has(key) || !PUBLIC_ALLOWED_FIELDS.has(key)) {
      return { ok: false, error: "forbidden_field" };
    }
  }

  const draft = {
    name: typeof input.name === "string" ? input.name : "",
    email: asOptionalString(input.email),
    phone: asOptionalString(input.phone),
    message: typeof input.message === "string" ? input.message : "",
  };

  const validation = validatePublicContactRequest(draft);
  if (validation) {
    return { ok: false, error: validation };
  }

  const email = draft.email ? normalizeClientEmail(draft.email) : undefined;
  const phone = draft.phone ? normalizeClientPhone(draft.phone) : undefined;

  return {
    ok: true,
    name: normalizeContactName(draft.name),
    email,
    phone,
    message: draft.message.trim(),
  };
}

export function parseAdminContactRequestStatusPatch(body: unknown):
  | { ok: true; status: ContactRequestStatus }
  | { ok: false; error: AdminContactRequestError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const input = body as Record<string, unknown>;
  const keys = Object.keys(input);
  if (keys.some((key) => key !== "status")) {
    return { ok: false, error: "forbidden_field" };
  }

  if (!isValidContactRequestStatus(input.status)) {
    return { ok: false, error: "invalid_status" };
  }

  return { ok: true, status: input.status };
}

export async function createPublicContactRequest(
  body: unknown,
  ipReference?: string,
) {
  const throttle = getContactRequestThrottleStatus(ipReference);
  if (throttle.blocked) {
    return { ok: false as const, error: "rate_limited" as const };
  }

  const parsed = parsePublicContactRequestInput(body);
  if (!parsed.ok) {
    return parsed;
  }

  const now = new Date().toISOString();
  const request: ContactRequest = {
    id: `contact-request-${randomUUID()}`,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    message: parsed.message,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const created = await contactRequestRepository.createContactRequest(request);
  registerContactRequestAttempt(ipReference);

  return {
    ok: true as const,
    contactRequest: created,
  };
}

export async function listAdminContactRequests(search?: string) {
  const requests = await contactRequestRepository.listContactRequests();
  const query = search?.trim().toLowerCase();
  if (!query) {
    return requests;
  }

  return requests.filter((item) =>
    [item.name, item.email, item.phone, item.message]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(query)),
  );
}

export async function getAdminContactRequest(id: string) {
  return contactRequestRepository.getContactRequestById(id);
}

export async function updateContactRequestStatus(
  id: string,
  nextStatus: ContactRequestStatus,
  options: { actor?: AuditActor | null } = {},
) {
  const existing = await contactRequestRepository.getContactRequestById(id);
  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (!canTransitionContactRequestStatus(existing.status, nextStatus)) {
    return { ok: false as const, error: "invalid_transition" as const };
  }

  const updated = await contactRequestRepository.updateContactRequestStatus(
    id,
    nextStatus,
  );
  if (!updated) {
    return { ok: false as const, error: "not_found" as const };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "status_changed",
    entityType: "contact_request",
    entityId: updated.id,
    entityLabel: updated.name,
    metadata: {
      previousStatus: existing.status,
      status: updated.status,
    },
  });

  return { ok: true as const, contactRequest: updated };
}
