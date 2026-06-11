import { useEffect, useState, useRef } from "react";
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

const HOURS      = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
const CELL       = 44;
const GRID_START = 8;

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  "bg-amber-100  border-l-4 border-amber-400",
  confirmada: "bg-blue-100   border-l-4 border-blue-400",
  pagada:     "bg-green-100  border-l-4 border-green-500",
  en_curso:   "bg-violet-100 border-l-4 border-violet-500",
  finalizada: "bg-gray-50    border-l-4 border-gray-300",
};

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

const MONTH_NAMES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DOW_LABELS  = ["lun","mar","mié","jue","vie","sáb","dom"];

const CLIENT_COLORS = [
  { avatar: "bg-violet-500", accent: "border-violet-300", block: "bg-violet-100 border-l-4 border-violet-500" },
  { avatar: "bg-orange-500", accent: "border-orange-300", block: "bg-orange-100 border-l-4 border-orange-500" },
  { avatar: "bg-teal-500",   accent: "border-teal-300",   block: "bg-teal-100   border-l-4 border-teal-500"   },
  { avatar: "bg-rose-500",   accent: "border-rose-300",   block: "bg-rose-100   border-l-4 border-rose-500"   },
  { avatar: "bg-amber-500",  accent: "border-amber-300",  block: "bg-amber-100  border-l-4 border-amber-500"  },
];

