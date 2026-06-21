import { useEffect, useState } from "react";
import { listarCitas, atenderCita, cancelarCita } from "../../api/citasService";
import { listarPacientes } from "../../api/pacientesService";
import { Button, AlertaError } from "../../components/ui";
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

export default function DoctorInicio() {
  const [citas, setCitas] = useState([]);
  const [pacientesPorId, setPacientesPorId] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(null); // idCita en proceso

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      // El backend ya filtra automáticamente por el doctor logueado (vía JWT)
      const listaCitas = await listarCitas();
      setCitas(listaCitas);

      // listarPacientes está restringido a ADMIN/RECEPCIONISTA en el backend.
      // Para DOCTOR no es accesible: se muestra el id del paciente en vez del nombre.
      try {
        const listaPacientes = await listarPacientes(true);
        const mapaPacientes = Object.fromEntries(
          listaPacientes.map((p) => [p.idPaciente, p])
        );
        setPacientesPorId(mapaPacientes);
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
    cargar();
  }, []);

  const citasHoy = citas
    .filter((c) => esHoy(c.fecha))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  async function handleAtender(idCita) {
    setProcesando(idCita);
    setError("");
    try {
      await atenderCita(idCita);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setProcesando(null);
    }
  }

  async function handleCancelar(idCita) {
    setProcesando(idCita);
    setError("");
    try {
      await cancelarCita(idCita);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Mis citas de hoy</h1>
      <p className="text-slate-500 text-sm mt-1">
        {new Date().toLocaleDateString("es-PE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      <div className="mt-4">
        <AlertaError mensaje={error} />
      </div>

      <div className="mt-4 space-y-3">
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando citas...</p>
        ) : citasHoy.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">No tienes citas programadas para hoy.</p>
          </div>
        ) : (
          citasHoy.map((cita) => {
            const paciente = pacientesPorId[cita.idPaciente];
            const enProceso = procesando === cita.idCita;
            const esPendiente = cita.nombreEstado === "PROGRAMADA";

            return (
              <div
                key={cita.idCita}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center w-16">
                    <p className="text-lg font-semibold text-slate-800">
                      {formatoHora(cita.fecha)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {paciente
                        ? `${paciente.nombres} ${paciente.apellidos}`
                        : `Paciente #${cita.idPaciente}`}
                    </p>
                    {paciente && (
                      <p className="text-xs text-slate-400">DNI: {paciente.dni}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      ESTILO_ESTADO[cita.nombreEstado] ?? "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {cita.nombreEstado}
                  </span>

                  {esPendiente && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={enProceso}
                        onClick={() => handleCancelar(cita.idCita)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        disabled={enProceso}
                        onClick={() => handleAtender(cita.idCita)}
                      >
                        {enProceso ? "..." : "Atender"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
