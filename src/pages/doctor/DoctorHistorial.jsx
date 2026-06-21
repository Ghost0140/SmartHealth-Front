import { useEffect, useState } from "react";
import { listarCitas } from "../../api/citasService";
import { listarPacientes } from "../../api/pacientesService";
import { Modal, AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const ESTILO_ESTADO = {
  PROGRAMADA: "bg-teal-50 text-teal-700",
  ATENDIDA: "bg-blue-50 text-blue-700",
  CANCELADA: "bg-rose-50 text-rose-700",
};

function formatoFechaHora(fechaIso) {
  return new Date(fechaIso).toLocaleString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DoctorHistorial() {
  const [citas, setCitas] = useState([]);
  const [pacientesPorId, setPacientesPorId] = useState({});
  const [filtroEstado, setFiltroEstado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [citaDetalle, setCitaDetalle] = useState(null);

  async function cargar(estado) {
    setCargando(true);
    setError("");
    try {
      // El backend ya filtra por el doctor logueado vía JWT (CitaService.listarCitas)
      const listaCitas = await listarCitas(estado || undefined);
      setCitas(listaCitas);

      // listarPacientes está restringido a ADMIN/RECEPCIONISTA: si falla, se
      // muestra el id en vez del nombre, sin romper el resto de la pantalla.
      try {
        const listaPacientes = await listarPacientes(true);
        setPacientesPorId(
          Object.fromEntries(listaPacientes.map((p) => [p.idPaciente, p]))
        );
      } catch {
        setPacientesPorId({});
      }
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(filtroEstado);
  }, [filtroEstado]);

  const citasOrdenadas = [...citas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Historial de citas</h1>
      <p className="text-slate-500 text-sm mt-1">Todas tus citas, pasadas y futuras</p>

      <div className="flex gap-2 my-4">
        {["", "PROGRAMADA", "ATENDIDA", "CANCELADA"].map((estado) => (
          <button
            key={estado || "todas"}
            onClick={() => setFiltroEstado(estado)}
            className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
              filtroEstado === estado
                ? "bg-teal-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {estado || "Todas"}
          </button>
        ))}
      </div>

      <AlertaError mensaje={error} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : citasOrdenadas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay citas para mostrar.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha y hora</th>
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {citasOrdenadas.map((c) => {
                const paciente = pacientesPorId[c.idPaciente];
                return (
                  <tr
                    key={c.idCita}
                    onClick={() => setCitaDetalle(c)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-slate-800">{formatoFechaHora(c.fecha)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {paciente ? `${paciente.nombres} ${paciente.apellidos}` : `#${c.idPaciente}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          ESTILO_ESTADO[c.nombreEstado] ?? "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.nombreEstado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!citaDetalle} onClose={() => setCitaDetalle(null)} title="Detalle de la cita">
        {citaDetalle && (() => {
          const paciente = pacientesPorId[citaDetalle.idPaciente];
          return (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estado</span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    ESTILO_ESTADO[citaDetalle.nombreEstado] ?? "bg-slate-100 text-slate-500"
                  }`}
                >
                  {citaDetalle.nombreEstado}
                </span>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Fecha y hora</p>
                <p className="text-slate-800 font-medium">
                  {formatoFechaHora(citaDetalle.fecha)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Paciente</p>
                <p className="text-slate-800 font-medium">
                  {paciente
                    ? `${paciente.nombres} ${paciente.apellidos}`
                    : `#${citaDetalle.idPaciente}`}
                </p>
                {paciente && (
                  <p className="text-xs text-slate-400">
                    DNI {paciente.dni} · {paciente.telefono} · {paciente.email}
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
