export function formatCatalogPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function getOperationLabel(operation: "sale" | "rent") {
  return operation === "sale" ? "Venta" : "Arriendo";
}

export function getTypeLabel(type: "house" | "apartment") {
  return type === "house" ? "Casa" : "Apartamento";
}

export function mapCatalogError(error: string | undefined) {
  switch (error) {
    case "unauthorized":
      return "Debes iniciar sesión para gestionar el catálogo.";
    case "forbidden":
      return "No tienes autorización para esta operación.";
    case "not_found":
      return "El registro ya no está disponible.";
    case "invalid_title":
      return "El título es obligatorio.";
    case "invalid_description":
      return "La descripción de la sección es obligatoria.";
    case "invalid_image":
    case "invalid_images":
      return "Usa una ruta local válida de /images/ y un texto alternativo.";
    case "invalid_sections":
      return "Revisa las secciones del proyecto.";
    case "invalid_operation":
      return "La operación debe ser venta o arriendo.";
    case "invalid_type":
      return "El tipo debe ser casa o apartamento.";
    case "invalid_city":
      return "La ciudad es obligatoria.";
    case "invalid_price":
      return "El precio no puede ser negativo.";
    case "invalid_area":
      return "El área debe ser mayor que cero.";
    case "invalid_bedrooms":
      return "Las habitaciones no pueden ser negativas.";
    case "invalid_bathrooms":
      return "Los baños no pueden ser negativos.";
    case "invalid_parking":
      return "Los parqueaderos no pueden ser negativos.";
    case "invalid_features":
      return "Revisa las características.";
    case "invalid_project_id":
      return "El proyecto asociado no existe.";
    case "forbidden_field":
      return "Esa modificación no está permitida.";
    case "has_appointments":
      return "No se puede eliminar: existen citas asociadas a este inmueble.";
    default:
      return "No se pudo completar la operación. Intenta de nuevo.";
  }
}
