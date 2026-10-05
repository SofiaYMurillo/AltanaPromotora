import type { Appointment, Client } from "@/domain";

export function clientDisplayName(client: Client): string {
  const name = [client.firstName, client.lastName]
    .filter((part) => Boolean(part?.trim()))
    .join(" ")
    .trim();

  if (name) {
    return name;
  }

  if (client.email) {
    return client.email;
  }

  if (client.phone) {
    return client.phone;
  }

  return "Cliente sin identificar";
}

export function clientContactSummary(client: Client): string {
  const parts = [client.email, client.phone].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Sin datos de contacto";
}

export function formatClientDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function appointmentStatusLabel(status: Appointment["status"]): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "confirmed":
      return "Confirmada";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    case "no_show":
      return "No asistió";
    default:
      return status;
  }
}

export function appointmentTypeLabel(type: Appointment["type"]): string {
  return type === "office" ? "Visita a sede" : "Visita a inmueble";
}

export function matchesClientQuery(client: Client, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    client.firstName,
    client.lastName,
    client.email,
    client.phone,
    clientDisplayName(client),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function mapClientsApiError(error: string | undefined) {
  switch (error) {
    case "unauthorized":
    case "forbidden":
      return "Tu sesión no es válida o no tienes permiso para ver clientes.";
    case "not_found":
      return "El cliente no está disponible.";
    default:
      return "No se pudieron cargar los clientes. Intenta de nuevo.";
  }
}
