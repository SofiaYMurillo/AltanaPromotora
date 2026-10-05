import { redirect } from "next/navigation";

import { AccessDenied } from "@/features/auth";
import { AdminShell } from "@/features/admin";
import type { AdminShellData } from "@/features/admin/admin.types";
import {
  adminNavigation,
  filterAdminNavigation,
} from "@/features/admin/navigation/navigation.data";
import {
  listEffectivePermissionNames,
  requireInternalAccess,
} from "@/backend/services/authorize-service";
import { getAdminProfileView } from "@/backend/services/admin-profile-service";
import { resolvePublicSiteSettings } from "@/backend/services/site-settings-service";
import { recordSecurityEvent } from "@/backend/services/security-event-service";
import { countUnreadNotifications } from "@/backend/services/notification-service";

/**
 * Real internal gate: cookie → Session → User → Roles → canAccessAdmin.
 * Session authority is the persisted cookie, never a static catalog.
 */
export default async function AdminInternalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireInternalAccess();

  if (!context.access.allowed || !context.user) {
    const unauthenticated =
      context.access.reason === "session_missing" ||
      context.access.reason === "session_expired" ||
      context.access.reason === "visitor";

    if (unauthenticated) {
      redirect("/admin/login");
    }

    await recordSecurityEvent({
      type: "unauthorized_admin_access",
      severity: "medium",
      emailAttempted: context.user?.email,
      route: "/admin",
      success: false,
      metadata: { reason: context.access.reason },
    });

    return (
      <AccessDenied
        description="Esta área es interna. Inicia sesión con una cuenta autorizada. La autorización se valida en el servidor."
      />
    );
  }

  const currentUser = context.user;

  const pendingNotifications = await countUnreadNotifications(currentUser.id);
  const permissionNames = await listEffectivePermissionNames(currentUser.id);
  const [settings, profile] = await Promise.all([
    resolvePublicSiteSettings(),
    getAdminProfileView({
      user: currentUser,
      isPrincipalAdmin: context.access.isPrincipalAdmin,
    }),
  ]);

  const adminShellData: AdminShellData = {
    settings,
    navigation: filterAdminNavigation(adminNavigation, {
      isPrincipalAdmin: context.access.isPrincipalAdmin,
      permissionNames,
    }),
    currentUser: {
      id: currentUser.id,
      displayName: profile.displayName,
      email: currentUser.email,
      isPrincipalAdmin: context.access.isPrincipalAdmin,
    },
    profile,
    notificationsCount: pendingNotifications,
  };

  return <AdminShell data={adminShellData}>{children}</AdminShell>;
}
