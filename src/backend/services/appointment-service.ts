import {
  canTransitionAppointmentStatus,
  normalizeClientEmail,
  normalizeClientPhone,
} from "@/domain";
import type {
  Appointment,
  AppointmentStatus,
  AuditActor,
  Client,
} from "@/domain";
import type { AvailabilityErrorCode } from "@/domain/availability-errors";
import { resolveAvailabilityQuery } from "@/domain/availability-resources";
import { isWorker } from "@/features/auth/access";

import {
  toAdminAppointmentView,
  type AdminAppointmentView,
} from "../mappers/admin-appointment-mapper";
import {
  loadVisitResourceDisplays,
  visitResourceDisplayKey,
} from "../catalog/visit-resource-display";
import * as appointmentRepository from "../repositories/appointment-repository";
import type { AppointmentListFilters } from "../repositories/appointment-repository";
import * as roleRepository from "../repositories/role-repository";
import * as userRepository from "../repositories/user-repository";
import { notifyInternalUsersOfNewAppointment } from "./appointment-notification-service";
import { recordAuditEntry } from "./audit-service";
import { resolveBookableSlot } from "./availability-service";

function appointmentResourceRef(appointment: Appointment) {
  return {
    type: appointment.type,
    resourceId:
      appointment.type === "property"
        ? appointment.propertyId
        : appointment.officeLocationId,
  };
}

export type AppointmentWriteOptions = {
  actor?: AuditActor | null;
};

export type CreateAppointmentInput = Omit<Appointment, "id" | "status"> & {
  id?: string;
  status?: AppointmentStatus;
};

export type CreatePublicAppointmentError =
  | "property_required"
  | "office_required"
  | AvailabilityErrorCode
  | "slot_unavailable";

export type AdminAppointmentListFilters = AppointmentListFilters & {
  search?: string;
};

export type { AdminAppointmentView };

const ADMIN_STATUS_PATCH_FIELDS = new Set(["status", "expectedStatus"]);
const ADMIN_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export type AdminAppointmentStatusPatchError =
  | "invalid_body"
  | "forbidden_field"
  | "invalid_status";

export function parseAdminAppointmentStatusPatch(body: unknown):
  | {
      ok: true;
      status: AppointmentStatus;
      expectedStatus?: AppointmentStatus;
    }
  | { ok: false; error: AdminAppointmentStatusPatchError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const input = body as Record<string, unknown>;

  for (const key of Object.keys(input)) {
    if (!ADMIN_STATUS_PATCH_FIELDS.has(key)) {
      return { ok: false, error: "forbidden_field" };
    }
  }

  if (
    typeof input.status !== "string" ||
    !ADMIN_STATUSES.includes(input.status as AppointmentStatus)
  ) {
    return { ok: false, error: "invalid_status" };
  }

  const expectedStatus =
    typeof input.expectedStatus === "string" &&
    ADMIN_STATUSES.includes(input.expectedStatus as AppointmentStatus)
      ? (input.expectedStatus as AppointmentStatus)
      : undefined;

  return {
    ok: true,
    status: input.status as AppointmentStatus,
    expectedStatus,
  };
}

