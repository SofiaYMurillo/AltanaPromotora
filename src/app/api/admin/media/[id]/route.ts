import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import * as mediaRepository from "@/backend/repositories/media-repository";
import {
  deleteMediaAsset,
  updateMediaAssetAlt,
} from "@/backend/services/media-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requirePermission("media.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const asset = await mediaRepository.getMediaAssetById(id);
  if (!asset) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ asset });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requirePermission("media.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const alt =
    body &&
    typeof body === "object" &&
    "alt" in body &&
    typeof (body as { alt: unknown }).alt === "string"
      ? (body as { alt: string }).alt
      : null;

  if (alt === null) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await updateMediaAssetAlt({
    id,
    alt,
    actor: auditActorFromUser(auth.context.user) ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ asset: result.asset });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requirePermission("media.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const result = await deleteMediaAsset({
    id,
    actor: auditActorFromUser(auth.context.user) ?? undefined,
  });

  if (!result.ok) {
    const status = result.error === "in_use" ? 409 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
