import type { Appointment, Client } from "@/domain";

export type ClientListItemView = {
  client: Client;
  appointmentCount: number;
};

export type ClientsPageData = {
  clients: ClientListItemView[];
};

export type ClientDetailPageData = {
  client: Client;
  appointments: Appointment[];
};
