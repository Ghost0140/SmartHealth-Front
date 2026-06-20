import axios from "axios";

// Puertos confirmados en application.properties de cada microservicio.
// Si cambian en el backend, solo se actualiza aquí.
const PORTS = {
  auth: 8086,
  citas: 8083,
  doctores: 8082,
  pacientes: 8081,
  recepcionistas: 8084,
};

function createClient(port) {
  const client = axios.create({
    baseURL: `http://localhost:${port}/api`,
  });

  // Adjunta el JWT a cada request si existe
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Si el token expira o es inválido, el backend responde 401.
  // Limpiamos sesión y mandamos al login.
  client.interceptors.response.use(
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

  return client;
}

export const authClient = createClient(PORTS.auth);
export const citasClient = createClient(PORTS.citas);
export const doctoresClient = createClient(PORTS.doctores);
export const pacientesClient = createClient(PORTS.pacientes);
export const recepcionistasClient = createClient(PORTS.recepcionistas);
