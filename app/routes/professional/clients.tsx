import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
  cliente_id: number;
  nombre: string;
  email: string;
  sesiones_restantes: number;
  proxima_sesion: string;
  hora_proxima_sesion: string;
  estado: string;
};

interface Reserva {
  reserva_id: number;
  fecha: string;
  hora: string;
  estado: string;
  cliente_nombre: string;
  servicio: { nombre: string; duracion: number; modalidad: string };
  pago?: {
    pago_id?: number;
    estado: "pendiente" | "aprobado" | "rechazado" | "fallido";
    metodo?: "paypal" | "presencial";
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  pendiente:  "bg-amber-100 text-amber-800",
  confirmada: "bg-blue-100  text-blue-800",
  pagada:     "bg-green-100 text-green-800",
  en_curso:   "bg-violet-100 text-violet-800",
  finalizada: "bg-gray-100  text-gray-600",
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente:  "Pendiente",
  confirmada: "Confirmada",
  pagada:     "Pagada",
  en_curso:   "En curso",
  finalizada: "Finalizada",
};

function getInitials(nombre: string) {
  return nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// Ventana de acceso a la videollamada: desde 10 min antes hasta que termine la sesión.
function puedeEntrarVideollamada(reserva: Reserva) {
  if (reserva.servicio?.modalidad !== "virtual") return false;
  if (["cancelada", "no_asistida"].includes(reserva.estado)) return false;

  const ahora = new Date();
  const inicio = new Date(`${reserva.fecha}T${reserva.hora}`);
  const fin = new Date(inicio);
  fin.setMinutes(fin.getMinutes() + (reserva.servicio?.duracion ?? 60));
  const desde = new Date(inicio);
  desde.setMinutes(desde.getMinutes() - 10);
  return ahora >= desde && ahora <= fin;
}

// Estados que cuentan como reserva activa/futura — incluye "pagada" porque las
// reservas de paquete suelen quedar en ese estado en vez de "confirmada".
const ESTADOS_ACTIVOS = ["pendiente", "confirmada", "pagada", "en_curso"];

function getProximoServicioNombre(clienteNombre: string, reservas: Reserva[]): string {
  const proxima = reservas
    .filter((r) => r.cliente_nombre === clienteNombre && ESTADOS_ACTIVOS.includes(r.estado))
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))[0];
  return proxima?.servicio?.nombre ?? "—";
}

function getServiciosAdquiridos(clienteNombre: string, reservas: Reserva[]): string {
  const nombres = Array.from(
    new Set(
      reservas
        .filter((r) => r.cliente_nombre === clienteNombre)
        .map((r) => r.servicio?.nombre)
        .filter((n): n is string => !!n)
    )
  );
  return nombres.length > 0 ? nombres.join(", ") : "—";
}

function tieneReservaFutura(clienteNombre: string, reservas: Reserva[]): boolean {
  return reservas.some(
    (r) => r.cliente_nombre === clienteNombre && ESTADOS_ACTIVOS.includes(r.estado)
  );
}

