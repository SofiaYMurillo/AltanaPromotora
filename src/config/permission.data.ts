import type { Permission } from "@/types/permission";

const base = "2026-01-01T00:00:00.000Z";

export const permissions: Permission[] = [
  {
    id: "permission-users-read",
    name: "users.read",
    label: "Consultar usuarios",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-users-manage",
    name: "users.manage",
    label: "Gestionar usuarios",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-availability-manage",
    name: "availability.manage",
    label: "Gestionar horarios",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-projects-manage",
    name: "projects.manage",
    label: "Gestionar proyectos",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-properties-manage",
    name: "properties.manage",
    label: "Gestionar inmuebles",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-appointments-read",
    name: "appointments.read",
    label: "Consultar citas",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-appointments-manage",
    name: "appointments.manage",
    label: "Gestionar citas",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-clients-view",
    name: "clients.view",
    label: "Consultar clientes",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-contact-requests-read",
    name: "contact-requests.read",
    label: "Consultar solicitudes de contacto",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-contact-requests-manage",
    name: "contact-requests.manage",
    label: "Gestionar solicitudes de contacto",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-media-manage",
    name: "media.manage",
    label: "Gestionar multimedia",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-page-content-manage",
    name: "page_content.manage",
    label: "Gestionar contenido de página",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-contact-settings-manage",
    name: "contact_settings.manage",
    label: "Gestionar información de contacto",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-notifications-view",
    name: "notifications.view",
    label: "Ver notificaciones",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-history-view",
    name: "history.view",
    label: "Ver historial de movimientos",
    createdAt: base,
    updatedAt: base,
  },
  {
    id: "permission-appointments-create",
    name: "appointments.create",
    label: "Solicitar cita",
    createdAt: base,
    updatedAt: base,
  },
];

export const permissionNameSet = new Set(permissions.map((item) => item.name));
