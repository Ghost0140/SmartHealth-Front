import { useEffect, useState } from "react";
import {
  listarDoctores,
  registrarDoctor,
  actualizarDoctor,
  desactivarDoctor,
  reactivarDoctor,
  listarEspecialidades,
} from "../../api/doctoresService";
import { useAuth } from "../../context/AuthContext";
import { Input, Select, Button, EstadoBadge, Modal, AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const FORM_VACIO = {
  idEspecialidad: "",
  nombres: "",
  apellidos: "",
  dni: "",
  telefono: "",
  email: "",
  disponible: true,
};

export default function Doctores() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMIN";

  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const [listaDoctores, listaEspecialidades] = await Promise.all([
        listarDoctores(),
        listarEspecialidades(true),
      ]);
      setDoctores(listaDoctores);
      setEspecialidades(listaEspecialidades);
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

  function abrirEditar(doctor) {
    setEditando(doctor);
    setForm({
      ...FORM_VACIO,
      idEspecialidad: doctor.idEspecialidad,
      telefono: doctor.telefono,
      email: doctor.email,
      disponible: doctor.disponible,
    });
    setError("");
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      if (editando) {
        await actualizarDoctor(editando.idDoctor, {
          idEspecialidad: Number(form.idEspecialidad),
          telefono: form.telefono,
          email: form.email,
          disponible: form.disponible,
        });
      } else {
        await registrarDoctor({
          idEspecialidad: Number(form.idEspecialidad),
          nombres: form.nombres,
          apellidos: form.apellidos,
          dni: form.dni,
          telefono: form.telefono,
          email: form.email,
        });
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(doctor) {
    try {
      if (doctor.activo) {
        await desactivarDoctor(doctor.idDoctor);
      } else {
        await reactivarDoctor(doctor.idDoctor);
      }
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Doctores</h1>
        {esAdmin && <Button onClick={abrirCrear}>+ Nuevo doctor</Button>}
      </div>

      <AlertaError mensaje={error && !modalAbierto ? error : ""} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : doctores.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay doctores registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Especialidad</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Disponible</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                {esAdmin && <th className="px-4 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctores.map((d) => (
                <tr key={d.idDoctor} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">
                    Dr. {d.nombres} {d.apellidos}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.nombreEspecialidad}</td>
                  <td className="px-4 py-3 text-slate-600">{d.dni}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.telefono}
                    <br />
                    <span className="text-xs text-slate-400">{d.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={d.disponible} />
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={d.activo} />
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => abrirEditar(d)}
                        className="text-teal-600 hover:underline text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActivo(d)}
                        className="text-slate-500 hover:underline text-xs font-medium"
                      >
                        {d.activo ? "Desactivar" : "Reactivar"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {esAdmin && (
        <Modal
          open={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={editando ? "Editar doctor" : "Nuevo doctor"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Especialidad"
              required
              value={form.idEspecialidad}
              onChange={(e) => setForm({ ...form, idEspecialidad: e.target.value })}
            >
              <option value="" disabled>
                Selecciona una especialidad
              </option>
              {especialidades.map((esp) => (
                <option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                  {esp.nombre}
                </option>
              ))}
            </Select>

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

            {editando && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Disponible para citas
              </label>
            )}

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
      )}
    </div>
  );
}
