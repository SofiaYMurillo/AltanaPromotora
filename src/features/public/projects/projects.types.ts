/**
 * Public catalog / editorial contracts for the projects feature.
 * Visit scheduling entities live in `@/domain` and are re-exported here
 * so existing feature imports keep working without a second source of truth.
 */

import type { PropertyOperation, PropertyType } from "@/domain";
import type { ResolvedSectionBackground } from "@/domain/media";

export type {
  Appointment,
  AppointmentCommunicationPreference,
  AppointmentStatus,
  AppointmentVisitType,
  Availability,
  AvailabilityDay,
  AvailabilityDaySlots,
  AvailabilitySlot,
  OfficeAvailabilityEntry,
  OfficeLocation,
  PropertyAvailabilityEntry,
  VisitAppointmentStatus,
} from "@/domain";

export type { PropertyOperation, PropertyType };

/** Public catalog only needs project identity for property cards — not page layout. */
export interface ProjectData {
  id: string;
  title: string;
  image: {
    src: string;
    alt: string;
  };
}

export interface PropertyData {
  id: string;
  projectId?: string;
  title: string;
  images: {
    src: string;
    alt: string;
  }[];
  operation: PropertyOperation;
  type: PropertyType;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parkingSpaces: number;
  price: number;
  features: string[];
}

export interface ProjectsPageEditorial {
  header: {
    eyebrow: string;
    title: string;
  };
  filters: {
    eyebrow: string;
    title: string;
  };
}

export interface ProjectsPageData {
  projects: ProjectData[];
  properties: PropertyData[];
  editorial: ProjectsPageEditorial;
  headerCmsBackground?: ResolvedSectionBackground;
}

export interface PropertyFiltersState {
  operation?: PropertyOperation;
  type?: PropertyType;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
}
