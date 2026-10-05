/**
 * Stable availability / booking error codes.
 * Presentation maps these; Prisma and stack traces stay on the server.
 */
export type AvailabilityErrorCode =
  | "invalid_resource"
  | "invalid_date"
  | "invalid_time"
  | "unavailable_slot"
  | "capacity_exceeded"
  | "no_availability"
  | "internal_error";
