import { useEffect, useState } from "react";
import {
  listarRecetas,
  registrarReceta,
  listarMedicamentos,
} from "../../api/farmaciaService";
import { listarCitas } from "../../api/citasService";
import { Button, Modal, AlertaError, Select, Input } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const FORM_VACIO = { idCita: "", idMedicamento: "", cantidad: "" };

export default function Recetas() {
  const [recetas, setRecetas] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [citasProgramadas, setCitasProgramadas] = useState([]); // citas PROGRAMADAS del doctor
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 8;

  const [cargandoModal, setCargandoModal] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarRecetas();
      setRecetas(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  async function cargarDatosModal() {
    setCargandoModal(true);
    try {
      const [meds, citas] = await Promise.all([
        listarMedicamentos(true),
        listarCitas("PROGRAMADA"),
      ]);
      setMedicamentos(meds.filter((m) => m.stock > 0));
      setCitasProgramadas(citas);
    } catch {
      // si falla, los selects quedan vacíos y el error lo muestra al intentar guardar
    } finally {
      setCargandoModal(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtradas = recetas.filter((r) =>
    r.nombreMedicamento.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalPaginas = Math.ceil(filtradas.length / porPagina);
  const inicio = (paginaActual - 1) * porPagina;
  const paginadas = filtradas.slice(inicio, inicio + porPagina);

  useEffect(() => { setPaginaActual(1); }, [busqueda]);

  function abrirCrear() {
    setForm(FORM_VACIO);
    setError("");
    setModalAbierto(true);
    cargarDatosModal(); // refresca citas y stock cada vez que se abre
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await registrarReceta({
        idCita: parseInt(form.idCita, 10),
        idMedicamento: parseInt(form.idMedicamento, 10),
        cantidad: parseInt(form.cantidad, 10),
      });
      setModalAbierto(false);
      await cargar(); // refresca tabla de recetas
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  function formatearFecha(fechaIso) {
    if (!fechaIso) return "—";
    return new Date(fechaIso).toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function formatearFechaCita(fechaIso) {
    if (!fechaIso) return "";
    return new Date(fechaIso).toLocaleString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const medSeleccionado = medicamentos.find(
    (m) => m.idMedicamento === parseInt(form.idMedicamento, 10)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Recetas</h1>
        <Button onClick={abrirCrear}>+ Nueva receta</Button>
      </div>

      <AlertaError mensaje={error && !modalAbierto ? error : ""} />

      <div className="mb-4">
        <Input
          placeholder="Buscar por medicamento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : recetas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay recetas registradas.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">ID Receta</th>
                  <th className="px-4 py-3 font-medium">ID Cita</th>
                  <th className="px-4 py-3 font-medium">Medicamento</th>
                  <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                  <th className="px-4 py-3 font-medium">Fecha registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginadas.map((r) => (
                  <tr key={r.idReceta} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">#{r.idReceta}</td>
                    <td className="px-4 py-3 text-slate-600">#{r.idCita}</td>
                    <td className="px-4 py-3 text-slate-800">{r.nombreMedicamento}</td>
                    <td className="px-4 py-3 text-slate-600 text-right">{r.cantidad}</td>
                    <td className="px-4 py-3 text-slate-500">{formatearFecha(r.fechaRegistro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-center gap-2 p-4">
              <Button
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(paginaActual - 1)}
              >
                Anterior
              </Button>
              <span className="px-3 py-2 text-sm">
                Página {paginaActual} de {totalPaginas || 1}
              </span>
              <Button
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
                onClick={() => setPaginaActual(paginaActual + 1)}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Nueva receta"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cita: select con las citas PROGRAMADAS del doctor logueado */}
          <Select
            label="Cita a atender"
            required
            value={form.idCita}
            onChange={(e) => setForm({ ...form, idCita: e.target.value })}
          >
            <option value="">
              {cargandoModal ? "Cargando citas..." : "Selecciona una cita..."}
            </option>
            {!cargandoModal && citasProgramadas.length === 0 && (
              <option disabled>No hay citas programadas asignadas</option>
            )}
            {citasProgramadas.map((c) => (
              <option key={c.idCita} value={c.idCita}>
                #{c.idCita} — Pac. #{c.idPaciente} · {formatearFechaCita(c.fecha)}
              </option>
            ))}
          </Select>

          <Select
            label="Medicamento"
            required
            value={form.idMedicamento}
            onChange={(e) => setForm({ ...form, idMedicamento: e.target.value })}
          >
            <option value="">Selecciona un medicamento...</option>
            {medicamentos.map((m) => (
              <option key={m.idMedicamento} value={m.idMedicamento}>
                {m.nombre} — Stock: {m.stock} | S/. {parseFloat(m.precio).toFixed(2)}
              </option>
            ))}
          </Select>

          {medSeleccionado && (
            <p className="text-xs text-slate-500">
              Stock disponible:{" "}
              <span className={medSeleccionado.stock <= 10 ? "text-red-600 font-semibold" : "font-medium"}>
                {medSeleccionado.stock} unidades
              </span>
            </p>
          )}

          <Input
            label="Cantidad"
            type="number"
            min="1"
            max={medSeleccionado?.stock ?? undefined}
            required
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          />

          <p className="text-xs text-slate-400">
            Al registrar, la cita se marcará como <strong>ATENDIDA</strong> y el stock del
            medicamento se descontará automáticamente.
          </p>

          <AlertaError mensaje={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Registrando..." : "Registrar receta"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
