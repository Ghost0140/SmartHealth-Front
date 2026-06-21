import { notificacionesClient } from "./axiosClient";

export async function listarNotificaciones() {
  const { data } = await notificacionesClient.get("/notificaciones");
  return data;
}

export async function buscarNotificacion(id) {
  const { data } = await notificacionesClient.get(`/notificaciones/${id}`);
  return data;
}

export async function marcarNotificacionLeida(id) {
  const { data } = await notificacionesClient.put(`/notificaciones/leido/${id}`);
  return data;
}