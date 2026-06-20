import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RUTA_POR_ROL = {
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  RECEPCIONISTA: "/recepcionista",
};

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const usuario = await login(correo, clave);
      const ruta = RUTA_POR_ROL[usuario.rol] ?? "/login";
      navigate(ruta, { replace: true });
    } catch (err) {
      // El backend responde con RuntimeException -> mensaje genérico vía GlobalExceptionHandler
      const mensaje =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Credenciales incorrectas. Verifica tu correo y contraseña.";
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">SmartHealth</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="tucorreo@smarthealth.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60
                       text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
