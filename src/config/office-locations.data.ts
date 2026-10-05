import type { OfficeLocation } from "@/domain";

/**
 * Physical office catalog. Independent from Project/Property persistence.
 */
export const officeLocations: OfficeLocation[] = [
  {
    id: "office-colibri",
    name: "Colibrí",
    city: "La Tebaida",
    address: "Sede Colibrí, La Tebaida",
    active: true,
  },
  {
    id: "office-pereira-inactive",
    name: "Pereira",
    city: "Pereira",
    address: "Sede Pereira (próximamente)",
    active: false,
  },
];
