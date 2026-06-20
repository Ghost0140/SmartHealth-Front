import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU_POR_ROL = {
  ADMIN: [
    { label: "Inicio", path: "/admin" },
    { label: "Pacientes", path: "/admin/pacientes" },
    { label: "Doctores", path: "/admin/doctores" },
    // { label: "Usuarios", path: "/admin/usuarios" },
  ],
  DOCTOR: [
    { label: "Inicio", path: "/doctor" },
    // { label: "Mis citas", path: "/doctor/citas" },
  ],
  RECEPCIONISTA: [
    { label: "Inicio", path: "/recepcionista" },
    { label: "Pacientes", path: "/recepcionista/pacientes" },
    { label: "Doctores", path: "/recepcionista/doctores" },
    // { label: "Citas", path: "/recepcionista/citas" },
  ],
};

export default function DashboardLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const menu = MENU_POR_ROL[usuario?.rol] ?? [];

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
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
