/**
 * El backend tiene dos formatos de error distintos (confirmado en GlobalExceptionHandler):
 *
 * 1. Validación de campos (@Valid falla):
 *    { "dni": "El DNI debe tener 8 dígitos", "email": "Email inválido" }
 *
 * 2. RuntimeException de negocio (ej: "DNI ya existe"):
 *    { "timestamp": ..., "status": 500, "error": "...", "message": "DNI ya existe", "path": "..." }
 *
 * Esta función normaliza ambos casos a un string legible para mostrar en el form.
 */
export function extraerMensajeError(error) {
  const data = error.response?.data;

  if (!data) {
    return "No se pudo conectar con el servidor. Verifica que el backend esté activo.";
  }

  // Caso 2: RuntimeException con campo "message"
  if (typeof data.message === "string") {
    return data.message;
  }

  // Caso 1: mapa de errores de validación { campo: mensaje }
  if (typeof data === "object") {
    const mensajes = Object.values(data).filter((v) => typeof v === "string");
    if (mensajes.length > 0) {
      return mensajes.join(" — ");
    }
  }

  return "Ocurrió un error inesperado.";
}
