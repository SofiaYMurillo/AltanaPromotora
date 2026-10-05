import { NextResponse } from "next/server";

import type { AvailabilityResourceType } from "@/domain";
import { getPublicAvailability } from "@/backend/services/availability-service";

function isResourceType(value: string | null): value is AvailabilityResourceType {
  return value === "property" || value === "office";
}

function statusForError(error: string) {
  switch (error) {
    case "invalid_resource":
      return 404;
    case "invalid_date":
    case "invalid_time":
      return 400;
    case "no_availability":
    case "unavailable_slot":
    case "capacity_exceeded":
      return 409;
    default:
      return 500;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get("resourceType");
  const resourceId = searchParams.get("resourceId");
  const date = searchParams.get("date") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const visitPropertyId = searchParams.get("propertyId")?.trim() || undefined;

  if (!isResourceType(resourceType) || !resourceId) {
    return NextResponse.json({ error: "invalid_resource" }, { status: 400 });
  }

  try {
    const result = await getPublicAvailability({
      resourceType,
      resourceId,
      visitPropertyId:
        resourceType === "property" ? visitPropertyId : undefined,
      date,
      from,
      to,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: statusForError(result.error) },
      );
    }

    return NextResponse.json({
      resourceType: result.resourceType,
      resourceId: result.resourceId,
      days: result.days,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
