import {
  requireInternalAccess,
  requirePermission,
  requirePrincipalAdmin,
} from "@/backend/services/authorize-service";
import type { ResolvedAuthContext } from "@/backend/services/session-service";

export type AdminPageGateRequirement =
  | { type: "internal" }
  | { type: "permission"; permission: string }
  | { type: "principal" };

export type AdminPageGateResult =
  | { ok: true; context: ResolvedAuthContext }
  | { ok: false; status: 401 | 403 };

export async function gateAdminPage(
  requirement: AdminPageGateRequirement,
): Promise<AdminPageGateResult> {
  if (requirement.type === "internal") {
    const context = await requireInternalAccess();
    if (!context.access.allowed || !context.user) {
      const unauthenticated =
        context.access.reason === "session_missing" ||
        context.access.reason === "session_expired" ||
        context.access.reason === "visitor";

      return {
        ok: false,
        status: unauthenticated ? 401 : 403,
      };
    }

    return { ok: true, context };
  }

  if (requirement.type === "principal") {
    const auth = await requirePrincipalAdmin();
    if (!auth.ok) {
      return { ok: false, status: auth.status };
    }
    return { ok: true, context: auth.context };
  }

  const auth = await requirePermission(requirement.permission);
  if (!auth.ok) {
    return { ok: false, status: auth.status };
  }

  return { ok: true, context: auth.context };
}

/** Permission keys aligned with navigation and API routes. */
export const adminPagePermissions = {
  projects: "projects.manage",
  properties: "properties.manage",
  availability: "availability.manage",
  pageContent: "page_content.manage",
  contactSettings: "contact_settings.manage",
  media: "media.manage",
  appointments: "appointments.read",
  clients: "clients.view",
  contactRequests: "contact-requests.read",
  notifications: "notifications.view",
  history: "history.view",
  users: "users.manage",
} as const;
