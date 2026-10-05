export type AccessRequestStatus = "pending" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: AccessRequestStatus;
  invitationId?: string;
  decidedByUserId?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export function isAccessRequestStatus(
  value: string,
): value is AccessRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}
