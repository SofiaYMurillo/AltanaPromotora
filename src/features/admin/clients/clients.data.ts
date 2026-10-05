import { listClientsForAdmin } from "@/backend/services/client-service";

import type { ClientsPageData } from "./clients.types";

export async function getClientsPageData(): Promise<ClientsPageData> {
  const clients = await listClientsForAdmin();
  return { clients };
}
