import { useEffect, useState } from "react";
import { listarPacientes } from "../../api/pacientesService";
import { listarDoctores } from "../../api/doctoresService";
import { listarCitas } from "../../api/citasService";
import { TarjetaMetrica } from "../../components/ui/TarjetaMetrica";
import Carrusel from "../../components/ui/Carrusel";
import { AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const IMAGENES_CARRUSEL = [
  {
    src: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&q=80",
    titulo: "Instalaciones modernas",
    texto: "Espacios diseñados para el confort del paciente",
  },
  {
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80",
    titulo: "Equipo médico calificado",
    texto: "Profesionales comprometidos con tu salud",
  },
  {
    src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80",
    titulo: "Tecnología de punta",
    texto: "Diagnóstico y tratamiento con equipamiento actualizado",
  },
];

function esHoy(fechaIso) {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

export default function AdminInicio() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [metricas, setMetricas] = useState({
    pacientesActivos: 0,
    doctoresActivos: 0,
    citasHoy: 0,
    porEstado: { PROGRAMADA: 0, ATENDIDA: 0, CANCELADA: 0 },
  });

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const [pacientes, doctores, citas] = await Promise.all([
          listarPacientes(true),
          listarDoctores(true),
          listarCitas(),
        ]);

        const porEstado = { PROGRAMADA: 0, ATENDIDA: 0, CANCELADA: 0 };
        let citasHoy = 0;

        for (const cita of citas) {
          if (porEstado[cita.nombreEstado] !== undefined) {
            porEstado[cita.nombreEstado]++;
          }
          if (esHoy(cita.fecha)) citasHoy++;
        }

        setMetricas({
          pacientesActivos: pacientes.length,
          doctoresActivos: doctores.length,
          citasHoy,
          porEstado,
        });
      } catch (err) {
        setError(extraerMensajeError(err));
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const totalCitas =
    metricas.porEstado.PROGRAMADA +
    metricas.porEstado.ATENDIDA +
    metricas.porEstado.CANCELADA;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Panel general</h1>
        <p className="text-slate-500 text-sm mt-1">
          Resumen de actividad de la clínica
        </p>
      </div>

      <Carrusel imagenes={IMAGENES_CARRUSEL} />

      <AlertaError mensaje={error} />

      {cargando ? (
        <p className="text-sm text-slate-500">Cargando métricas...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TarjetaMetrica
              titulo="Pacientes activos"
              valor={metricas.pacientesActivos}
              icono="🧑‍🦱"
              color="teal"
            />
            <TarjetaMetrica
              titulo="Doctores activos"
              valor={metricas.doctoresActivos}
              icono="🩺"
              color="blue"
            />
            <TarjetaMetrica
              titulo="Citas de hoy"
              valor={metricas.citasHoy}
              icono="📅"
              color="amber"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Citas por estado
            </h2>

            {totalCitas === 0 ? (
              <p className="text-sm text-slate-400">Aún no hay citas registradas.</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Programadas", key: "PROGRAMADA", color: "bg-teal-500" },
                  { label: "Atendidas", key: "ATENDIDA", color: "bg-blue-500" },
                  { label: "Canceladas", key: "CANCELADA", color: "bg-rose-400" },
                ].map(({ label, key, color }) => {
                  const valor = metricas.porEstado[key];
                  const porcentaje = totalCitas
                    ? Math.round((valor / totalCitas) * 100)
                    : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{label}</span>
                        <span className="text-slate-500">{valor}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} transition-all`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
