import { useEffect, useState } from "react";
import {
  listarMedicamentos,
  registrarMedicamento,
  actualizarMedicamento,
  desactivarMedicamento,
  reactivarMedicamento,
} from "../../api/farmaciaService";
import { Input, Button, EstadoBadge, Modal, AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const FORM_VACIO = { nombre: "", stock: "", precio: "" };

export default function Medicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // null = creando
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 8;

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarMedicamentos();
      setMedicamentos(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = medicamentos.filter((m) =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const inicio = (paginaActual - 1) * porPagina;
  const paginados = filtrados.slice(inicio, inicio + porPagina);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModalAbierto(true);
  }

  function abrirEditar(med) {
    setEditando(med);
    setForm({
      nombre: med.nombre,
      stock: String(med.stock),
      precio: String(med.precio),
    });
    setError("");
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    const body = {
      nombre: form.nombre.trim(),
      stock: parseInt(form.stock, 10),
      precio: parseFloat(form.precio),
    };

    try {
      if (editando) {
        await actualizarMedicamento(editando.idMedicamento, body);
      } else {
        await registrarMedicamento(body);
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(med) {
    try {
      if (med.activo) {
        await desactivarMedicamento(med.idMedicamento);
      } else {
        await reactivarMedicamento(med.idMedicamento);
      }
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Medicamentos</h1>
        <Button onClick={abrirCrear}>+ Nuevo medicamento</Button>
      </div>

      <AlertaError mensaje={error && !modalAbierto ? error : ""} />

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : medicamentos.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay medicamentos registrados.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Precio (S/.)</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginados.map((m) => (
                  <tr key={m.idMedicamento} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{m.nombre}</td>
                    <td className="px-4 py-3 text-slate-600 text-right">
                      <span
                        className={
                          m.stock <= 10
                            ? "text-red-600 font-semibold"
                            : m.stock <= 30
                            ? "text-amber-600 font-medium"
                            : ""
                        }
                      >
                        {m.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-right">
                      {parseFloat(m.precio).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge activo={m.activo} />
                    </td>
                    <td className="px-4 py-3 text-center space-x-3">
                      <button
                        onClick={() => abrirEditar(m)}
                        className="text-teal-600 hover:underline text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActivo(m)}
                        className="text-slate-500 hover:underline text-xs font-medium"
                      >
                        {m.activo ? "Desactivar" : "Reactivar"}
                      </button>
                    </td>
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
        title={editando ? "Editar medicamento" : "Nuevo medicamento"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            required
            maxLength={100}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <Input
            label="Stock"
            type="number"
            min="0"
            required
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <Input
            label="Precio (S/.)"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
          />

          <AlertaError mensaje={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
