import { redirect } from "next/navigation";

import { AccessDenied } from "@/features/auth";

import { AdminPermissionDenied } from "./AdminPermissionDenied";
import {
  gateAdminPage,
  type AdminPageGateRequirement,
} from "./gate-admin-page";

type RequireAdminPageOptions = {
  requirement: AdminPageGateRequirement;
  deniedDescription?: string;
};

/**
 * Server-side page guard: session + permission (or principal). Returns null when allowed.
 */
export async function requireAdminPage(options: RequireAdminPageOptions) {
  const gate = await gateAdminPage(options.requirement);

  if (gate.ok) {
    return { allowed: true as const, context: gate.context };
  }

  if (gate.status === 401) {
    redirect("/admin/login");
  }

  return {
    allowed: false as const,
    element: (
      <AdminPermissionDenied
        description={
          options.deniedDescription ??
          "No tienes permiso para acceder a esta sección."
        }
      />
    ),
  };
}
