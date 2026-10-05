import { listAdminContactRequests } from "@/backend/services/contact-request-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { ContactRequestsAdminPage } from "@/frontend/features/admin-contact-requests";

export default async function ContactRequestsRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.contactRequests,
    },
  });
  if (!access.allowed) {
    return access.element;
  }
  const contactRequests = await listAdminContactRequests();
  return <ContactRequestsAdminPage initialRequests={contactRequests} />;
}
