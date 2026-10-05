import type { Appointment } from "../src/domain";
import type {
  OfficeAvailabilityEntry,
  PropertyAvailabilityEntry,
} from "../src/domain";

/**
 * Scheduling fixtures used only by prisma/seed.
 * Availability and appointments remain independent of catalog persistence.
 */
export const seedPropertyAvailability: PropertyAvailabilityEntry[] = [
  {
    propertyId: "property-001",
    availability: [
      { day: 2, startTime: "09:00", endTime: "12:00", interval: 30 },
      { day: 2, startTime: "14:00", endTime: "16:00", interval: 30 },
    ],
  },
  {
    propertyId: "property-002",
    availability: [
      { day: 3, startTime: "14:00", endTime: "17:00", interval: 30 },
    ],
  },
  {
    propertyId: "property-003",
    availability: [
      { day: 4, startTime: "09:00", endTime: "12:00", interval: 45 },
    ],
  },
  {
    propertyId: "property-004",
    availability: [
      { day: 5, startTime: "10:00", endTime: "13:00", interval: 30 },
    ],
  },
  {
    propertyId: "property-005",
    availability: [
      { day: 1, startTime: "15:00", endTime: "18:00", interval: 30 },
    ],
  },
  { propertyId: "property-006", availability: [] },
  {
    propertyId: "property-007",
    availability: [
      { day: 2, startTime: "09:00", endTime: "11:00", interval: 60 },
      { day: 6, startTime: "09:00", endTime: "12:00", interval: 30 },
    ],
  },
  {
    propertyId: "property-008",
    availability: [
      { day: 3, startTime: "08:00", endTime: "12:00", interval: 30 },
    ],
  },
];

/** Global property visit schedule (admin “Horarios de inmuebles”). */
export const seedGlobalPropertyVisitAvailability = [
  { day: 2 as const, startTime: "09:00", endTime: "12:00", interval: 30 },
  { day: 2 as const, startTime: "14:00", endTime: "17:00", interval: 30 },
  { day: 6 as const, startTime: "09:00", endTime: "13:00", interval: 30 },
];

export const seedOfficeAvailability: OfficeAvailabilityEntry[] = [
  {
    officeLocationId: "office-colibri",
    availability: [
      { day: 1, startTime: "08:00", endTime: "12:00", interval: 30 },
      { day: 1, startTime: "14:00", endTime: "17:00", interval: 30 },
    ],
  },
];

export const seedAppointments: Appointment[] = [
  {
    id: "appointment-public-001",
    type: "property",
    propertyId: "property-001",
    date: "2026-09-15",
    time: "10:00",
    status: "pending",
    communicationPreference: "email",
    contact: { email: "visita@ejemplo.com" },
    clientId: "client-001",
  },
  {
    id: "appointment-public-002",
    type: "office",
    officeLocationId: "office-colibri",
    date: "2026-09-21",
    time: "09:00",
    status: "confirmed",
    communicationPreference: "whatsapp",
    contact: { phone: "3001234567" },
    assignedWorkerId: "user-004",
  },
  {
    id: "appointment-public-003",
    type: "property",
    propertyId: "property-002",
    date: "2026-09-16",
    time: "14:30",
    status: "pending",
    communicationPreference: "none",
  },
  {
    id: "appointment-public-004",
    type: "property",
    propertyId: "property-001",
    date: "2026-09-15",
    time: "11:00",
    status: "cancelled",
    communicationPreference: "email",
    contact: { email: "cancelada@ejemplo.com" },
  },
  {
    id: "appointment-public-005",
    type: "property",
    propertyId: "property-missing",
    date: "2026-09-22",
    time: "10:00",
    status: "completed",
    communicationPreference: "none",
    assignedWorkerId: "user-missing",
  },
];
