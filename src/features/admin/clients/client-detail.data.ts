import { getClientDetailForAdmin } from "@/backend/services/client-service";

import type { ClientDetailPageData } from "./clients.types";

export async function getClientDetailPageData(
  id: string,
): Promise<ClientDetailPageData | null> {
  return getClientDetailForAdmin(id);
}
