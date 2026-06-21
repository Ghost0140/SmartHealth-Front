import { citasClient } from "./axiosClient";

// GET /api/citas?estado=PROGRAMADA|ATENDIDA|CANCELADA  (sin filtro de fecha/doctor: el backend no lo soporta)
export async function listarCitas(estado) {
  const params = estado ? { estado } : {};
  const { data } = await citasClient.get("/citas", { params });
  // El backend responde 204 No Content cuando la lista está vacía.
  // Axios entrega "" (string vacío) en ese caso, no null/undefined,
  // así que "?? []" no alcanza: hay que verificar que sea array de verdad.
  return Array.isArray(data) ? data : [];
}

export async function obtenerCita(id) {
  const { data } = await citasClient.get(`/citas/${id}`);
  return data;
}

// body: { idPaciente, idDoctor, fecha } -- fecha debe ser futura (ISO 8601)
export async function registrarCita(body) {
  const { data } = await citasClient.post("/citas", body);
  return data;
}

export async function atenderCita(id) {
  await citasClient.patch(`/citas/atender/${id}`);
}

export async function cancelarCita(id) {
  await citasClient.patch(`/citas/cancelar/${id}`);
}
