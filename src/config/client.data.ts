import type { Client } from "@/domain";

/**
 * Seed fixture for the example public appointment.
 * Not a runtime source of truth — admin and booking read SQLite via ClientRepository.
 */
export const clients: Client[] = [
  {
    id: "client-001",
    email: "visita@ejemplo.com",
    firstName: "Visitante",
    lastName: "Ejemplo",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];
