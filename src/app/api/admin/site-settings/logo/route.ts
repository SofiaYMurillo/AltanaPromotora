import { NextResponse } from "next/server";

import { requirePrincipalAdmin } from "@/backend/services/authorize-service";
import { auditActorFromUser, recordAuditEntry } from "@/backend/services/audit-service";
import { assignSiteLogo } from "@/backend/services/site-settings-service";

export async function PUT(request: Request) {
  const auth = await requirePrincipalAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const logoMediaAssetId =
    body &&
    typeof body === "object" &&
    (body as Record<string, unknown>).logoMediaAssetId === null
      ? null
      : typeof (body as Record<string, unknown>)?.logoMediaAssetId === "string"
        ? ((body as Record<string, unknown>).logoMediaAssetId as string)
        : undefined;

  if (logoMediaAssetId === undefined) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await assignSiteLogo({ logoMediaAssetId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const actor = auditActorFromUser(auth.context.user);
  if (actor) {
    await recordAuditEntry({
      actor,
      action: "updated",
      entityType: "site_configuration",
      entityId: "default",
      entityLabel: "Logo del sitio",
      metadata: { logoMediaAssetId },
    });
  }

  return NextResponse.json({ ok: true });
}
