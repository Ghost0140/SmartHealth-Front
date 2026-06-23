import { authClient } from "./axiosClient";

export async function listarUsuarios(activo) {
  const params = activo === undefined ? {} : { activo };
  const { data } = await authClient.get("/usuarios", { params });
  return Array.isArray(data) ? data : [];
}

export async function registrarUsuario(body) {
  const { data } = await authClient.post("/usuarios", body);
  return data;
}

export async function actualizarUsuario(id, body) {
  const { data } = await authClient.put(`/usuarios/${id}`, body);
  return data;
}

export async function desactivarUsuario(id) {
  await authClient.delete(`/usuarios/${id}`);
}

export async function reactivarUsuario(id) {
  await authClient.patch(`/usuarios/reactivar/${id}`);
}

export async function listarRoles(activo) {
  const params = activo === undefined ? {} : { activo };
  const { data } = await authClient.get("/roles", { params });
  return Array.isArray(data) ? data : [];
}
