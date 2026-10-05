import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import { assignSectionBackground } from "@/backend/services/media-service";
import { isSectionBackgroundType } from "@/backend/services/public-section-background-service";
import { listSectionBackgroundAdminRows } from "@/backend/services/section-background-admin-service";

export async function GET() {
  const auth = await requirePermission("page_content.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const backgrounds = await listSectionBackgroundAdminRows();

  return NextResponse.json({ backgrounds });
}

export async function PUT(request: Request) {
  const auth = await requirePermission("page_content.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const pageKey = typeof payload.pageKey === "string" ? payload.pageKey : "";
  const sectionKey =
    typeof payload.sectionKey === "string" ? payload.sectionKey : "";
  const backgroundType =
    typeof payload.backgroundType === "string" ? payload.backgroundType : "";

  if (!pageKey || !sectionKey || !isSectionBackgroundType(backgroundType)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await assignSectionBackground({
    pageKey,
    sectionKey,
    backgroundType,
    mediaAssetId:
      typeof payload.mediaAssetId === "string" ? payload.mediaAssetId : null,
    posterMediaAssetId:
      typeof payload.posterMediaAssetId === "string"
        ? payload.posterMediaAssetId
        : null,
    backgroundToken:
      typeof payload.backgroundToken === "string"
        ? payload.backgroundToken
        : null,
    actor: auditActorFromUser(auth.context.user) ?? undefined,
  });

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ config: result.config });
}
