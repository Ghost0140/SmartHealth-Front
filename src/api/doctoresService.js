import { doctoresClient } from "./axiosClient";

// GET /api/doctores?activo=true|false
export async function listarDoctores(activo) {
  const params = activo === undefined ? {} : { activo };
  const { data } = await doctoresClient.get("/doctores", { params });
  return data ?? [];
}

export async function obtenerDoctor(id) {
  const { data } = await doctoresClient.get(`/doctores/${id}`);
  return data;
}

// body: { idEspecialidad, nombres, apellidos, dni, telefono, email }
export async function registrarDoctor(body) {
  const { data } = await doctoresClient.post("/doctores", body);
  return data;
}

// body: { idEspecialidad, telefono, email, disponible }
export async function actualizarDoctor(id, body) {
  const { data } = await doctoresClient.put(`/doctores/${id}`, body);
  return data;
}

export async function desactivarDoctor(id) {
  await doctoresClient.delete(`/doctores/${id}`);
}

export async function reactivarDoctor(id) {
  await doctoresClient.patch(`/doctores/reactivar/${id}`);
}

// GET /api/especialidades?activo=true
export async function listarEspecialidades(activo) {
  const params = activo === undefined ? {} : { activo };
  const { data } = await doctoresClient.get("/especialidades", { params });
  return data ?? [];
}
