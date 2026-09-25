import { chatClient } from "./axiosClient";

export async function listarMensajesChat() {
  const { data } = await chatClient.get("/chat/mensajes");
  return Array.isArray(data) ? data : [];
}
