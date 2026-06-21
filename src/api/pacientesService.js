import { pacientesClient } from "./axiosClient";

// GET /api/pacientes?activo=true|false  -> lista
export async function listarPacientes(activo) {
  const params = activo === undefined ? {} : { activo };
  const { data } = await pacientesClient.get("/pacientes", { params });
  // 204 No Content -> axios entrega "" (no null), por eso se valida Array.isArray
  return Array.isArray(data) ? data : [];
}

export async function obtenerPaciente(id) {
  const { data } = await pacientesClient.get(`/pacientes/${id}`);
  return data;
}

// body: { nombres, apellidos, dni, telefono, email }
export async function registrarPaciente(body) {
  const { data } = await pacientesClient.post("/pacientes", body);
  return data;
}

// body: { telefono, email }  (el backend solo permite editar estos dos campos)
export async function actualizarPaciente(id, body) {
  const { data } = await pacientesClient.put(`/pacientes/${id}`, body);
  return data;
}

export async function desactivarPaciente(id) {
  await pacientesClient.delete(`/pacientes/${id}`);
}

export async function reactivarPaciente(id) {
  await pacientesClient.patch(`/pacientes/reactivar/${id}`);
}
