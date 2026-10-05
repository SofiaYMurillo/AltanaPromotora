import { NextResponse } from "next/server";

import {
  getAdminProfileView,
  updateCurrentUserProfileAvatar,
} from "@/backend/services/admin-profile-service";
import { requireInternalAccess } from "@/backend/services/authorize-service";

export async function GET() {
  const context = await requireInternalAccess();
  if (!context.access.allowed || !context.user) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: context.access.reason === "session_missing" ? 401 : 403 },
    );
  }

  const profile = await getAdminProfileView({
    user: context.user,
    isPrincipalAdmin: context.access.isPrincipalAdmin,
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const context = await requireInternalAccess();
  if (!context.access.allowed || !context.user) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: context.access.reason === "session_missing" ? 401 : 403 },
    );
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
  const profileMediaAssetId =
    payload.profileMediaAssetId === null
      ? null
      : typeof payload.profileMediaAssetId === "string"
        ? payload.profileMediaAssetId
        : undefined;

  if (profileMediaAssetId === undefined) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await updateCurrentUserProfileAvatar(
    context.user.id,
    profileMediaAssetId,
    context.access.isPrincipalAdmin,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ profile: result.profile });
}
