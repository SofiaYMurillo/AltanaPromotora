/**
 * Server-only admin helpers (authorization gates). Import from route handlers
 * and server components — never from client components.
 */
export {
  adminPagePermissions,
  gateAdminPage,
  type AdminPageGateRequirement,
} from "./guards/gate-admin-page";
export { requireAdminPage } from "./guards/require-admin-page";
