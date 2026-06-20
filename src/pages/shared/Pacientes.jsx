import { useEffect, useState } from "react";
import {
  listarPacientes,
  registrarPaciente,
  actualizarPaciente,
  desactivarPaciente,
  reactivarPaciente,
} from "../../api/pacientesService";
import { Input, Button, EstadoBadge, Modal, AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const FORM_VACIO = { nombres: "", apellidos: "", dni: "", telefono: "", email: "" };

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // paciente seleccionado para editar, o null = creando
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarPacientes();
      setPacientes(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModalAbierto(true);
  }

  function abrirEditar(paciente) {
    setEditando(paciente);
    // El backend solo permite editar telefono y email (PacienteUpdateDto)
    setForm({ ...FORM_VACIO, telefono: paciente.telefono, email: paciente.email });
    setError("");
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      if (editando) {
        await actualizarPaciente(editando.idPaciente, {
          telefono: form.telefono,
          email: form.email,
        });
      } else {
        await registrarPaciente(form);
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(paciente) {
    try {
      if (paciente.activo) {
        await desactivarPaciente(paciente.idPaciente);
      } else {
        await reactivarPaciente(paciente.idPaciente);
      }
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Pacientes</h1>
        <Button onClick={abrirCrear}>+ Nuevo paciente</Button>
      </div>

      <AlertaError mensaje={error && !modalAbierto ? error : ""} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : pacientes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay pacientes registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pacientes.map((p) => (
                <tr key={p.idPaciente} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">
                    {p.nombres} {p.apellidos}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.dni}</td>
                  <td className="px-4 py-3 text-slate-600">{p.telefono}</td>
                  <td className="px-4 py-3 text-slate-600">{p.email}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={p.activo} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="text-teal-600 hover:underline text-xs font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActivo(p)}
                      className="text-slate-500 hover:underline text-xs font-medium"
                    >
                      {p.activo ? "Desactivar" : "Reactivar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? "Editar paciente" : "Nuevo paciente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editando && (
            <>
              <Input
                label="Nombres"
                required
                value={form.nombres}
                onChange={(e) => setForm({ ...form, nombres: e.target.value })}
              />
              <Input
                label="Apellidos"
                required
                value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              />
              <Input
                label="DNI (8 dígitos)"
                required
                maxLength={8}
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
              />
            </>
          )}

          <Input
            label="Teléfono (9 dígitos)"
            required
            maxLength={9}
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            pattern="^[\w.-]+@[\w.-]+\.\w{2,}$"
            title="Ingresa un correo con formato válido, ej: nombre@dominio.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <AlertaError mensaje={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>
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