function matchesAdminSearch(
  appointment: Appointment,
  client: Client | null,
  search: string,
) {
  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const values = [
    client?.firstName,
    client?.lastName,
    client?.email,
    client?.phone,
    appointment.contact?.email
      ? normalizeClientEmail(appointment.contact.email)
      : undefined,
    appointment.contact?.phone
      ? normalizeClientPhone(appointment.contact.phone)
      : undefined,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return values.some((value) => value.includes(query));
}

async function resolveWorkerView(assignedWorkerId?: string) {
  if (!assignedWorkerId) {
    return null;
  }

  const user = await userRepository.findUserById(assignedWorkerId);
  if (!user) {
    return { id: assignedWorkerId, displayName: "Trabajador no disponible" };
  }

  return {
    id: user.id,
    displayName: `${user.firstName} ${user.lastName}`,
  };
}

export async function listAppointmentsForAdmin(
  filters: AdminAppointmentListFilters = {},
) {
  return appointmentRepository.listAppointments(filters);
}

export async function listAdminAppointments(
  filters: AdminAppointmentListFilters = {},
): Promise<AdminAppointmentView[]> {
  const records = await appointmentRepository.listAppointmentRecords(filters);
  const searched = filters.search
    ? records.filter((record) =>
        matchesAdminSearch(record.appointment, record.client, filters.search!),
      )
    : records;

  const displays = await loadVisitResourceDisplays(
    searched.map((record) => appointmentResourceRef(record.appointment)),
  );

  return Promise.all(
    searched.map(async (record) =>
      toAdminAppointmentView({
        ...record,
        worker: await resolveWorkerView(record.appointment.assignedWorkerId),
        resource:
          displays.get(
            visitResourceDisplayKey(appointmentResourceRef(record.appointment)),
          )!,
      }),
    ),
  );
}

export async function getAdminAppointment(
  id: string,
): Promise<AdminAppointmentView | null> {
  const record = await appointmentRepository.getAppointmentRecord(id);
  if (!record) {
    return null;
  }

  const displays = await loadVisitResourceDisplays([
    appointmentResourceRef(record.appointment),
  ]);

  return toAdminAppointmentView({
    ...record,
    worker: await resolveWorkerView(record.appointment.assignedWorkerId),
    resource:
      displays.get(
        visitResourceDisplayKey(appointmentResourceRef(record.appointment)),
      )!,
  });
}

export async function createPublicAppointment(input: CreateAppointmentInput) {
  const appointment: Appointment = {
    id: input.id ?? `appointment-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    type: input.type,
    propertyId: input.propertyId,
    officeLocationId: input.officeLocationId,
    date: input.date,
    time: input.time,
    status: input.status ?? "pending",
    communicationPreference: input.communicationPreference,
    contact: input.contact,
    assignedWorkerId: undefined,
  };

  if (appointment.type === "property" && !appointment.propertyId) {
    return { ok: false as const, error: "property_required" as const };
  }

  if (appointment.type === "office" && !appointment.officeLocationId) {
    return { ok: false as const, error: "office_required" as const };
  }

  const availabilityResource = resolveAvailabilityQuery({
    visitType: appointment.type,
    propertyId: appointment.propertyId,
    officeLocationId: appointment.officeLocationId,
  });

  if (!availabilityResource.ok) {
    return { ok: false as const, error: availabilityResource.error };
  }

  const bookable = await resolveBookableSlot({
    resourceType: availabilityResource.resourceType,
    resourceId: availabilityResource.resourceId,
    date: appointment.date,
    time: appointment.time,
  });

  if (!bookable.ok) {
    return { ok: false as const, error: bookable.error };
  }

  const result = await appointmentRepository.createAppointmentIfCapacity(
    appointment,
    bookable.slot.slotCapacity,
  );

  if (!result.ok) {
    return { ok: false as const, error: "slot_unavailable" as const };
  }

  try {
    await notifyInternalUsersOfNewAppointment(result.appointment);
  } catch {
    // Notifications must not block public booking.
  }

  return { ok: true as const, appointment: result.appointment };
}

export async function updateAppointmentStatus(
  id: string,
  nextStatus: AppointmentStatus,
  expectedStatus?: AppointmentStatus,
  options: AppointmentWriteOptions = {},
) {
  const existing = await appointmentRepository.getAppointmentById(id);

  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (expectedStatus && existing.status !== expectedStatus) {
    return { ok: false as const, error: "conflict" as const };
  }

  if (!canTransitionAppointmentStatus(existing.status, nextStatus)) {
    return { ok: false as const, error: "invalid_transition" as const };
  }

  const updated = await appointmentRepository.updateAppointmentStatusIfCurrent({
    id,
    expectedStatus: existing.status,
    nextStatus,
  });

  if (!updated.ok) {
    return {
      ok: false as const,
      error: updated.reason === "not_found" ? "not_found" as const : "conflict" as const,
    };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "status_changed",
    entityType: "appointment",
    entityId: updated.appointment.id,
    entityLabel: `${updated.appointment.date} ${updated.appointment.time}`,
    metadata: {
      previousStatus: existing.status,
      status: updated.appointment.status,
      visitType: updated.appointment.type,
    },
  });

  return { ok: true as const, appointment: updated.appointment };
}

export async function assignAppointmentWorker(
  id: string,
  assignedWorkerId: string | null,
  options: AppointmentWriteOptions = {},
) {
  const existing = await appointmentRepository.getAppointmentById(id);

  if (!existing) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (assignedWorkerId) {
    const worker = await userRepository.findUserById(assignedWorkerId);
    if (!worker || !worker.active) {
      return { ok: false as const, error: "invalid_worker" as const };
    }

    const roles = await roleRepository.getRolesForUser(assignedWorkerId);
    if (!isWorker(roles)) {
      return { ok: false as const, error: "invalid_worker" as const };
    }
  }

  const updated = await appointmentRepository.updateAppointment(id, {
    assignedWorkerId: assignedWorkerId ?? undefined,
  });

  if (!updated) {
    return { ok: false as const, error: "not_found" as const };
  }

  await recordAuditEntry({
    actor: options.actor,
    action: "updated",
    entityType: "appointment",
    entityId: updated.id,
    entityLabel: `${updated.date} ${updated.time}`,
    metadata: {
      field: "assignedWorkerId",
      previousAssignedWorkerId: existing.assignedWorkerId ?? null,
      assignedWorkerId: updated.assignedWorkerId ?? null,
    },
  });

  return { ok: true as const, appointment: updated };
}
