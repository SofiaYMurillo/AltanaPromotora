import type { ContactRequest } from "@/types/contact-request";

export const contactRequests: ContactRequest[] = [
  {
    id: "contact-request-001",
    name: "Laura Méndez",
    email: "laura.mendez@email.com",
    phone: "+57 320 456 7890",
    message: "Me gustaría recibir información sobre proyectos disponibles en Bogotá.",
    status: "pending",
    createdAt: "2026-01-15T10:30:00.000Z",
    updatedAt: "2026-01-15T10:30:00.000Z",
  },
  {
    id: "contact-request-002",
    name: "Diego Herrera",
    email: "diego.herrera@email.com",
    message: "¿Cuáles son las formas de financiación disponibles?",
    status: "responded",
    createdAt: "2026-01-10T14:00:00.000Z",
    updatedAt: "2026-01-11T09:15:00.000Z",
  },
  {
    id: "contact-request-003",
    name: "Patricia Vargas",
    email: "patricia.vargas@email.com",
    phone: "+57 315 222 3344",
    message: "Solicito una llamada para conocer más sobre apartamentos en preventa.",
    status: "closed",
    createdAt: "2026-01-05T08:45:00.000Z",
    updatedAt: "2026-01-08T16:30:00.000Z",
  },
];
