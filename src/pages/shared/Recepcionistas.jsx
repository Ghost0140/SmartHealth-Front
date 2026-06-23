import { useEffect, useState } from "react";
import {
  listarRecepcionistas,
  registrarRecepcionista,
  actualizarRecepcionista,
  desactivarRecepcionista,
  reactivarRecepcionista,
} from "../../api/recepcionistasService";
import { Input, Button, EstadoBadge, Modal, AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const FORM_VACIO = { nombres: "", apellidos: "", dni: "", telefono: "", email: "" };

export default function Recepcionistas() {
  const [recepcionistas, setRecepcionistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const recepcionistasPorPagina = 5;

  // Un solo useEffect con patrón montado — elimina la carga duplicada
  // que causaba dos llamadas simultáneas a GET /api/recepcionista
  useEffect(() => {
    let montado = true;
    listarRecepcionistas()
      .then((data) => { if (montado) setRecepcionistas(data); })
      .catch((err) => { if (montado) setError(extraerMensajeError(err)); })
      .finally(() => { if (montado) setCargando(false); });
    return () => { montado = false; };
  }, []);

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarRecepcionistas();
      setRecepcionistas(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  const recepcionistasFiltrados = recepcionistas.filter((r) => {
    const nombreCompleto = `${r.nombres} ${r.apellidos}`.toLowerCase();
    const dniLimpio = r.dni.replace(/[.-]/g, "");
    const busquedaLimpia = busqueda.replace(/[.-]/g, "");
    return (
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      dniLimpio.includes(busquedaLimpia)
    );
  });

  const totalPaginas = Math.ceil(recepcionistasFiltrados.length / recepcionistasPorPagina);
  const inicio = (paginaActual - 1) * recepcionistasPorPagina;
  const recepcionistasPaginados = recepcionistasFiltrados.slice(inicio, inicio + recepcionistasPorPagina);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModalAbierto(true);
  }

  function abrirEditar(recepcionista) {
    setEditando(recepcionista);
    setForm({ ...FORM_VACIO, telefono: recepcionista.telefono, email: recepcionista.email });
    setError("");
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (editando) {
        await actualizarRecepcionista(editando.idRecepcionista, {
          telefono: form.telefono,
          email: form.email,
        });
      } else {
        await registrarRecepcionista(form);
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(recepcionista) {
    try {
      if (recepcionista.activo) await desactivarRecepcionista(recepcionista.idRecepcionista);
      else await reactivarRecepcionista(recepcionista.idRecepcionista);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Recepcionistas</h1>
        <Button onClick={abrirCrear}>+ Nuevo recepcionista</Button>
      </div>

      <AlertaError mensaje={error && !modalAbierto ? error : ""} />

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : recepcionistas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay recepcionistas registrados.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recepcionistasPaginados.map((r) => (
                  <tr key={r.idRecepcionista} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{r.nombres} {r.apellidos}</td>
                    <td className="px-4 py-3 text-slate-600">{r.dni}</td>
                    <td className="px-4 py-3 text-slate-600">{r.telefono}</td>
                    <td className="px-4 py-3 text-slate-600">{r.email}</td>
                    <td className="px-4 py-3"><EstadoBadge activo={r.activo} /></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => abrirEditar(r)} className="text-teal-600 hover:underline text-xs font-medium">Editar</button>
                      <button onClick={() => handleToggleActivo(r)} className="text-slate-500 hover:underline text-xs font-medium">
                        {r.activo ? "Desactivar" : "Reactivar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center gap-2 p-4">
              <Button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)}>Anterior</Button>
              <span className="px-3 py-2 text-sm">Página {paginaActual} de {totalPaginas || 1}</span>
              <Button disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>Siguiente</Button>
            </div>
          </>
        )}
      </div>

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editando ? "Editar recepcionista" : "Nuevo recepcionista"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editando && (
            <>
              <Input label="Nombres" required value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
              <Input label="Apellidos" required value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
              <Input label="DNI (8 dígitos)" required maxLength={8} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
            </>
          )}
          <Input label="Teléfono (9 dígitos)" required maxLength={9} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Input label="Email" type="email" required pattern="^[\w.-]+@[\w.-]+\.\w{2,}$" title="Ingresa un correo con formato válido" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <AlertaError mensaje={error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
