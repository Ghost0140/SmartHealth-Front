import { recepcionistasClient } from "./axiosClient";

export async function listarRecepcionistas(activo) {
  const params = activo === undefined ? {} : { activo };
  const { data } = await recepcionistasClient.get("/recepcionista", { params });
  return Array.isArray(data) ? data : [];
}

export async function obtenerRecepcionista(id) {
  const { data } = await recepcionistasClient.get(`/recepcionista/${id}`);
  return data;
}

export async function registrarRecepcionista(body) {
  const { data } = await recepcionistasClient.post("/recepcionista", body);
  return data;
}

export async function actualizarRecepcionista(id, body) {
  const { data } = await recepcionistasClient.put(`/recepcionista/${id}`, body);
  return data;
}

export async function desactivarRecepcionista(id) {
  await recepcionistasClient.delete(`/recepcionista/${id}`);
}

export async function reactivarRecepcionista(id) {
  await recepcionistasClient.patch(`/recepcionista/reactivar/${id}`);
}
