import type { AdminNavigation } from "./navigation.types";
import { userCan } from "@/domain/authorization";

export const adminNavigation: AdminNavigation = {
  sections: [
    {
      id: "section-home",
      items: [
        {
          id: "nav-home",
          label: "Inicio",
          href: "/admin/dashboard",
        },
      ],
    },
    {
      id: "section-modify",
      label: "Modifica tu página",
      items: [
        {
          id: "nav-page-content",
          label: "Contenido de la página",
          href: "/admin/page-content",
          requiredPermission: "page_content.manage",
        },
        {
          id: "nav-media",
          label: "Multimedia",
          href: "/admin/media",
          requiredPermission: "media.manage",
        },
        {
          id: "nav-contact",
          label: "Información de contacto",
          href: "/admin/contact",
          requiredPermission: "contact_settings.manage",
        },
      ],
    },
    {
      id: "section-manage",
      label: "Inmuebles",
      items: [
        {
          id: "nav-availability",
          label: "Horarios",
          href: "/admin/availability",
          requiredPermission: "availability.manage",
        },
        {
          id: "nav-projects",
          label: "Proyectos inmobiliarios",
          href: "/admin/projects",
          requiredPermission: "projects.manage",
        },
        {
          id: "nav-properties",
          label: "Inmuebles",
          href: "/admin/properties",
          requiredPermission: "properties.manage",
        },
        {
          id: "nav-appointments",
          label: "Citas",
          href: "/admin/appointments",
          requiredPermission: "appointments.read",
        },
        {
          id: "nav-calendar",
          label: "Agenda",
          href: "/admin/calendar",
          requiredPermission: "appointments.read",
        },
        {
          id: "nav-clients",
          label: "Clientes",
          href: "/admin/clients",
          requiredPermission: "clients.view",
        },
        {
          id: "nav-contact-requests",
          label: "Solicitudes de contacto",
          href: "/admin/contact-requests",
          requiredPermission: "contact-requests.read",
        },
        {
          id: "nav-users",
          label: "Usuarios internos",
          href: "/admin/users",
          requiredPermission: "users.manage",
        },
      ],
    },
    {
      id: "section-system",
      items: [
        {
          id: "nav-notifications",
          label: "Notificaciones",
          href: "/admin/notifications",
          requiredPermission: "notifications.view",
        },
        {
          id: "nav-settings",
          label: "Configuración",
          href: "/admin/settings",
          requiredPermission: "history.view",
        },
        {
          id: "nav-activity",
          label: "Historial de movimientos",
          href: "/admin/settings/activity",
          requiredPermission: "history.view",
        },
      ],
    },
  ],
};

export function filterAdminNavigation(
  navigation: AdminNavigation,
  input: {
    isPrincipalAdmin: boolean;
    permissionNames: string[];
  },
): AdminNavigation {
  return {
    sections: navigation.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.requiresPrincipalAdmin && !input.isPrincipalAdmin) {
            return false;
          }

          if (!item.requiredPermission) {
            return true;
          }

          return userCan(
            {
              isPrincipalAdmin: input.isPrincipalAdmin,
              permissionNames: input.permissionNames,
            },
            item.requiredPermission,
          );
        }),
      }))
      .filter((section) => section.items.length > 0),
  };
}
