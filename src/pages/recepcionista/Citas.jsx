import { useEffect, useState } from "react";
import { listarCitas, registrarCita } from "../../api/citasService";
import { listarPacientes } from "../../api/pacientesService";
import { listarDoctores } from "../../api/doctoresService";
import { Select, Button, Modal, AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const FORM_VACIO = { idPaciente: "", idDoctor: "", fecha: "" };

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

// Calcula el valor mínimo permitido para el input datetime-local: mañana a las 08:00.
// El backend exige fecha estrictamente futura, así que "hoy" puede rechazar
// si ya pasó la hora; se restringe a partir de mañana para evitar ese caso límite.
function minFechaPermitida() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(8, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${manana.getFullYear()}-${pad(manana.getMonth() + 1)}-${pad(manana.getDate())}T08:00`;
}

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar(estado) {
    setCargando(true);
    try {
      const [listaCitas, listaPacientes, listaDoctores] = await Promise.all([
        listarCitas(estado || undefined),
        listarPacientes(true),
        listarDoctores(true),
      ]);
      setCitas(listaCitas);
      setPacientes(listaPacientes);
      setDoctores(listaDoctores.filter((d) => d.disponible));
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(filtroEstado);
  }, [filtroEstado]);

  const pacientesPorId = Object.fromEntries(pacientes.map((p) => [p.idPaciente, p]));
  const doctoresPorId = Object.fromEntries(doctores.map((d) => [d.idDoctor, d]));

  function abrirCrear() {
    setForm(FORM_VACIO);
    setError("");
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      // El <input type="datetime-local"> entrega "YYYY-MM-DDTHH:mm" (sin segundos),
      // que es justo lo que el backend exige para pasar la validación de hora exacta.
      await registrarCita({
        idPaciente: Number(form.idPaciente),
        idDoctor: Number(form.idDoctor),
        fecha: form.fecha,
      });
      setModalAbierto(false);
      await cargar(filtroEstado);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const citasOrdenadas = [...citas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Citas</h1>
        <Button onClick={abrirCrear}>+ Nueva cita</Button>
      </div>

      <div className="flex gap-2 mb-4">
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

      <AlertaError mensaje={error && !modalAbierto ? error : ""} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : citasOrdenadas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay citas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha y hora</th>
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {citasOrdenadas.map((c) => {
                const paciente = pacientesPorId[c.idPaciente];
                const doctor = doctoresPorId[c.idDoctor];
                return (
                  <tr key={c.idCita} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{formatoFechaHora(c.fecha)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {paciente ? `${paciente.nombres} ${paciente.apellidos}` : `#${c.idPaciente}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {doctor ? `Dr. ${doctor.nombres} ${doctor.apellidos}` : `#${c.idDoctor}`}
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

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nueva cita">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Paciente"
            required
            value={form.idPaciente}
            onChange={(e) => setForm({ ...form, idPaciente: e.target.value })}
          >
            <option value="" disabled>Selecciona un paciente</option>
            {pacientes.map((p) => (
              <option key={p.idPaciente} value={p.idPaciente}>
                {p.nombres} {p.apellidos} — DNI {p.dni}
              </option>
            ))}
          </Select>

          <Select
            label="Doctor"
            required
            value={form.idDoctor}
            onChange={(e) => setForm({ ...form, idDoctor: e.target.value })}
          >
            <option value="" disabled>Selecciona un doctor disponible</option>
            {doctores.map((d) => (
              <option key={d.idDoctor} value={d.idDoctor}>
                Dr. {d.nombres} {d.apellidos} — {d.nombreEspecialidad}
              </option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              required
              step="1800"
              min={minFechaPermitida()}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Horario de atención: 08:00 a 17:30, cada 30 minutos.
            </p>
          </div>

          <AlertaError mensaje={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Crear cita"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
