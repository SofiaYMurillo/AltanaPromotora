import type { Appointment, Client, ClientContactInput } from "@/domain";

import * as clientRepository from "../repositories/client-repository";

export type ClientListItem = {
  client: Client;
  appointmentCount: number;
};

export type ClientDetail = {
  client: Client;
  appointments: Appointment[];
};

export async function resolveOrCreateClient(
  contact: ClientContactInput | undefined,
) {
  return clientRepository.resolveOrCreateFromContact(contact);
}

export async function getClientById(id: string) {
  return clientRepository.findById(id);
}

export async function listClientsForAdmin(): Promise<ClientListItem[]> {
  return clientRepository.listWithAppointmentCounts();
}

export async function getClientDetailForAdmin(
  id: string,
): Promise<ClientDetail | null> {
  return clientRepository.findDetailById(id);
}