// Mobile: solo Cliente + Sesión, sin scroll horizontal.
// Tabla "Próximas reservas de servicio": Cliente, Email, Servicio, Sesión, Estado
const ROW_GRID_SERVICIO = "grid grid-cols-[2fr_1.4fr] md:grid-cols-[2fr_2.5fr_2fr_1.6fr_140px]";
// Tabla "Próximas reservas de paquete": Cliente, Email, Servicio, Sesión, Restantes
const ROW_GRID_PAQUETE = "grid grid-cols-[2fr_1.4fr] md:grid-cols-[2fr_2.5fr_2fr_2fr_110px]";
// Tabla "Historial": Nombre, Email, Servicios adquiridos
const ROW_GRID_HISTORIAL = "grid grid-cols-[1.5fr_1fr] md:grid-cols-[2fr_2.5fr_3fr]";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Clients() {
  const { token } = useAuth();

  const [reservas,       setReservas]       = useState<Reserva[]>([]);
  const [clientesProximos, setClientesProximos] = useState<Client[]>([]);
  const [clientesHistoricos, setClientesHistoricos] = useState<Client[]>([]);
  const [clientesPaquetes, setClientesPaquetes] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [search,         setSearch]         = useState("");
  const [asistio, setAsistio] = useState<boolean | null>(null);
  const [marcandoAsistencia, setMarcandoAsistencia] = useState(false);
  const [asistenciaError, setAsistenciaError] = useState<string | null>(null);

  // Selección: cliente y/o turno específico
  const [selectedClient,  setSelectedClient]  = useState<Client | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // Control de acción en curso
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionMode, setActionMode] = useState<"none" | "attendance">("none");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAgenda = () => {
    if (!token) return;
    api
      .get<{ success: boolean; data: Reserva[] }>("/mi-agenda", token)
      .then((res) => { if (res.success) setReservas(res.data); })
      .catch(() => {});
  };

  useEffect(() => {
    if (!token) return;

    fetchAgenda();
    setClientsLoading(true);

    api
      .get<{
        sesiones: Client[];
        historicos: Client[];
        paquetes: Client[];
      }>("/clientes", token)
      .then((data) => {
        setClientesProximos(data.sesiones || []);
        setClientesHistoricos(data.historicos || []);
        setClientesPaquetes(data.paquetes || []);
      })
      .catch(() => {
        setClientesProximos([]);
        setClientesHistoricos([]);
        setClientesPaquetes([]);
      })
      .finally(() => setClientsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const handler = () => fetchAgenda();
    window.addEventListener("reserva-updated", handler);
    return () => window.removeEventListener("reserva-updated", handler);
  }, [token]);

  // ── Cambiar estado de reserva ──────────────────────────────────────────────
  const cambiarEstado = async (reservaId: number, estado: "confirmada" | "cancelada") => {
    try {
      setUpdatingId(reservaId);
      await api.put(`/reservas/${reservaId}/estado`, { estado }, token);
      // Actualizar lista local sin re-fetch completo
      setReservas((prev) =>
        prev.map((r) => r.reserva_id === reservaId ? { ...r, estado } : r)
      );
      // Sincronizar la reserva seleccionada si corresponde
      if (selectedReserva?.reserva_id === reservaId) {
        setSelectedReserva((prev) => prev ? { ...prev, estado } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };
  const cancelarReserva = async (reservaId: number) => {
      console.log("CANCELAR RESERVA", reservaId);

    await api.put(`/reservas/${reservaId}/cancelar`, {}, token);
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const filteredClients = [...clientesProximos, ...clientesHistoricos, ...clientesPaquetes].filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  // Reservas del cliente seleccionado
  const clientReservas = selectedClient
    ? reservas.filter((r) => r.cliente_nombre === selectedClient.nombre)
    : [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleClientClick = (c: Client) => {
    const isAlreadySelected = selectedClient?.cliente_id === c.cliente_id && !selectedReserva;
    if (isAlreadySelected) {
      setSelectedClient(null);
      setSelectedReserva(null);
    } else {
      setSelectedClient(c);
      setSelectedReserva(null);
    }
  };

  const closePanel = () => {
    setSelectedClient(null);
    setSelectedReserva(null);
  };

  const panelOpen = !!selectedClient;

  const filteredProximos = clientesProximos.filter((c) =>
  `${c.nombre} ${c.email}`
    .toLowerCase()
    .includes(search.toLowerCase())
);

const filteredHistoricos = clientesHistoricos
  .filter((c) =>
    `${c.nombre} ${c.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )
  .filter((c) => !tieneReservaFutura(c.nombre, reservas));

const filteredpaquete = clientesPaquetes.filter((c) =>
  `${c.nombre} ${c.email}`
    .toLowerCase()
    .includes(search.toLowerCase())
);
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 w-full">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Clientes</h1>
        <p className="text-ink-muted mt-1">
          Hacé click en un cliente para ver detalles y gestionar sus reservas
        </p>
      </div>

      {/* CLIENTES ────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="relative max-w-2xl">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
            <SearchIcon />
          </span>
          <input
            className="w-full border border-border rounded-full pl-10 pr-4 py-2.5 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
            placeholder="Buscar por nombre o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLA 1 — Próximas reservas de servicio */}
        <div>
          <h2 className="text-sm font-bold text-ink mb-2">
            Próximas reservas de servicio ({filteredProximos.length})
          </h2>
          {clientsLoading ? (
            <TableSkeleton gridClass={ROW_GRID_SERVICIO} columns={5} />
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="md:overflow-x-auto">
                <div className="md:min-w-[760px]">
                  <div className={`${ROW_GRID_SERVICIO} px-5 py-2 border-b border-border`}>
                    <div className="text-sm text-ink-muted">Cliente</div>
                    <div className="hidden md:block text-sm text-ink-muted">Email</div>
                    <div className="hidden md:block text-sm text-ink-muted">Servicio</div>
                    <div className="text-sm text-ink-muted">Sesión</div>
                    <div className="hidden md:block text-sm text-ink-muted">Estado</div>
                  </div>

                  {filteredProximos.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-ink-muted">No hay clientes con reservas futuras</div>
                  ) : (
                    filteredProximos.map((c, idx) => {
                      const isSelected = selectedClient?.cliente_id === c.cliente_id;
                      return (
                        <div
                          key={c.cliente_id}
                          onClick={() => handleClientClick(c)}
                          className={`${ROW_GRID_SERVICIO} items-center px-5 py-4 cursor-pointer transition-colors ${idx > 0 ? "border-t border-border" : ""} ${isSelected ? "bg-accent/10" : "hover:bg-bg"}`}
                        >
                          <span className="text-sm text-ink truncate">{c.nombre}</span>
                          <span className="hidden md:block text-sm text-ink-muted truncate">{c.email}</span>
                          <span className="hidden md:block text-sm text-ink-muted truncate">
                            {getProximoServicioNombre(c.nombre, reservas)}
                          </span>
                          <span className="text-sm text-ink">
                            {c.proxima_sesion}{" "}
                            {c.hora_proxima_sesion?.slice(0, 5) ?? ""}
                          </span>
                          <span className="hidden md:block">
                            <span className={`badge w-fit ${c.estado === "EN SESION" ? "badge-en-vivo" : "badge-confirmada"}`}>
                              {c.estado}
                            </span>
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TABLA 2 — Próximas reservas de paquete */}
        <div>
          <h2 className="text-sm font-bold text-ink mb-2">
            Próximas reservas de paquete ({filteredpaquete.length})
          </h2>
          {clientsLoading ? (
            <TableSkeleton gridClass={ROW_GRID_PAQUETE} columns={5} />
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="md:overflow-x-auto">
                <div className="md:min-w-[760px]">
                  <div className={`${ROW_GRID_PAQUETE} px-5 py-2 border-b border-border`}>
                    <div className="text-sm text-ink-muted">Cliente</div>
                    <div className="hidden md:block text-sm text-ink-muted">Email</div>
                    <div className="hidden md:block text-sm text-ink-muted">Servicio</div>
                    <div className="text-sm text-ink-muted">Sesión</div>
                    <div className="hidden md:block text-sm text-ink-muted">Restantes</div>
                  </div>

                  {filteredpaquete.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-ink-muted">No hay clientes con reservas de paquete futuras</div>
                  ) : (
                    filteredpaquete.map((c, idx) => {
                      const isSelected = selectedClient?.cliente_id === c.cliente_id;
                      return (
                        <div
                          key={c.cliente_id}
                          onClick={() => handleClientClick(c)}
                          className={`${ROW_GRID_PAQUETE} items-center px-5 py-4 cursor-pointer transition-colors ${idx > 0 ? "border-t border-border" : ""} ${isSelected ? "bg-accent/10" : "hover:bg-bg"}`}
                        >
                          <span className="text-sm text-ink truncate">{c.nombre}</span>
                          <span className="hidden md:block text-sm text-ink-muted truncate">{c.email}</span>
                          <span className="hidden md:block text-sm text-ink-muted truncate">
                            {getProximoServicioNombre(c.nombre, reservas)}
                          </span>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-ink">
                              {c.proxima_sesion}{" "}
                              {c.hora_proxima_sesion?.slice(0, 5) ?? ""}
                            </span>
                            <span className={`badge w-fit ${c.estado === "EN SESION" ? "badge-en-vivo" : "badge-confirmada"}`}>
                              {c.estado}
                            </span>
                          </div>
                          <span className="hidden md:block text-sm text-ink-muted">{c.sesiones_restantes}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TABLA 3 — Historial de clientes */}
        <div>
          <h2 className="text-sm font-bold text-ink mb-2">
            Historial de clientes ({filteredHistoricos.length})
          </h2>
          {clientsLoading ? (
            <TableSkeleton gridClass={ROW_GRID_HISTORIAL} columns={3} />
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="md:overflow-x-auto">
                <div className="md:min-w-[640px]">
                  <div className={`${ROW_GRID_HISTORIAL} px-5 py-2 border-b border-border`}>
                    <div className="text-sm text-ink-muted">Nombre</div>
                    <div className="hidden md:block text-sm text-ink-muted">Email</div>
                    <div className="text-sm text-ink-muted">Servicios adquiridos</div>
                  </div>

                  {filteredHistoricos.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-ink-muted">No hay clientes históricos</div>
                  ) : (
                    filteredHistoricos.map((c, idx) => {
                      const isSelected = selectedClient?.cliente_id === c.cliente_id;
                      return (
                        <div
                          key={c.cliente_id}
                          onClick={() => handleClientClick(c)}
                          className={`${ROW_GRID_HISTORIAL} items-center px-5 py-4 cursor-pointer transition-colors ${idx > 0 ? "border-t border-border" : ""} ${isSelected ? "bg-accent/10" : "hover:bg-bg"}`}
                        >
                          <span className="text-sm text-ink truncate">{c.nombre}</span>
                          <span className="hidden md:block text-sm text-ink-muted truncate">{c.email}</span>
                          <span className="text-sm text-ink-muted truncate">
                            {getServiciosAdquiridos(c.nombre, reservas)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Panel de detalle — drawer lateral, como al editar/crear servicio ── */}
      {panelOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closePanel} />

          <div className="relative w-full max-w-lg bg-surface shadow-xl rounded-2xl flex flex-col overflow-hidden max-h-[calc(100vh-2rem)]">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
                  {selectedReserva ? "Turno" : "Cliente"}
                </p>
                <button onClick={closePanel} className="text-ink-muted hover:text-ink transition-colors cursor-pointer">
                  <CloseIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">

              {/* Avatar + datos */}
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-ink-fixed flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {getInitials(selectedClient.nombre)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{selectedClient.nombre}</p>
                  <p className="text-xs text-ink-muted truncate">{selectedClient.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                <div className="px-5 py-3">
                  <p className="text-xs text-ink-muted uppercase tracking-widest font-bold mb-1">Sesiones</p>
                  <p className="font-display text-2xl text-ink font-bold">{selectedClient.sesiones_restantes}</p>
                  <p className="text-xs text-ink-muted">restantes</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs text-ink-muted uppercase tracking-widest font-bold mb-1">Próxima</p>
                  <p className="text-xs text-ink font-semibold leading-snug">
                    {selectedClient.proxima_sesion ? `${selectedClient.proxima_sesion}` : "—"}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {selectedClient.hora_proxima_sesion?.slice(0, 5) ?? ""}
                  </p>
                </div>
              </div>

              {/* Turno seleccionado */}
              {selectedReserva && (
                <div className="px-5 py-4 border-b border-border">
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">
                    Turno seleccionado
                  </p>

                  <ReservaCard
                    reserva={selectedReserva}
                    updatingId={updatingId}
                    onCambiarEstado={cambiarEstado}
                    onCancelarReserva={cancelarReserva}
                    highlight
                  />

                  {/* SOLO SI ESTÁ EN CURSO O FINALIZADA */}
                  {/* ───── ASISTENCIA ───── */}
                  {(selectedReserva.estado === "en_curso" ||
                    selectedReserva.estado === "finalizada") &&
                    !asistio && (
                      <div className="space-y-2 mt-3">
                        <div className="flex gap-2">
                          <button
                            disabled={marcandoAsistencia}
                            className="flex-1 bg-green-600 text-white rounded py-1.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                            onClick={async () => {
                              const r = selectedReserva;
                              setMarcandoAsistencia(true);
                              setAsistenciaError(null);

                              try {
                                const res = await api.put<{ success: boolean; message?: string }>(
                                  `/reservas/${r.reserva_id}/asistida`,
                                  {},
                                  token
                                );

                                if (!res.success) {
                                  setAsistenciaError(res.message ?? "No se pudo marcar la asistencia");
                                  return;
                                }

                                setReservas((prev) =>
                                  prev.map((x) =>
                                    x.reserva_id === r.reserva_id
                                      ? { ...x, estado: "finalizada" }
                                      : x
                                  )
                                );

                                setSelectedReserva((prev) =>
                                  prev ? { ...prev, estado: "finalizada" } : null
                                );

                                setAsistio(true);
                              } catch (e: any) {
                                setAsistenciaError(e.message ?? "No se pudo marcar la asistencia");
                              } finally {
                                setMarcandoAsistencia(false);
                              }
                            }}
                          >
                            {marcandoAsistencia ? "Marcando..." : "Marcar asistencia"}
                          </button>

                          <button
                            disabled={marcandoAsistencia}
                            className="flex-1 bg-red-600 text-white rounded py-1.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                            onClick={async () => {
                              const r = selectedReserva;

                              await api.put(
                                `/reservas/${r.reserva_id}/no-asistida`,
                                { estado: "no_asistida" },
                                token
                              );

                              setReservas((prev) =>
                                prev.map((x) =>
                                  x.reserva_id === r.reserva_id
                                    ? { ...x, estado: "no_asistida" }
                                    : x
                                )
                              );

                              setSelectedReserva((prev) =>
                                prev ? { ...prev, estado: "no_asistida" } : null
                              );
                            }}
                          >
                            No asistió
                          </button>
                        </div>
                        {asistenciaError && (
                          <p className="text-xs text-red-600">{asistenciaError}</p>
                        )}
                      </div>
                  )}


                  {/* ───── PAGO ───── */}
                  {selectedReserva.pago &&
                    ["en_curso", "finalizada", "no_asistida"].includes(selectedReserva.estado) && (
                      <div className="mt-3">
                        {selectedReserva.pago.estado === "aprobado" ? (
                          <div className="w-full bg-green-100 text-green-800 rounded py-1.5 text-xs font-semibold text-center">
                            ✓ Pagado
                          </div>
                        ) : (
                          <button
                            className="w-full bg-blue-600 text-white rounded py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors"
                            onClick={async () => {
                              const r = selectedReserva;

                              await api.post(
                                `/reservas/${r.reserva_id}/pago-presencial`,
                                {},
                                token
                              );

                              setReservas((prev) =>
                                prev.map((x) =>
                                  x.reserva_id === r.reserva_id
                                    ? { ...x, pago: { ...x.pago!, estado: "aprobado" } }
                                    : x
                                )
                              );

                              setSelectedReserva((prev) =>
                                prev
                                  ? { ...prev, pago: { ...prev.pago!, estado: "aprobado" } }
                                  : null
                              );
                            }}
                          >
                            Marcar como pagado
                          </button>
                        )}
                      </div>
                  )}
                </div>
              )}

              {/* Todos los turnos del cliente */}
              <div className="px-5 py-4">
                <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">
                  {selectedReserva ? "Otros turnos" : "Turnos"}
                </p>
                {clientReservas.length === 0 ? (
                  <p className="text-xs text-ink-muted">Sin turnos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {clientReservas
                      .filter((r) => r.reserva_id !== selectedReserva?.reserva_id)
                      .map((r) => (
                        <ReservaCard
                          key={r.reserva_id}
                          reserva={r}
                          updatingId={updatingId}
                          onCambiarEstado={cambiarEstado}
                          onCancelarReserva={cancelarReserva}
                        />
                      ))}
                    {clientReservas.filter((r) => r.reserva_id !== selectedReserva?.reserva_id).length === 0 && (
                      <p className="text-xs text-ink-muted">Sin otros turnos</p>
                    )}
                  </div>
                )}
              </div>

              </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TableSkeleton ────────────────────────────────────────────────────────────

function TableSkeleton({ gridClass, columns }: { gridClass: string; columns: number }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className={`${gridClass} px-5 py-2 border-b border-border`}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={i > 1 ? "hidden md:block" : ""}>
            <div className="h-3.5 w-16 rounded bg-border animate-pulse" />
          </div>
        ))}
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className={`${gridClass} px-5 py-4 items-center ${row > 0 ? "border-t border-border" : ""}`}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className={i > 1 ? "hidden md:block" : ""}>
              <div className="h-3.5 w-24 rounded bg-border animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── ReservaCard ──────────────────────────────────────────────────────────────

function ReservaCard({
  reserva,
  updatingId,
  onCambiarEstado,
  onCancelarReserva,
  highlight = false,
}: {
  reserva: Reserva;
  updatingId: number | null;
  onCambiarEstado: (id: number, estado: "confirmada" | "cancelada") => void;
  onCancelarReserva: (id: number) => void;
  highlight?: boolean;
}) {
  const canConfirm = reserva.estado === "pendiente";
  const canCancel  = ["pendiente", "confirmada", "en_curso"].includes(reserva.estado);
  const isUpdating = updatingId === reserva.reserva_id;

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${highlight ? "border-ink/30 bg-surface" : "border-border bg-surface"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink">
            {reserva.fecha} · {reserva.hora.slice(0, 5)}
          </p>
          <p className="text-xs text-ink-muted truncate">{reserva.servicio?.nombre}</p>
          <p className="text-xs text-ink-muted">{reserva.servicio?.duracion} min · {reserva.servicio?.modalidad}</p>
        </div>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${ESTADO_BADGE[reserva.estado] ?? "bg-gray-100 text-gray-600"}`}>
          {ESTADO_LABEL[reserva.estado] ?? reserva.estado}
        </span>
      </div>

      {puedeEntrarVideollamada(reserva) && (
        <Link
          to={`/videollamada/${reserva.reserva_id}`}
          className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-white rounded py-1.5 text-xs font-semibold transition-colors"
        >
          <VideoIcon />
          Unirse a la videollamada
        </Link>
      )}

      {(canConfirm || canCancel) && (
        <div className="flex gap-1.5 pt-0.5">
          {canConfirm && (
            <button
              disabled={isUpdating}
              onClick={() => onCambiarEstado(reserva.reserva_id, "confirmada")}
              className="flex-1 py-1 text-xs font-semibold bg-ink-fixed text-white rounded hover:bg-primary transition-colors disabled:opacity-50"
            >
              {isUpdating ? "..." : "Confirmar"}
            </button>
          )}
          {canCancel && (
            <button
              disabled={isUpdating}
              onClick={() => {
                if (reserva.estado === "confirmada") {
                  onCancelarReserva(reserva.reserva_id);
                } else {
                  onCambiarEstado(reserva.reserva_id, "cancelada");
                }
              }}
              className={`py-1 text-xs font-semibold border border-border rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-ink-muted transition-colors disabled:opacity-50 ${canConfirm ? "px-2" : "flex-1"}`}
            >
              {isUpdating ? "..." : "Cancelar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
