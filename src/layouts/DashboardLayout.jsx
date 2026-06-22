import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarNotificaciones } from "../api/notificacionesService";

const MENU_POR_ROL = {
  ADMIN: [
    { label: "Inicio", path: "/admin" },
    { label: "Pacientes", path: "/admin/pacientes" },
    { label: "Doctores", path: "/admin/doctores" },
    { label: "Recepcionistas", path: "/admin/recepcionistas" },
    { label: "Notificaciones", path: "/admin/notificaciones" },
  ],
  DOCTOR: [
    { label: "Inicio", path: "/doctor" },
    { label: "Historial", path: "/doctor/historial" },
  ],
  RECEPCIONISTA: [
    { label: "Inicio", path: "/recepcionista" },
    { label: "Pacientes", path: "/recepcionista/pacientes" },
    { label: "Doctores", path: "/recepcionista/doctores" },
    { label: "Citas", path: "/recepcionista/citas" },
  ],
};

export default function DashboardLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const menu = MENU_POR_ROL[usuario?.rol] ?? [];
  const esAdmin = usuario?.rol === "ADMIN";
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    async function cargarContador() {
      try {
        const data = await listarNotificaciones();
        const total = data.filter((n) => !n.leido).length;
        setNoLeidas(total);
      } catch {
        setNoLeidas(0);
      }
    }

    // Solo ADMIN tiene ruta de notificaciones — no cargar para otros roles
    if (usuario && esAdmin) {
      cargarContador();
    }

    window.addEventListener("notificacionesActualizadas", cargarContador);
    return () => {
      window.removeEventListener("notificacionesActualizadas", cargarContador);
    };
  }, [usuario, esAdmin]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-teal-700">SmartHealth</h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-400 px-3 mb-2">{usuario?.correo}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium
                       text-red-600 hover:bg-red-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8">
          {/* Campana solo visible para ADMIN — otros roles no tienen ruta de notificaciones */}
          {esAdmin && (
            <button
              onClick={() => navigate("/admin/notificaciones")}
              className="relative rounded-full border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              title="Notificaciones"
            >
              🔔
              {noLeidas > 0 && (
                <span className="absolute -top-2 -right-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  {noLeidas}
                </span>
              )}
            </button>
          )}
        </header>

        <section className="p-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
