import { notificacionesClient } from "./axiosClient";

export async function listarNotificaciones() {
  const { data } = await notificacionesClient.get("/notificaciones");
  return Array.isArray(data)
    ? [...data].sort((a, b) => {
        const fechaA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
        const fechaB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;

        if (fechaA !== fechaB) return fechaB - fechaA;
        return (b.idNotificacion ?? 0) - (a.idNotificacion ?? 0);
      })
    : [];
}

export async function buscarNotificacion(id) {
  const { data } = await notificacionesClient.get(`/notificaciones/${id}`);
  return data;
}

export async function marcarNotificacionLeida(id) {
  const { data } = await notificacionesClient.put(`/notificaciones/leido/${id}`);
  return data;
}
