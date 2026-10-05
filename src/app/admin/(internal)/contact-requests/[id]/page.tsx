import { notFound } from "next/navigation";

import { getAdminContactRequest } from "@/backend/services/contact-request-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { ContactRequestDetailPage } from "@/frontend/features/admin-contact-requests";

type ContactRequestDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ContactRequestDetailRoute({
  params,
}: ContactRequestDetailRouteProps) {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.contactRequests,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const { id } = await params;
  const contactRequest = await getAdminContactRequest(id);

  if (!contactRequest) {
    notFound();
  }

  return <ContactRequestDetailPage initialRequest={contactRequest} />;
}
