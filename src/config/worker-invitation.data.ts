import type { WorkerInvitation } from "@/types/worker-invitation";

export const workerInvitations: WorkerInvitation[] = [
  {
    id: "invitation-001",
    email: "worker@altana.test",
    roleId: "role-worker",
    active: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    tokenRef: "mock-token-worker-valid",
  },
  {
    id: "invitation-002",
    email: "nuevo-trabajador@altana.test",
    roleId: "role-worker",
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    expiresAt: "2026-07-02T00:00:00.000Z",
    tokenRef: "mock-token-worker-expired",
  },
  {
    id: "invitation-003",
    email: "revocado@altana.test",
    roleId: "role-worker",
    active: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    revokedAt: "2026-08-10T12:00:00.000Z",
    tokenRef: "mock-token-worker-revoked",
  },
  {
    id: "invitation-004",
    email: "usado@altana.test",
    roleId: "role-worker",
    active: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    usedAt: "2026-08-05T09:00:00.000Z",
    tokenRef: "mock-token-worker-used",
  },
];
