import { NextResponse } from "next/server";

import type { PersistedContactSettings } from "@/domain/site-configuration";
import { requireCatalogWriteAccess } from "@/backend/services/authorize-service";
import { auditActorFromUser, recordAuditEntry } from "@/backend/services/audit-service";
import { updateSiteContact } from "@/backend/services/site-settings-service";

function parseContactPayload(body: unknown): PersistedContactSettings | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Record<string, unknown>;
  const contact: PersistedContactSettings = {};

  if (Array.isArray(payload.emails)) {
    contact.emails = payload.emails as PersistedContactSettings["emails"];
  }
  if (Array.isArray(payload.phones)) {
    contact.phones = payload.phones as PersistedContactSettings["phones"];
  }
  if (typeof payload.address === "string") {
    contact.address = payload.address;
  }
  if (Array.isArray(payload.socialLinks)) {
    contact.socialLinks =
      payload.socialLinks as PersistedContactSettings["socialLinks"];
  }

  return contact;
}

export async function PUT(request: Request) {
  const auth = await requireCatalogWriteAccess("contact_settings.manage", {
    route: "/api/admin/site-settings/contact",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const contact = parseContactPayload(body);
  if (!contact) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  await updateSiteContact(contact);

  const actor = auditActorFromUser(auth.context.user);
  if (actor) {
    await recordAuditEntry({
      actor,
      action: "updated",
      entityType: "site_configuration",
      entityId: "default",
      entityLabel: "Información de contacto",
    });
  }

  return NextResponse.json({ ok: true });
}
