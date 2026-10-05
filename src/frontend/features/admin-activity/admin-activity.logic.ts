import type {
  AuditAction,
  AuditEntityType,
  AuditEntry,
  AuditMetadata,
} from "@/domain";

export function getAuditActionLabel(action: AuditAction) {
  switch (action) {
    case "created":
      return "Creó";
    case "updated":
      return "Actualizó";
    case "deleted":
      return "Eliminó";
    case "status_changed":
      return "Cambió el estado de";
    case "invitation_created":
      return "Envió la invitación de";
    case "invitation_revoked":
      return "Revocó la invitación de";
    default:
      return action;
  }
}

export function getAuditEntityLabel(entityType: AuditEntityType) {
  switch (entityType) {
    case "project":
      return "Proyecto";
    case "property":
      return "Inmueble";
    case "appointment":
      return "Cita";
    case "contact_request":
      return "Solicitud de contacto";
    case "invitation":
      return "Invitación";
    case "media_asset":
      return "Recurso multimedia";
    case "section_background":
      return "Fondo de sección";
    case "site_configuration":
      return "Configuración del sitio";
    case "user":
      return "Usuario interno";
    default:
      return entityType;
  }
}

export function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAuditActorLabel(entry: AuditEntry) {
  return entry.actorDisplay ?? "Acción del sistema";
}

/** Falls back to the raw id only when no human reference was captured. */
export function getAuditEntityReference(entry: AuditEntry) {
  return entry.entityLabel ?? entry.entityId;
}

const METADATA_LABELS: Record<string, string> = {
  active: "Activo",
  city: "Ciudad",
  operation: "Operación",
  previousPrice: "Precio anterior",
  previousStatus: "Estado anterior",
  previousTitle: "Título anterior",
  price: "Precio",
  roleId: "Rol",
  status: "Estado",
  visitType: "Tipo de visita",
};

/** Small readable pairs; the UI never renders raw JSON. */
export function describeAuditMetadata(metadata: AuditMetadata | null) {
  if (!metadata) {
    return [];
  }

  return Object.entries(metadata).map(([key, value]) => ({
    key,
    label: METADATA_LABELS[key] ?? key,
    value:
      typeof value === "boolean"
        ? value
          ? "Sí"
          : "No"
        : value === null
          ? "—"
          : String(value),
  }));
}

export function mapActivityError(error: string | undefined) {
  switch (error) {
    case "unauthorized":
      return "Debes iniciar sesión para consultar el historial.";
    case "forbidden":
      return "No tienes autorización para consultar el historial.";
    case "invalid_entity_type":
      return "El tipo de entidad indicado no es válido.";
    case "invalid_action":
      return "La acción indicada no es válida.";
    case "invalid_date":
      return "El rango de fechas no es válido.";
    case "range_too_large":
      return "El rango de fechas excede el máximo permitido.";
    case "invalid_pagination":
      return "La paginación solicitada no es válida.";
    default:
      return "No se pudo cargar el historial. Intenta de nuevo.";
  }
}
