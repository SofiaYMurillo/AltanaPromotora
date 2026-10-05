export function mapSectionBackgroundSaveError(
  status: number,
  error?: string,
): string {
  switch (error) {
    case "unauthorized":
      return "Sesión no autorizada. Vuelve a iniciar sesión.";
    case "forbidden":
      return "No tienes permisos para modificar fondos.";
    case "not_found":
      return "El recurso multimedia no existe.";
    case "invalid_payload":
      return "Datos incompletos o inválidos.";
    case "invalid_background":
      return "El recurso no es compatible con este tipo de fondo.";
    case "invalid_json":
      return "No se pudo leer la petición.";
    default:
      break;
  }

  if (status === 401) {
    return "Sesión no autorizada. Vuelve a iniciar sesión.";
  }
  if (status === 403) {
    return "No tienes permisos para modificar fondos.";
  }
  if (status === 404) {
    return "Sección o recurso no encontrado.";
  }
  if (status === 409) {
    return "Conflicto al guardar. Intenta de nuevo.";
  }
  if (status >= 500) {
    return "Error interno del servidor.";
  }

  return "No se pudo guardar.";
}
