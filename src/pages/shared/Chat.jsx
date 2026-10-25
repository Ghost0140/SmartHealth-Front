import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listarMensajesChat } from "../../api/chatService";
import { listarDoctores } from "../../api/doctoresService";
import { listarRecepcionistas } from "../../api/recepcionistasService";
import { AlertaError, Button, Input } from "../../components/ui";
import { extraerMensajeError } from "../../utils/errorHandler";

const CHAT_URL = "http://localhost:8088/chat";
const STOMP_DESTINO = "/app/mensaje";

function identidadPorUsuario(usuario) {
  if (usuario?.rol === "ADMIN") return "admin";
  if (usuario?.rol === "DOCTOR" && usuario.idDoctor) return `doctor:${usuario.idDoctor}`;
  if (usuario?.rol === "RECEPCIONISTA" && usuario.correo) {
    return `recepcionista:${usuario.correo.trim().toLowerCase()}`;
  }
  return "";
}

function aliasPorRol(rol) {
  return rol?.toLowerCase() ?? "";
}

function inicialDe(nombre) {
  return nombre?.trim()?.charAt(0)?.toUpperCase() ?? "?";
}

function formatoHora(fecha) {
  if (!fecha) return new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return new Date(fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${src}"]`);
    if (existente) {
      if (existente.dataset.loaded === "true") resolve();
      else existente.addEventListener("load", resolve, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function cargarDependenciasChat() {
  await cargarScript("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js");
  await cargarScript("https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js");
}

export default function Chat() {
  const { usuario } = useAuth();
  const identidad = identidadPorUsuario(usuario);
  const rolAlias = aliasPorRol(usuario?.rol);
  const [doctores, setDoctores] = useState([]);
  const [recepcionistas, setRecepcionistas] = useState([]);
  const [receptor, setReceptor] = useState("");
  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [contenido, setContenido] = useState("");
  const [conectado, setConectado] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [error, setError] = useState("");
  const stompRef = useRef(null);
  const mensajesRef = useRef(null);

  const contactos = useMemo(() => {
    const lista = [];

    if (usuario?.rol !== "ADMIN") {
      lista.push({
        id: "admin",
        nombre: "Administrador",
        detalle: "Administración",
        rol: "ADMIN",
        inicial: "A",
      });
    }

    doctores.forEach((doctor) => {
      const id = `doctor:${doctor.idDoctor}`;
      if (id === identidad) return;

      const nombre = `Dr. ${doctor.nombres} ${doctor.apellidos}`.trim();
      lista.push({
        id,
        nombre,
        detalle: doctor.nombreEspecialidad || doctor.email,
        correo: doctor.email,
        rol: "DOCTOR",
        inicial: inicialDe(doctor.nombres),
      });
    });

    recepcionistas.forEach((recepcionista) => {
      const correo = recepcionista.email?.trim().toLowerCase();
      if (!correo) return;

      const id = `recepcionista:${correo}`;
      if (id === identidad) return;

      const nombre = `${recepcionista.nombres} ${recepcionista.apellidos}`.trim();
      lista.push({
        id,
        nombre,
        detalle: recepcionista.email,
        correo: recepcionista.email,
        rol: "RECEPCIONISTA",
        inicial: inicialDe(recepcionista.nombres),
      });
    });

    lista.push({
      id: "sistema",
      nombre: "Avisos del sistema",
      detalle: "Mensajes automáticos",
      rol: "SYSTEM",
      inicial: "S",
    });

    return lista;
  }, [doctores, recepcionistas, identidad, usuario?.rol]);

  const receptorActivo = contactos.some((contacto) => contacto.id === receptor)
    ? receptor
    : contactos[0]?.id ?? "";

  const contactosFiltrados = contactos.filter((contacto) =>
    `${contacto.nombre} ${contacto.detalle ?? ""} ${contacto.rol}`
      .toLowerCase()
      .includes(busquedaContacto.trim().toLowerCase())
  );

  const conversacion = useMemo(
    () =>
      mensajes
        .filter(
          (mensaje) =>
            (receptorActivo === "sistema" &&
              mensaje.emisor === "Sistema" &&
              (mensaje.receptor === identidad || mensaje.receptor === rolAlias)) ||
            (receptorActivo !== "sistema" &&
              ((mensaje.emisor === identidad && mensaje.receptor === receptorActivo) ||
                (mensaje.emisor === receptorActivo && mensaje.receptor === identidad)))
        )
        .sort((a, b) => new Date(a.fecha ?? 0) - new Date(b.fecha ?? 0)),
    [mensajes, identidad, receptorActivo, rolAlias]
  );

  useEffect(() => {
    let activo = true;

    Promise.all([listarDoctores(true), listarRecepcionistas(true)])
      .then(([listaDoctores, listaRecepcionistas]) => {
        if (!activo) return;
        setDoctores(listaDoctores);
        setRecepcionistas(listaRecepcionistas);
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err));
      });

    return () => {
      activo = false;
    };
  }, []);

  async function cargarHistorial() {
    try {
      if (!identidad) return;
      const data = await listarMensajesChat();
      setMensajes(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  useEffect(() => {
    let activo = true;

    if (!identidad) return undefined;

    listarMensajesChat()
      .then((data) => {
        if (activo) setMensajes(data);
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err));
      });

    return () => {
      activo = false;
    };
  }, [identidad, rolAlias]);

  useEffect(() => {
    mensajesRef.current?.scrollTo({
      top: mensajesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversacion.length, receptorActivo]);

  useEffect(() => {
    return () => {
      if (stompRef.current?.connected) {
        stompRef.current.disconnect();
      }
    };
  }, []);

  async function conectar() {
    if (stompRef.current?.connected || conectando) return;

    if (!identidad) {
      setError("No se encontró una identidad válida para esta cuenta. Cierra sesión e inicia nuevamente.");
      return;
    }

    setError("");
    setConectando(true);

    try {
      await cargarDependenciasChat();

      const socket = new window.SockJS(CHAT_URL);
      const stomp = window.Stomp.over(socket);
      stomp.debug = null;

      stomp.connect(
        { Authorization: `Bearer ${localStorage.getItem("token")}` },
        () => {
          stompRef.current = stomp;
          setConectado(true);
          setConectando(false);

          const destinos = [...new Set([identidad, rolAlias].filter(Boolean))];

          destinos.forEach((destino) => {
            stomp.subscribe(`/topic/${destino}`, (message) => {
              const recibido = JSON.parse(message.body);

              setMensajes((actuales) =>
                recibido.id && actuales.some((actual) => actual.id === recibido.id)
                  ? actuales
                  : [...actuales, recibido]
              );
            });
          });
        },
        () => {
          setConectado(false);
          setConectando(false);
          setError("No se pudo conectar con el servicio de chat.");
        }
      );
    } catch {
      setConectando(false);
      setError("No se pudieron cargar las librerias del chat.");
    }
  }

  function desconectar() {
    if (stompRef.current?.connected) {
      stompRef.current.disconnect(() => {
        setConectado(false);
      });
    } else {
      setConectado(false);
    }

    stompRef.current = null;
  }

  function enviarMensaje(e) {
    e.preventDefault();
    const texto = contenido.trim();

    if (!texto || !receptorActivo) return;

    if (receptorActivo === "sistema") {
      setError("Los avisos del sistema son de solo lectura.");
      return;
    }

    if (!stompRef.current?.connected) {
      setError("Conecta el chat antes de enviar mensajes.");
      return;
    }

    const mensaje = {
      emisor: identidad,
      receptor: receptorActivo,
      contenido: texto,
    };

    stompRef.current.send(STOMP_DESTINO, {}, JSON.stringify(mensaje));

    setMensajes((actuales) => [
      ...actuales,
      { ...mensaje, id: `local-${Date.now()}`, fecha: new Date().toISOString() },
    ]);

    setContenido("");
  }

  const contactoActivo = contactos.find((contacto) => contacto.id === receptorActivo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Chat interno</h1>
          <p className="mt-1 text-sm text-slate-500">
            Comunicación básica entre administrador, doctores y recepción
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              conectado ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {conectado ? `Conectado como ${identidad}` : `Usuario de chat: ${identidad}`}
          </span>

          <Button variant="secondary" onClick={cargarHistorial}>
            Actualizar historial
          </Button>

          {conectado ? (
            <Button variant="danger" onClick={desconectar}>
              Desconectar
            </Button>
          ) : (
            <Button onClick={conectar} disabled={conectando}>
              {conectando ? "Conectando..." : "Conectar"}
            </Button>
          )}
        </div>
      </div>

      <AlertaError mensaje={error} />

      <div className="grid h-[min(72vh,680px)] min-h-[440px] grid-rows-[minmax(180px,38%)_minmax(0,1fr)] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-rows-1 lg:grid-cols-[280px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Conversaciones
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Elige una persona concreta para abrir una conversación privada.
            </p>
          </div>

          <div className="mb-3">
            <Input
              label="Buscar persona"
              type="search"
              value={busquedaContacto}
              onChange={(e) => setBusquedaContacto(e.target.value)}
              placeholder="Nombre, correo o especialidad"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {contactosFiltrados.map((contacto) => {
              const activo = receptorActivo === contacto.id;

              return (
                <button
                  key={contacto.id}
                  type="button"
                  onClick={() => setReceptor(contacto.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    activo
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-200"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                    {contacto.inicial}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {contacto.nombre}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {contacto.rol === "DOCTOR"
                        ? "Doctor"
                        : contacto.rol === "RECEPCIONISTA"
                          ? "Recepcionista"
                          : contacto.rol === "SYSTEM"
                            ? "Sistema"
                            : "Administrador"}
                      {contacto.detalle ? ` · ${contacto.detalle}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}

            {contactosFiltrados.length === 0 && (
              <p className="rounded-lg px-2 py-3 text-sm text-slate-500">
                No hay personas que coincidan con la búsqueda.
              </p>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {contactoActivo?.nombre ?? receptorActivo}
              </p>
              <p className="text-xs text-slate-400">
                {contactoActivo?.rol === "SYSTEM"
                  ? "Avisos automáticos del sistema"
                  : `Conversación directa con ${contactoActivo?.nombre ?? ""}`}
              </p>
            </div>
          </header>

          <div
            ref={mensajesRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5"
          >
            {conversacion.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    No hay mensajes en esta conversación.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Conecta el chat y envia un mensaje para probar el WebSocket.
                  </p>
                </div>
              </div>
            ) : (
              conversacion.map((mensaje, index) => {
                const mio = mensaje.emisor === identidad;

                return (
                  <div
                    key={mensaje.id ?? `${mensaje.emisor}-${mensaje.fecha}-${index}`}
                    className={`flex ${mio ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        mio
                          ? "rounded-br-md bg-teal-600 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <p className="break-words">{mensaje.contenido}</p>
                      <p
                        className={`mt-1 text-[11px] ${
                          mio ? "text-teal-50" : "text-slate-400"
                        }`}
                      >
                        {mensaje.emisor} · {formatoHora(mensaje.fecha)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={enviarMensaje} className="border-t border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviarMensaje(e);
                  }
                }}
                placeholder="Escribe un mensaje interno..."
                className="min-h-12 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Button
                type="submit"
                disabled={
                  !contenido.trim() || !receptorActivo || receptorActivo === "sistema"
                }
              >
                Enviar
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}