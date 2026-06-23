import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listarCitas } from "../../api/citasService";
import { AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

function esHoy(fechaIso) {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

function formatoHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ESTILO_ESTADO = {
  PROGRAMADA: "bg-teal-50 text-teal-700",
  ATENDIDA: "bg-blue-50 text-blue-700",
  CANCELADA: "bg-rose-50 text-rose-700",
};

export default function RecepcionistaInicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const data = await listarCitas();
        setCitas(data);
      } catch (err) {
        setError(extraerMensajeError(err));
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const citasHoy = citas
    .filter((c) => esHoy(c.fecha))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const programadasHoy = citasHoy.filter((c) => c.nombreEstado === "PROGRAMADA").length;
  const atencidasHoy = citasHoy.filter((c) => c.nombreEstado === "ATENDIDA").length;

  const ACCESOS = [
    { label: "Gestionar citas", path: "/recepcionista/citas", icono: "📅", desc: "Registrar y gestionar citas del día" },
    { label: "Pacientes", path: "/recepcionista/pacientes", icono: "🧑‍🦱", desc: "Buscar y registrar pacientes" },
    { label: "Doctores", path: "/recepcionista/doctores", icono: "🩺", desc: "Consultar disponibilidad médica" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Bienvenido/a, {usuario?.correo?.split("@")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <AlertaError mensaje={error} />

      {/* Métricas del día */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Citas hoy", valor: citasHoy.length, icono: "📋", color: "teal" },
          { label: "Pendientes", valor: programadasHoy, icono: "⏳", color: "amber" },
          { label: "Atendidas", valor: atencidasHoy, icono: "✅", color: "blue" },
        ].map(({ label, valor, icono, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl
              ${color === "teal" ? "bg-teal-50" : color === "amber" ? "bg-amber-50" : "bg-blue-50"}`}>
              {icono}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {cargando ? "—" : valor}
              </p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACCESOS.map(({ label, path, icono, desc }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
            >
              <span className="text-2xl">{icono}</span>
              <p className="mt-2 font-medium text-slate-800 text-sm">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Próximas citas del día */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Citas de hoy</h2>
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : citasHoy.length === 0 ? (
          <p className="text-sm text-slate-400">No hay citas registradas para hoy.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {citasHoy.slice(0, 6).map((c) => (
              <div key={c.idCita} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 w-14">
                    {formatoHora(c.fecha)}
                  </span>
                  <span className="text-sm text-slate-600">Cita #{c.idCita}</span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTILO_ESTADO[c.nombreEstado] ?? "bg-slate-100 text-slate-500"}`}>
                  {c.nombreEstado}
                </span>
              </div>
            ))}
            {citasHoy.length > 6 && (
              <p className="text-xs text-slate-400 pt-3 text-center">
                +{citasHoy.length - 6} citas más —{" "}
                <button onClick={() => navigate("/recepcionista/citas")} className="text-teal-600 hover:underline">
                  ver todas
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
