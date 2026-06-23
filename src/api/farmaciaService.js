import axios from "axios";

// pharmacy-service corre en el puerto 8085 (application.properties)
const farmaciaClient = axios.create({
  baseURL: "http://localhost:8085/api",
});

// Adjunta JWT a cada request
farmaciaClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 -> limpiar sesión y redirigir al login
farmaciaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── MEDICAMENTOS ────────────────────────────────────────────────────────────

// GET /api/medicamentos?activo=true|false  (sin filtro -> todos)
export async function listarMedicamentos(activo) {
  const params = activo === undefined ? {} : { activo };
  const { data } = await farmaciaClient.get("/medicamentos", { params });
  // 204 No Content -> axios retorna "" (no null/undefined)
  return Array.isArray(data) ? data : [];
}

export async function obtenerMedicamento(id) {
  const { data } = await farmaciaClient.get(`/medicamentos/${id}`);
  return data;
}

// body: { nombre, stock, precio }
export async function registrarMedicamento(body) {
  const { data } = await farmaciaClient.post("/medicamentos", body);
  return data;
}

// body: { nombre, stock, precio }
export async function actualizarMedicamento(id, body) {
  const { data } = await farmaciaClient.put(`/medicamentos/${id}`, body);
  return data;
}

export async function desactivarMedicamento(id) {
  await farmaciaClient.delete(`/medicamentos/${id}`);
}

export async function reactivarMedicamento(id) {
  await farmaciaClient.patch(`/medicamentos/reactivar/${id}`);
}

// ─── RECETAS ─────────────────────────────────────────────────────────────────

// GET /api/recetas?medicamento=<nombre>  (sin filtro -> todas)
export async function listarRecetas(medicamento) {
  const params = medicamento ? { medicamento } : {};
  const { data } = await farmaciaClient.get("/recetas", { params });
  return Array.isArray(data) ? data : [];
}

export async function obtenerReceta(id) {
  const { data } = await farmaciaClient.get(`/recetas/${id}`);
  return data;
}

// body: { idCita, idMedicamento, cantidad }
// El backend marca la cita como ATENDIDA y descuenta el stock automáticamente.
export async function registrarReceta(body) {
  const { data } = await farmaciaClient.post("/recetas", body);
  return data;
}
