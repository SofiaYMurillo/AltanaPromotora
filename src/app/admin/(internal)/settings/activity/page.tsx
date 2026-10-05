import { DEFAULT_AUDIT_PAGE_SIZE } from "@/domain";
import { listAdminAuditEntries } from "@/backend/services/audit-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { ActivityAdminPage } from "@/frontend/features/admin-activity";

export default async function ActivityRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.history,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const result = await listAdminAuditEntries({
    limit: DEFAULT_AUDIT_PAGE_SIZE,
  });

  return (
    <ActivityAdminPage
      pageSize={DEFAULT_AUDIT_PAGE_SIZE}
      initialEntries={result.ok ? result.entries : []}
      initialHasMore={result.ok ? result.hasMore : false}
    />
  );
}
