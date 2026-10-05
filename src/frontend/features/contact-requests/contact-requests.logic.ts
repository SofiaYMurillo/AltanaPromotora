import { validatePublicContactRequest } from "@/domain";
import type { PublicContactRequestInput } from "@/domain";

export function getPublicContactRequestFormError(
  input: PublicContactRequestInput,
) {
  const error = validatePublicContactRequest(input);
  return error ? mapContactRequestError(error) : null;
}

export function getContactRequestStatusLabel(
  status: "pending" | "responded" | "closed",
) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "responded":
      return "Respondida";
    case "closed":
      return "Cerrada";
    default:
      return status;
  }
}

export function getContactRequestActionLabel(
  status: "pending" | "responded" | "closed",
) {
  switch (status) {
    case "responded":
      return "Marcar como respondida";
    case "closed":
      return "Cerrar";
    default:
      return getContactRequestStatusLabel(status);
  }
}

export function formatContactRequestDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function contactSummary(input: { email?: string; phone?: string }) {
  return [input.email, input.phone].filter(Boolean).join(" · ") || "Sin medio de contacto";
}

export function mapContactRequestError(error: string | undefined) {
  switch (error) {
    case "unauthorized":
      return "Debes iniciar sesión para gestionar solicitudes.";
    case "forbidden":
      return "No tienes autorización para esta operación.";
    case "not_found":
      return "La solicitud ya no está disponible.";
    case "invalid_name":
      return "El nombre es obligatorio.";
    case "invalid_email":
      return "El correo no es válido.";
    case "invalid_phone":
      return "El teléfono no es válido.";
    case "invalid_message":
      return "El mensaje es obligatorio.";
    case "missing_contact":
      return "Indica un correo o un teléfono para poder contactarte.";
    case "invalid_transition":
      return "Ese cambio de estado no está permitido.";
    case "forbidden_field":
      return "Esa modificación no está permitida.";
    case "rate_limited":
      return "Has enviado demasiadas solicitudes. Intenta de nuevo más tarde.";
    default:
      return "No se pudo completar la operación. Intenta de nuevo.";
  }
}
