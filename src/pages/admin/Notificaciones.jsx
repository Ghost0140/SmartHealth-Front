import { useEffect, useState } from "react";
import {
  listarNotificaciones,
  marcarNotificacionLeida,
} from "../../api/notificacionesService";

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarNotificaciones() {
    try {
      setCargando(true);
      const data = await listarNotificaciones();
      setNotificaciones(data);
      window.dispatchEvent(new Event("notificacionesActualizadas"));
    } catch (err) {
      setError("No se pudieron cargar las notificaciones");
    } finally {
      setCargando(false);
    }
  }

  async function marcarLeida(id) {
    try {
      await marcarNotificacionLeida(id);
      await cargarNotificaciones();
      window.dispatchEvent(new Event("notificacionesActualizadas"));
    } catch (err) {
      alert("No se pudo marcar como leída");
    }
}

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Notificaciones
          </h1>
          <p className="text-sm text-slate-500">
            Tienes {noLeidas} notificaciones sin leer
          </p>
        </div>

        <button
          onClick={cargarNotificaciones}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Actualizar
        </button>
      </div>

      {cargando && <p className="text-slate-500">Cargando notificaciones...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && notificaciones.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          No hay notificaciones registradas.
        </div>
      )}

      <div className="space-y-3">
        {notificaciones.map((n) => (
          <div
            key={n.idNotificacion}
            className={`rounded-xl border p-4 shadow-sm ${
              n.leido
                ? "bg-white border-slate-200"
                : "bg-teal-50 border-teal-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-teal-700">
                  {n.tipoEvento}
                </p>

                <p className="mt-1 text-sm text-slate-700">{n.mensaje}</p>

                <p className="mt-2 text-xs text-slate-400">
                  Fecha:{" "}
                  {n.fechaRegistro
                    ? new Date(n.fechaRegistro).toLocaleString()
                    : "Sin fecha"}
                </p>
              </div>

              {!n.leido && (
                <button
                  onClick={() => marcarLeida(n.idNotificacion)}
                  className="rounded-lg border border-teal-600 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100"
                >
                  Marcar leída
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}