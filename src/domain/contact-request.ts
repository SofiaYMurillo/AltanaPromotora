export type ContactRequestStatus = "pending" | "responded" | "closed";

export const CONTACT_REQUEST_STATUSES: readonly ContactRequestStatus[] = [
  "pending",
  "responded",
  "closed",
];

/**
 * Visitor inquiry from the public site.
 * Independent from Client, Appointment, and User.
 */
export type ContactRequest = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  status: ContactRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type PublicContactRequestInput = {
  name: string;
  email?: string;
  phone?: string;
  message: string;
};