// Devuelve lun–dom de la semana dada
function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toMonday(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getInitials(nombre: string) {
  return nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientsAndAgenda() {
  const { token } = useAuth();

  const [reservas,       setReservas]       = useState<Reserva[]>([]);
  const [clients,        setClients]        = useState<Client[]>([]);
  const [agendaLoading,  setAgendaLoading]  = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [weekStart,      setWeekStart]      = useState(() => toMonday(new Date()));
  const [search,         setSearch]         = useState("");

  // Selección: cliente y/o turno específico
  const [selectedClient,  setSelectedClient]  = useState<Client | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // Control de acción en curso
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionMode, setActionMode] = useState<"none" | "attendance">("none");
  const [mobileStartDay, setMobileStartDay] = useState(0);
  const touchStartX = useRef(0);
  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAgenda = () => {
    if (!token) return;
    setAgendaLoading(true);
    api
      .get<{ success: boolean; data: Reserva[] }>("/mi-agenda", token)
      .then((res) => { if (res.success) setReservas(res.data); })
      .catch(() => {})
      .finally(() => setAgendaLoading(false));
  };

  useEffect(() => { setMobileStartDay(0); }, [weekStart]);

  useEffect(() => {
    if (!token) return;
    fetchAgenda();
    setClientsLoading(true);
    api
      .get<Client[]>("/clientes", token)
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));
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
    await api.put(`/reservas/${reservaId}/cancelar`, {}, token);
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const weekDates = getWeekDates(weekStart);
  const todayStr  = toDateStr(new Date());

  const reservasByDay: Record<string, Reserva[]> = {};
  for (const r of reservas) {
    if (!reservasByDay[r.fecha]) reservasByDay[r.fecha] = [];
    reservasByDay[r.fecha].push(r);
  }

  const weekLabel = (() => {
    const from = weekDates[0], to = weekDates[6];
    if (from.getMonth() === to.getMonth())
      return `${from.getDate()}–${to.getDate()} ${MONTH_NAMES[from.getMonth()]} ${from.getFullYear()}`;
    return `${from.getDate()} ${MONTH_NAMES[from.getMonth()]} – ${to.getDate()} ${MONTH_NAMES[to.getMonth()]} ${to.getFullYear()}`;
  })();

  const filteredClients = clients.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const clientColorMap: Record<string, typeof CLIENT_COLORS[0]> = {};
  clients.forEach((c, i) => {
    clientColorMap[c.nombre] = CLIENT_COLORS[i % CLIENT_COLORS.length];
  });

  // Reservas del cliente seleccionado
  const clientReservas = selectedClient
    ? reservas.filter((r) => r.cliente_nombre === selectedClient.nombre)
    : [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleReservaClick = (r: Reserva) => {
    const client = clients.find((c) => c.nombre === r.cliente_nombre) ?? null;
    const isAlreadySelected = selectedReserva?.reserva_id === r.reserva_id;
    if (isAlreadySelected) {
      setSelectedReserva(null);
      setSelectedClient(null);
    } else {
      setSelectedReserva(r);
      setSelectedClient(client);
    }
  };

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

  const prevMobileDays = () => setMobileStartDay((d) => Math.max(0, d - 1));
  const nextMobileDays = () => setMobileStartDay((d) => Math.min(4, d + 1));
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 40) nextMobileDays();
    else if (delta < -40) prevMobileDays();
  };
  const mobileDays = weekDates.slice(mobileStartDay, mobileStartDay + 3);

  const panelOpen = !!selectedClient;

  const panelClientColor = selectedClient
    ? CLIENT_COLORS[Math.max(clients.findIndex(c => c.cliente_id === selectedClient.cliente_id), 0) % CLIENT_COLORS.length]
    : CLIENT_COLORS[0];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Clientes</h1>
        <p className="text-ink-muted mt-1">
          Hacé click en un turno o cliente para ver detalles y gestionar reservas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* ── Main content (col-span-3) ─────────────────────────────────── */}
        <div className="lg:col-span-3 min-w-0 space-y-6">

          {/* AGENDA ─────────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-display text-xl text-ink">
                Agenda
                <span className="ml-2 text-sm font-normal text-ink-muted">{weekLabel}</span>
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                  className="w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                  className="w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors cursor-pointer"
                >
                  <ChevronRightIcon />
                </button>
                <button
                  onClick={() => setWeekStart(toMonday(new Date()))}
                  className="px-3 py-1.5 text-xs font-semibold border border-border rounded hover:bg-bg text-ink-muted transition-colors cursor-pointer"
                >
                  Hoy
                </button>
              </div>
            </div>

            {agendaLoading ? (
              <div className="bg-surface border border-border rounded h-64 animate-pulse" />
            ) : (
              <>
                {/* ── Mobile: 3-day view ─────────────────────────────────── */}
                <div className="lg:hidden">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <button
                      onClick={prevMobileDays}
                      disabled={mobileStartDay === 0}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted disabled:opacity-30 hover:bg-bg transition-colors"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <span className="text-sm font-medium text-ink">
                      {DOW_LABELS[mobileDays[0].getDay() === 0 ? 6 : mobileDays[0].getDay() - 1]} {mobileDays[0].getDate()}
                      {" – "}
                      {DOW_LABELS[mobileDays[2].getDay() === 0 ? 6 : mobileDays[2].getDay() - 1]} {mobileDays[2].getDate()}
                    </span>
                    <button
                      onClick={nextMobileDays}
                      disabled={mobileStartDay >= 4}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted disabled:opacity-30 hover:bg-bg transition-colors"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>

                  <div
                    className="bg-surface border border-border rounded overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="grid border-b border-border" style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}>
                      <div className="border-r border-border" />
                      {mobileDays.map((d, i) => {
                        const str = toDateStr(d);
                        const isToday = str === todayStr;
                        const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
                        return (
                          <div key={str} className={`border-r border-border last:border-r-0 flex flex-col items-center justify-center py-2 min-h-[52px] ${isToday ? "bg-accent/10" : ""}`}>
                            <p className="text-xs text-ink-muted uppercase tracking-wide font-semibold">{DOW_LABELS[dow]}</p>
                            {isToday ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full bg-ink text-white text-xs font-bold">{d.getDate()}</span>
                            ) : (
                              <p className="text-sm font-bold text-ink mt-0.5">{d.getDate()}</p>
                            )}
                            {reservasByDay[str]?.length > 0 && (
                              <p className="text-xs text-ink-muted mt-0.5">{reservasByDay[str].length}t</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="relative grid" style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}>
                      <div className="border-r border-border">
                        {HOURS.map((h) => (
                          <div key={h} className="border-b border-border/30 flex items-center justify-center px-1" style={{ height: CELL }}>
                            <span className="text-xs text-ink-muted">{h}</span>
                          </div>
                        ))}
                      </div>
                      {mobileDays.map((d) => {
                        const str = toDateStr(d);
                        const isToday = str === todayStr;
                        const dayRes = reservasByDay[str] ?? [];
                        return (
                          <div key={str} className={`relative border-r border-border last:border-r-0 ${isToday ? "bg-accent/5" : ""}`}>
                            {HOURS.map((_, hi) => <div key={hi} className="border-b border-border/20" style={{ height: CELL }} />)}
                            {dayRes.map((r) => {
                              const [hh, mm] = r.hora.split(":").map(Number);
                              const topH = hh + mm / 60 - GRID_START;
                              const durH = (r.servicio?.duracion ?? 60) / 60;
                              const color = clientColorMap[r.cliente_nombre]?.block ?? ESTADO_COLOR[r.estado] ?? "bg-surface border-l-4 border-border";
                              const isSelected = selectedReserva?.reserva_id === r.reserva_id;
                              return (
                                <div
                                  key={r.reserva_id}
                                  onClick={() => handleReservaClick(r)}
                                  className={`absolute left-0.5 right-0.5 ${color} rounded-r px-1 py-1 overflow-hidden cursor-pointer transition-all ${isSelected ? "ring-2 ring-ink ring-offset-1 brightness-95" : "hover:brightness-95"}`}
                                  style={{ top: topH * CELL, height: Math.max(durH * CELL - 2, 22) }}
                                >
                                  <p className="text-xs font-bold text-ink truncate leading-tight">{r.cliente_nombre}</p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-center gap-1.5 mt-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <button key={i} onClick={() => setMobileStartDay(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === mobileStartDay ? "bg-ink" : "bg-border"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Desktop: 7-day view ────────────────────────────────── */}
                <div className="hidden lg:block">
                  <div className="bg-surface border border-border rounded overflow-x-auto">
                    <div style={{ minWidth: "520px" }}>
                      <div className="grid border-b border-border" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
                        <div className="border-r border-border" />
                        {weekDates.map((d, i) => {
                          const str = toDateStr(d);
                          const isToday = str === todayStr;
                          const isWeekend = i >= 5;
                          return (
                            <div key={str} className={`border-r border-border last:border-r-0 flex flex-col items-center justify-center py-2 min-h-[56px] ${isToday ? "bg-accent/10" : isWeekend ? "bg-border/10" : ""}`}>
                              <p className="text-xs text-ink-muted uppercase tracking-wide font-semibold">{DOW_LABELS[i]}</p>
                              {isToday ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full bg-ink text-white text-xs font-bold">{d.getDate()}</span>
                              ) : (
                                <p className="text-sm font-bold text-ink mt-0.5">{d.getDate()}</p>
                              )}
                              {reservasByDay[str]?.length > 0 && (
                                <p className="text-xs text-ink-muted mt-0.5">{reservasByDay[str].length}t</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
                        <div className="border-r border-border">
                          {HOURS.map((h) => (
                            <div key={h} className="border-b border-border/30 flex items-center justify-center px-1" style={{ height: CELL }}>
                              <span className="text-xs text-ink-muted">{h}</span>
                            </div>
                          ))}
                        </div>
                        {weekDates.map((d, i) => {
                          const str = toDateStr(d);
                          const isToday = str === todayStr;
                          const isWeekend = i >= 5;
                          const dayRes = reservasByDay[str] ?? [];
                          return (
                            <div key={str} className={`relative border-r border-border last:border-r-0 ${isToday ? "bg-accent/5" : isWeekend ? "bg-border/10" : ""}`}>
                              {HOURS.map((_, hi) => <div key={hi} className="border-b border-border/20" style={{ height: CELL }} />)}
                              {dayRes.map((r) => {
                                const [hh, mm] = r.hora.split(":").map(Number);
                                const topH = hh + mm / 60 - GRID_START;
                                const durH = (r.servicio?.duracion ?? 60) / 60;
                                const color = clientColorMap[r.cliente_nombre]?.block ?? ESTADO_COLOR[r.estado] ?? "bg-surface border-l-4 border-border";
                                const isSelected = selectedReserva?.reserva_id === r.reserva_id;
                                return (
                                  <div
                                    key={r.reserva_id}
                                    onClick={() => handleReservaClick(r)}
                                    title={`${r.cliente_nombre} · ${r.servicio?.nombre}`}
                                    className={`absolute left-0.5 right-0.5 ${color} rounded-r px-2 py-1 overflow-hidden cursor-pointer transition-all ${isSelected ? "ring-2 ring-ink ring-offset-1 brightness-95" : "hover:brightness-95"}`}
                                    style={{ top: topH * CELL, height: Math.max(durH * CELL - 2, 22) }}
                                  >
                                    <p className="text-xs font-bold text-ink truncate leading-tight">{r.cliente_nombre}</p>
                                    {durH * CELL > 36 && <p className="text-xs text-ink-muted truncate">{r.servicio?.nombre}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* CLIENTES ────────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-display text-xl text-ink shrink-0">
                Clientes
                <span className="ml-2 text-sm font-normal text-ink-muted">
                  {!clientsLoading && `${clients.length} activos`}
                </span>
              </h2>
              <input
                className="flex-1 border border-border rounded px-3 py-1.5 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {clientsLoading ? (
              <div className="bg-surface border border-border rounded p-8 text-center text-ink-muted text-sm">
                Cargando clientes...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="bg-surface border border-border rounded p-8 text-center">
                <p className="text-sm text-ink-muted">
                  {search ? `Sin resultados para "${search}"` : "Tus clientes aparecerán aquí"}
                </p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[580px]">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
                      {[
                        { label: "CLIENTE",        span: "col-span-3" },
                        { label: "EMAIL",          span: "col-span-3" },
                        { label: "PRÓXIMA SESIÓN", span: "col-span-3" },
                        { label: "ESTADO",         span: "col-span-1 flex items-center justify-center" },
                      ].map((h) => (
                        <div key={h.label} className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${h.span}`}>
                          {h.label}
                        </div>
                      ))}
                    </div>

                    {filteredClients.map((c, index) => {
                      const isSelected = selectedClient?.cliente_id === c.cliente_id;
                      const cc = CLIENT_COLORS[index % CLIENT_COLORS.length];
                      return (
                        <div
                          key={c.cliente_id}
                          onClick={() => handleClientClick(c)}
                          className={`grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center cursor-pointer transition-colors border-l-[3px] ${cc.accent} ${
                            isSelected ? "bg-accent/10" : "hover:bg-bg"
                          }`}
                        >
                          <div className="col-span-3 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${cc.avatar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {getInitials(c.nombre)}
                            </div>
                            <span className="text-sm font-semibold text-ink truncate">{c.nombre}</span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-sm text-ink-muted truncate block">{c.email}</span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-sm text-ink">
                              {c.proxima_sesion} {c.hora_proxima_sesion?.slice(0, 5) ?? ""}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <span className={`badge ${c.estado === "EN SESION" ? "badge-en-vivo" : "badge-confirmada"}`}>
                              {c.estado}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Right panel — siempre presente como en disponibilidad ─────── */}
        <div className="lg:sticky lg:top-8 space-y-3">
          {panelOpen && selectedClient ? (
            <div className="bg-surface border border-border rounded overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg">
                <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
                  {selectedReserva ? "Turno" : "Cliente"}
                </p>
                <button onClick={closePanel} className="text-ink-muted hover:text-ink transition-colors cursor-pointer">
                  <CloseIcon />
                </button>
              </div>

              {/* Avatar + datos */}
              <div className="px-4 py-4 border-b border-border flex items-center gap-3">
                <div className={`w-11 h-11 rounded-lg ${panelClientColor.avatar} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {getInitials(selectedClient.nombre)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{selectedClient.nombre}</p>
                  <p className="text-xs text-ink-muted truncate">{selectedClient.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                <div className="px-4 py-3">
                  <p className="text-xs text-ink-muted uppercase tracking-widest font-bold mb-1">Sesiones</p>
                  <p className="font-display text-2xl text-ink font-bold">{selectedClient.sesiones_restantes}</p>
                  <p className="text-xs text-ink-muted">restantes</p>
                </div>
                <div className="px-4 py-3">
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
                <div className="px-4 py-4 border-b border-border">
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
                  {(selectedReserva.estado === "en_curso" ||
                    selectedReserva.estado === "finalizada") && (
                    <>
                      {/* ───── ASISTENCIA ───── */}
                      <div className="flex gap-2 mt-3">
                        <button
                          className="flex-1 bg-green-600 text-white rounded py-1.5 text-xs font-semibold"
                          onClick={() => setSelectedReserva(null)}
                        >
                          Asistió
                        </button>

                        <button
                          className="flex-1 bg-red-600 text-white rounded py-1.5 text-xs font-semibold"
                          onClick={async () => {
                            const r = selectedReserva;

                            await api.put(
                              `/reservas/${r.reserva_id}/estado`,
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

                      {/* ───── PAGO ───── */}
                      {selectedReserva.pago && (
                        <div className="flex gap-2 mt-3">
                          <button
                          className={`flex-1 rounded py-1.5 text-xs font-semibold transition-colors ${
                            selectedReserva.pago?.estado === "aprobado"
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
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
                          {selectedReserva.pago?.estado === "aprobado"
                            ? "Pagado"
                            : "Pago"}
                        </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Todos los turnos del cliente */}
              <div className="px-4 py-4">
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
          ) : (
            <div className="bg-surface border border-border rounded p-5 text-center">
              <p className="text-xs text-ink-muted">
                Seleccioná un turno o cliente para ver los detalles
              </p>
            </div>
          )}
        </div>

      </div>
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
    <div className={`rounded border p-3 space-y-2 ${highlight ? "border-ink/30 bg-white" : "border-border bg-white"}`}>
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

      {(canConfirm || canCancel) && (
        <div className="flex gap-1.5 pt-0.5">
          {canConfirm && (
            <button
              disabled={isUpdating}
              onClick={() => onCambiarEstado(reserva.reserva_id, "confirmada")}
              className="flex-1 py-1 text-xs font-semibold bg-ink text-white rounded hover:bg-primary transition-colors disabled:opacity-50"
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

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
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
