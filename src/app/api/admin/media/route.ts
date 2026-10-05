import { NextResponse } from "next/server";

import { requirePermission } from "@/backend/services/authorize-service";
import { auditActorFromUser } from "@/backend/services/audit-service";
import {
  listAdminMediaAssets,
  uploadMediaAsset,
} from "@/backend/services/media-service";

export async function GET(request: Request) {
  const auth = await requirePermission("media.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  const kind =
    kindParam === "image" || kindParam === "video" ? kindParam : undefined;
  const search = searchParams.get("search") ?? undefined;

  const result = await listAdminMediaAssets({ kind, search });
  return NextResponse.json({ assets: result.assets });
}

export async function POST(request: Request) {
  const auth = await requirePermission("media.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_missing" }, { status: 400 });
  }

  const result = await uploadMediaAsset({
    file,
    actor: auditActorFromUser(auth.context.user) ?? undefined,
  });

  if (!result.ok) {
    const status =
      result.error === "file_too_large"
        ? 413
        : result.error === "file_type_not_allowed"
          ? 415
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ asset: result.asset }, { status: 201 });
}
