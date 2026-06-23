import { useEffect, useState } from "react";
import {
  listarUsuarios,
  registrarUsuario,
  actualizarUsuario,
  desactivarUsuario,
  reactivarUsuario,
  listarRoles,
} from "../../api/usuariosService";
import { Input, Select, Button, EstadoBadge, Modal, AlertaError } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

// ADMIN no puede crearse a sí mismo desde aquí —
// solo RECEPCIONISTA y DOCTOR son roles asignables
const ROLES_CREABLES = ["RECEPCIONISTA", "DOCTOR"];
const FORM_VACIO = { correo: "", clave: "", idRol: "", idDoctor: "" };
const USUARIOS_POR_PAGINA = 8;

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  // Un solo useEffect con patrón montado
  useEffect(() => {
    let montado = true;
    Promise.all([listarUsuarios(), listarRoles(true)])
      .then(([listaUsuarios, listaRoles]) => {
        if (!montado) return;
        setUsuarios(listaUsuarios);
        setRoles(listaRoles);
      })
      .catch((err) => { if (montado) setError(extraerMensajeError(err)); })
      .finally(() => { if (montado) setCargando(false); });
    return () => { montado = false; };
  }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [listaUsuarios, listaRoles] = await Promise.all([listarUsuarios(), listarRoles(true)]);
      setUsuarios(listaUsuarios);
      setRoles(listaRoles);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  const rolesPermitidos = roles.filter((r) => ROLES_CREABLES.includes(r.nombre));
  const rolSeleccionado = rolesPermitidos.find((r) => r.idRol.toString() === form.idRol.toString());
  const esDoctorSeleccionado = rolSeleccionado?.nombre === "DOCTOR";

  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.correo} ${u.nombreRol}`.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalPaginas = Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA);
  const inicio = (paginaActual - 1) * USUARIOS_POR_PAGINA;
  const usuariosPaginados = usuariosFiltrados.slice(inicio, inicio + USUARIOS_POR_PAGINA);

  function abrirCrear() {
    setEditando(null);
    setForm({ ...FORM_VACIO, idRol: rolesPermitidos[0]?.idRol ?? "" });
    setError("");
    setModalAbierto(true);
  }

  function abrirEditar(usuario) {
    setEditando(usuario);
    setForm({ ...FORM_VACIO, correo: usuario.correo });
    setError("");
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (editando) {
        // UsuarioUpdateDto solo acepta correo — confirmado contra el backend
        await actualizarUsuario(editando.idUsuario, { correo: form.correo });
      } else {
        if (!rolSeleccionado) throw new Error("Solo se pueden crear usuarios RECEPCIONISTA o DOCTOR.");
        if (esDoctorSeleccionado && !form.idDoctor) throw new Error("Debes indicar el id del doctor asociado.");
        await registrarUsuario({
          correo: form.correo,
          clave: form.clave,
          idRol: Number(form.idRol),
          idDoctor: esDoctorSeleccionado ? Number(form.idDoctor) : null,
        });
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(err.response ? extraerMensajeError(err) : err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(usuario) {
    try {
      if (usuario.activo) await desactivarUsuario(usuario.idUsuario);
      else await reactivarUsuario(usuario.idUsuario);
      await cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Usuarios</h1>
        <Button onClick={abrirCrear}>+ Nuevo usuario</Button>
      </div>

      <AlertaError mensaje={error && !modalAbierto ? error : ""} />

      <div className="mb-4">
        <Input
          placeholder="Buscar por correo o rol..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
        {cargando ? (
          <p className="p-6 text-sm text-slate-500">Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay usuarios registrados.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Doctor asociado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosPaginados.map((u) => (
                  <tr key={u.idUsuario} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{u.correo}</td>
                    <td className="px-4 py-3 text-slate-600">{u.nombreRol}</td>
                    <td className="px-4 py-3 text-slate-600">{u.idDoctor ? `#${u.idDoctor}` : "—"}</td>
                    <td className="px-4 py-3"><EstadoBadge activo={u.activo} /></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => abrirEditar(u)} className="text-teal-600 hover:underline text-xs font-medium">Editar</button>
                      <button onClick={() => handleToggleActivo(u)} className="text-slate-500 hover:underline text-xs font-medium">
                        {u.activo ? "Desactivar" : "Reactivar"}
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

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editando ? "Editar usuario" : "Nuevo usuario"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Correo" type="email" required value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          {!editando && (
            <>
              <Input
                label="Clave"
                type="password"
                required
                minLength={8}
                maxLength={64}
                value={form.clave}
                onChange={(e) => setForm({ ...form, clave: e.target.value })}
              />
              <p className="text-xs text-slate-400">Mínimo 8 caracteres: mayúscula, minúscula, número y carácter especial (@$!%*?&._#-)</p>
              <Select label="Rol" required value={form.idRol} disabled={rolesPermitidos.length === 0} onChange={(e) => setForm({ ...form, idRol: e.target.value, idDoctor: "" })}>
                {rolesPermitidos.length === 0 ? (
                  <option value="">No hay roles disponibles</option>
                ) : (
                  rolesPermitidos.map((r) => (
                    <option key={r.idRol} value={r.idRol}>{r.nombre}</option>
                  ))
                )}
              </Select>
              {esDoctorSeleccionado && (
                <Input
                  label="ID del doctor asociado"
                  type="number"
                  required
                  min={1}
                  value={form.idDoctor}
                  onChange={(e) => setForm({ ...form, idDoctor: e.target.value })}
                />
              )}
            </>
          )}
          <AlertaError mensaje={error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando || (!editando && rolesPermitidos.length === 0)}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
