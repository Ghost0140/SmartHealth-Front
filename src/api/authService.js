import { authClient } from "./axiosClient";

// POST /api/usuarios/login  ->  { token, idUsuario, correo, rol, idDoctor }
// Confirmado contra UsuarioController.java / LoginResponseDto del backend.
export async function login(correo, clave) {
  const { data } = await authClient.post("/usuarios/login", { correo, clave });
  return data;
}
