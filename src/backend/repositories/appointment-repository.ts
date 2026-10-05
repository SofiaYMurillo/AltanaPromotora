import { CAPACITY_CONSUMING_STATUSES } from "@/domain";
import type { Appointment, AppointmentVisitType, Client } from "@/domain";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "../db";
import {
  toDomainAppointment,
  toPrismaAppointmentData,
} from "../mappers/appointment-mapper";
import { toDomainClient } from "../mappers/client-mapper";
import * as clientRepository from "./client-repository";

export async function countAppointmentsByPropertyId(propertyId: string) {
  return prisma.appointment.count({
    where: { propertyId },
  });
}

function occupyingSlotWhere(appointment: Appointment) {
  return {
    date: appointment.date,
    time: appointment.time,
    status: { in: [...CAPACITY_CONSUMING_STATUSES] },
    ...(appointment.type === "property"
      ? { type: "property" as const, propertyId: appointment.propertyId }
      : {
          type: "office" as const,
          officeLocationId: appointment.officeLocationId,
        }),
  };
}

export type AppointmentListFilters = {
  status?: Appointment["status"];
  type?: Appointment["type"];
  date?: string;
  from?: string;
  to?: string;
  resourceType?: AppointmentVisitType;
  resourceId?: string;
};

export type AppointmentRecord = {
  appointment: Appointment;
  createdAt: string;
  updatedAt: string;
};

function appointmentWhere(filters: AppointmentListFilters) {
  const dateFilter = filters.date
    ? { date: filters.date }
    : filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {};

  const resourceFilter =
    filters.resourceType === "property"
      ? {
          type: "property" as const,
          ...(filters.resourceId ? { propertyId: filters.resourceId } : {}),
        }
      : filters.resourceType === "office"
        ? {
            type: "office" as const,
            ...(filters.resourceId
              ? { officeLocationId: filters.resourceId }
              : {}),
          }
        : filters.type
          ? { type: filters.type }
          : {};

  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...dateFilter,
    ...resourceFilter,
  };
}

export async function listAppointments(
  filters: AppointmentListFilters = {},
): Promise<Appointment[]> {
  const rows = await prisma.appointment.findMany({
    where: appointmentWhere(filters),
    orderBy: [{ date: "desc" }, { time: "asc" }],
  });

  return rows.map(toDomainAppointment);
}

export async function getAppointmentById(
  id: string,
): Promise<Appointment | null> {
  const row = await prisma.appointment.findUnique({ where: { id } });
  return row ? toDomainAppointment(row) : null;
}

export async function listAppointmentRecords(
  filters: AppointmentListFilters = {},
): Promise<
  Array<AppointmentRecord & { client: Client | null }>
> {
  const rows = await prisma.appointment.findMany({
    where: appointmentWhere(filters),
    include: { client: true },
    orderBy: [{ date: "desc" }, { time: "asc" }],
  });

  return rows.map((row) => ({
    appointment: toDomainAppointment(row),
    client: row.client ? toDomainClient(row.client) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getAppointmentRecord(
  id: string,
): Promise<(AppointmentRecord & { client: Client | null }) | null> {
  const row = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!row) {
    return null;
  }

  return {
    appointment: toDomainAppointment(row),
    client: row.client ? toDomainClient(row.client) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Writes a status only when the persisted status still matches `expectedStatus`.
 * Domain transition rules belong in the service, not here.
 */
export async function updateAppointmentStatusIfCurrent(input: {
  id: string;
  expectedStatus: Appointment["status"];
  nextStatus: Appointment["status"];
}): Promise<
  | { ok: true; appointment: Appointment }
  | { ok: false; reason: "not_found" | "conflict" }
> {
  return prisma.$transaction(
    async (tx) => {
      const row = await tx.appointment.findUnique({ where: { id: input.id } });

      if (!row) {
        return { ok: false as const, reason: "not_found" as const };
      }

      if (row.status !== input.expectedStatus) {
        return { ok: false as const, reason: "conflict" as const };
      }

      const updated = await tx.appointment.update({
        where: { id: input.id },
        data: { status: input.nextStatus },
      });

      return {
        ok: true as const,
        appointment: toDomainAppointment(updated),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );
}

export async function createAppointment(
  appointment: Appointment,
): Promise<Appointment> {
  const row = await prisma.appointment.create({
    data: toPrismaAppointmentData(appointment),
  });
  return toDomainAppointment(row);
}

export async function updateAppointment(
  id: string,
  patch: Partial<Appointment>,
): Promise<Appointment | null> {
  const existing = await prisma.appointment.findUnique({ where: { id } });

  if (!existing) {
    return null;
  }

  const merged = toDomainAppointment(existing);
  const next: Appointment = {
    ...merged,
    ...patch,
    id: merged.id,
    contact:
      patch.contact === undefined
        ? merged.contact
        : patch.contact ?? undefined,
  };

  const row = await prisma.appointment.update({
    where: { id },
    data: toPrismaAppointmentData(next),
  });

  return toDomainAppointment(row);
}

export async function listOccupyingAppointmentsForResource(input: {
  visitType: AppointmentVisitType;
  resourceId: string;
  from: string;
  to: string;
}): Promise<Pick<Appointment, "date" | "time" | "status">[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      status: { in: [...CAPACITY_CONSUMING_STATUSES] },
      date: { gte: input.from, lte: input.to },
      ...(input.visitType === "property"
        ? { type: "property", propertyId: input.resourceId }
        : { type: "office", officeLocationId: input.resourceId }),
    },
    select: { date: true, time: true, status: true },
  });

  return rows.map((row) => ({
    date: row.date,
    time: row.time,
    status: row.status as Appointment["status"],
  }));
}

/**
 * Transactional create that re-counts occupying appointments for this slot.
 *
 * SQLite (this project): a single writer is serialized by the database.
 * Prisma interactive transactions use Serializable isolation — the strongest
 * level the SQLite provider exposes. There is no unique (resource, date, time)
 * constraint because slotCapacity can be greater than 1.
 *
 * Do not replace this with a check-then-create outside the transaction.
 */
export async function createAppointmentIfCapacity(
  appointment: Appointment,
  capacity: number,
): Promise<{ ok: true; appointment: Appointment } | { ok: false; reason: "capacity" }> {
  return prisma.$transaction(
    async (tx) => {
      const occupied = await tx.appointment.count({
        where: occupyingSlotWhere(appointment),
      });

      if (occupied >= capacity) {
        return { ok: false as const, reason: "capacity" as const };
      }

      const client = await clientRepository.resolveOrCreateFromContact(
        appointment.contact,
        tx.client,
      );

      const row = await tx.appointment.create({
        data: toPrismaAppointmentData({
          ...appointment,
          clientId: client?.id,
        }),
      });

      return { ok: true as const, appointment: toDomainAppointment(row) };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );
}

export async function countAppointments() {
  return prisma.appointment.count();
}
