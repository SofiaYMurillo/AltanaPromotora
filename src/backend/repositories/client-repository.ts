import { randomUUID } from "node:crypto";

import type { Appointment, Client, ClientContactInput } from "@/domain";
import { resolveClientIdentityLookup } from "@/domain";

import { prisma } from "../db";
import { toDomainAppointment } from "../mappers/appointment-mapper";
import { toDomainClient } from "../mappers/client-mapper";

type ClientModel = {
  findUnique: typeof prisma.client.findUnique;
  findFirst: typeof prisma.client.findFirst;
  findMany: typeof prisma.client.findMany;
  create: typeof prisma.client.create;
  update: typeof prisma.client.update;
};

function prismaErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

export async function findById(
  id: string,
  clientModel: ClientModel = prisma.client,
): Promise<Client | null> {
  const row = await clientModel.findUnique({ where: { id } });
  return row ? toDomainClient(row) : null;
}

export async function findByNormalizedEmail(
  email: string,
  clientModel: ClientModel = prisma.client,
): Promise<Client | null> {
  const row = await clientModel.findUnique({ where: { email } });
  return row ? toDomainClient(row) : null;
}

export async function findByNormalizedPhone(
  phone: string,
  clientModel: ClientModel = prisma.client,
): Promise<Client | null> {
  const row = await clientModel.findFirst({ where: { phone } });
  return row ? toDomainClient(row) : null;
}

export async function createClient(
  input: {
    id?: string;
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
  clientModel: ClientModel = prisma.client,
): Promise<Client> {
  const row = await clientModel.create({
    data: {
      id: input.id ?? `client-${randomUUID()}`,
      email: input.email ?? null,
      phone: input.phone ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
    },
  });

  return toDomainClient(row);
}

export async function updateClient(
  id: string,
  patch: {
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
  clientModel: ClientModel = prisma.client,
): Promise<Client | null> {
  const existing = await clientModel.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await clientModel.update({
    where: { id },
    data: {
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
      ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
    },
  });

  return toDomainClient(row);
}

async function fillMissingPhone(
  existing: Client,
  phone: string | undefined,
  clientModel: ClientModel,
): Promise<Client> {
  if (!phone || existing.phone) {
    return existing;
  }

  const updated = await updateClient(existing.id, { phone }, clientModel);
  return updated ?? existing;
}

/**
 * Persistence of the Client identity key: find by email, else phone, else insert.
 * Matching rules come from domain; this layer only stores and retrieves.
 */
export async function resolveOrCreateFromContact(
  contact: ClientContactInput | undefined,
  clientModel: ClientModel = prisma.client,
): Promise<Client | null> {
  const lookup = resolveClientIdentityLookup(contact);

  if (lookup.kind === "none") {
    return null;
  }

  if (lookup.kind === "email") {
    const existing = await findByNormalizedEmail(lookup.email, clientModel);
    if (existing) {
      return fillMissingPhone(existing, lookup.phone, clientModel);
    }

    try {
      return await createClient(
        {
          email: lookup.email,
          phone: lookup.phone ?? null,
        },
        clientModel,
      );
    } catch (error) {
      if (prismaErrorCode(error) === "P2002") {
        const raced = await findByNormalizedEmail(lookup.email, clientModel);
        if (raced) {
          return fillMissingPhone(raced, lookup.phone, clientModel);
        }
      }

      throw error;
    }
  }

  const existingByPhone = await findByNormalizedPhone(lookup.phone, clientModel);
  if (existingByPhone) {
    return existingByPhone;
  }

  return createClient({ phone: lookup.phone }, clientModel);
}

export type ClientWithAppointmentCount = {
  client: Client;
  appointmentCount: number;
};

export async function listWithAppointmentCounts(): Promise<
  ClientWithAppointmentCount[]
> {
  const rows = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { appointments: true } } },
  });

  return rows.map((row) => ({
    client: toDomainClient(row),
    appointmentCount: row._count.appointments,
  }));
}

export type ClientDetailRecord = {
  client: Client;
  appointments: Appointment[];
};

export async function findDetailById(
  id: string,
): Promise<ClientDetailRecord | null> {
  const row = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: [{ date: "desc" }, { time: "desc" }],
      },
    },
  });

  if (!row) {
    return null;
  }

  return {
    client: toDomainClient(row),
    appointments: row.appointments.map(toDomainAppointment),
  };
}

export async function countClients() {
  return prisma.client.count();
}
