import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { api } from "~/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────
interface Reserva {
  reserva_id: number;
  cliente_id: number;
  fecha: string;
  hora: string;
  estado: string;
  servicio?: { nombre: string; modalidad?: string; duracion?: number };
  cliente_nombre?: string;
  modalidad?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const COLORS = [
  "bg-violet-500", "bg-purple-400", "bg-teal-500",
  "bg-amber-500", "bg-orange-400", "bg-blue-500", "bg-rose-500",
];
const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const getColor = (id: number) => COLORS[id % COLORS.length];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfWeekStr() {
  const now = new Date();
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}

function puedeEntrar(reserva: Reserva) {
  if (!reserva.servicio?.duracion) return false;

  const ahora = new Date();

  const inicio = new Date(`${reserva.fecha}T${reserva.hora}`);
  const fin = new Date(inicio);
  fin.setMinutes(fin.getMinutes() + reserva.servicio.duracion);

  const desde = new Date(inicio);
  desde.setMinutes(desde.getMinutes() - 10);

  return ahora >= desde && ahora <= fin;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  finalizada: { label: "FINALIZADA", cls: "text-xs text-ink-muted font-bold uppercase" },
  en_curso:   { label: "EN VIVO",    cls: "badge badge-en-vivo" },
  confirmada: { label: "CONFIRMADA", cls: "badge badge-confirmada" },
  pagada:     { label: "PAGADA",     cls: "badge badge-pagada" },
  pendiente:  { label: "PENDIENTE",  cls: "badge badge-pendiente" },
};

const calendar = [
  [24, 25, 26, 27, 1, 2, 3],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, 31],
];

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border/60 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-9 w-36 rounded" />
          <Skeleton className="h-9 w-36 rounded" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded p-5 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Agenda skeleton */}
        <div className="col-span-2">
          <Skeleton className="h-6 w-64 mb-4" />
          <div className="bg-surface border border-border rounded overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0">
                <div className="w-16 space-y-1">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="w-8 h-8 rounded shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="space-y-5">
          <div className="bg-surface border border-border rounded p-4">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-6" />)}
              {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-7" />)}
            </div>
          </div>
          <div className="bg-surface border border-border rounded p-4 space-y-2">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-14 rounded" />
            <Skeleton className="h-14 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ProfessionalDashboard() {
  const { user, token } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "Profesional";

  const [allReservas, setAllReservas] = useState<Reserva[]>([]);
  const [pendientes, setPendientes]   = useState<Reserva[]>([]);
  const [loading, setLoading]         = useState(true);
  const [openSolicitudes, setOpenSolicitudes] = useState(false);
  const [loadingId, setLoadingId]     = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get("/mi-agenda", token).then((res: any) => setAllReservas(res.data ?? [])).catch(() => {}),
      api.get("/reservas/pendientes", token).then((res: any) => setPendientes(res.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [token]);

  const hoy        = todayStr();
  const semanaDesde = startOfWeekStr();

  const agendaHoy = useMemo(
    () => allReservas.filter((r) => r.fecha === hoy).sort((a, b) => a.hora.localeCompare(b.hora)),
    [allReservas, hoy]
  );
  const sesionesHoy       = agendaHoy.length;
  const sesionesEstaSemana = useMemo(
    () => allReservas.filter((r) => r.fecha >= semanaDesde).length,
    [allReservas, semanaDesde]
  );

  const kpis = [
    { label: "SESIONES HOY",         value: String(sesionesHoy),        sub: "reservas para hoy" },
    { label: "SESIONES ESTA SEMANA", value: String(sesionesEstaSemana), sub: "semana en curso" },
    { label: "PENDIENTES",           value: String(pendientes.length),  sub: "esperan confirmación" },
    { label: "CALIFICACIÓN",         value: "—",                        sub: "Próximamente" },
  ];

  const cambiarEstado = async (id: number, estado: "confirmada" | "cancelada") => {
    try {
      setLoadingId(id);
      await api.put(`/reservas/${id}/estado`, { estado }, token);
      setPendientes((prev) => prev.filter((r) => r.reserva_id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Buenos días, {firstName}</h1>
          <p className="text-ink-muted mt-1">
            {sesionesHoy > 0
              ? `Tenés ${sesionesHoy} sesión${sesionesHoy !== 1 ? "es" : ""} hoy`
              : "Sin sesiones hoy"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 border border-border rounded bg-surface hover:bg-bg">
            <BellIcon />
            {pendientes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold">
                {pendientes.length}
              </span>
            )}
          </button>
          <Link
            to="/professional/services"
            className="flex items-center gap-2 border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink"
          >
            <PlusIcon />
            Nuevo servicio
          </Link>
          <button
            disabled
            title="Próximamente"
            className="flex items-center gap-2 bg-ink/40 text-white/60 px-4 py-2 rounded text-sm font-semibold cursor-not-allowed select-none"
          >
            <LockIcon />
            Bloquear agenda
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border border-border rounded p-5">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">{k.label}</p>
            <span className="font-display text-3xl text-ink">{k.value}</span>
            <p className="text-xs text-ink-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Agenda de hoy */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">
              Agenda de hoy ·{" "}
              {new Date().toLocaleDateString("es-UY", {
                weekday: "long", day: "numeric", month: "short",
              })}
            </h2>
          </div>

          <div className="bg-surface border border-border rounded overflow-hidden">
            {agendaHoy.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">No hay sesiones registradas para hoy.</p>
            ) : (
              agendaHoy.map((item) => {
                const hora     = item.hora.slice(0, 5);
                const initials = getInitials(item.cliente_nombre ?? "?");
                const color    = getColor(item.cliente_id);
                const estado   = item.estado;
                const duracion = item.servicio?.duracion ? `${item.servicio.duracion}min` : "";

                return (
                  <div
                    key={item.reserva_id}
                    className={`flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 ${
                      estado === "en_curso" ? "bg-accent/10" : ""
                    }`}
                  >
                    <div className="w-16 shrink-0">
                      <p className="text-sm font-semibold text-ink">{hora}</p>
                      <p className="text-xs text-ink-muted">{duracion}</p>
                    </div>

                    <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-white text-xs font-bold ${color}`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{item.cliente_nombre}</p>
                      {item.servicio?.nombre && (
                        <p className="text-xs text-ink-muted">
                          {item.servicio.nombre}
                          {item.servicio.modalidad ? ` · ${item.servicio.modalidad}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {statusMap[estado] && (
                        <span className={statusMap[estado].cls}>{statusMap[estado].label}</span>
                      )}
                      {item.modalidad === "virtual" && puedeEntrar(item) && (
                        <Link to={`/videollamada/${item.reserva_id}`}>
                          <button className="flex items-center gap-2 bg-ink text-white text-sm font-semibold px-4 py-2 rounded hover:bg-primary transition-colors">
                            <VideoIcon />
                            Iniciar videollamada
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-5">
          {/* Mini calendario */}
          <div className="bg-surface border border-border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-ink">
                {new Date().toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
              </span>
              <div className="flex gap-1">
                <button className="w-6 h-6 border border-border rounded text-ink-muted hover:bg-bg text-xs">‹</button>
                <button className="w-6 h-6 border border-border rounded text-ink-muted hover:bg-bg text-xs">›</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="text-center text-xs text-ink-muted py-1 font-semibold">{d}</div>
              ))}
              {calendar.flat().map((day, i) => {
                const isToday = day === new Date().getDate();
                return (
                  <button
                    key={i}
                    className={`text-xs py-1.5 rounded transition-colors ${
                      isToday ? "bg-ink text-white font-bold" : "text-ink-muted"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Por revisar */}
          <div className="bg-surface border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Por revisar</h3>
            <div className="space-y-2">
              {/* Solicitudes — datos reales */}
              <div
                className="flex items-center gap-3 p-3 bg-bg rounded border border-border hover:bg-border/50 cursor-pointer transition-colors"
                onClick={() => setOpenSolicitudes((v) => !v)}
              >
                <span className="shrink-0 text-ink-muted"><ClipboardIcon /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {pendientes.length} solicitudes de reserva
                  </p>
                  <p className="text-xs text-ink-muted">Esperan tu confirmación</p>
                </div>
                <ChevronIcon open={openSolicitudes} />
              </div>

              {/* Reseñas — próximamente */}
              <div className="flex items-center gap-3 p-3 bg-bg rounded border border-border opacity-50 cursor-not-allowed select-none">
                <span className="shrink-0 text-ink-muted"><StarIcon /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Reseñas</p>
                  <p className="text-xs text-ink-muted">Próximamente</p>
                </div>
                <span className="text-ink-muted/40"><ChevronIcon open={false} /></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal solicitudes */}
      {openSolicitudes && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface w-full max-w-lg rounded border border-border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-ink">Solicitudes de reserva</h3>
              <button onClick={() => setOpenSolicitudes(false)} className="text-ink-muted hover:text-ink">
                <XIcon />
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {pendientes.length === 0 ? (
                <p className="text-sm text-ink-muted">No hay solicitudes pendientes.</p>
              ) : (
                pendientes.map((r) => (
                  <div key={r.reserva_id} className="p-3 border rounded bg-bg">
                    <p className="text-sm font-semibold text-ink">{r.cliente_nombre}</p>
                    <p className="text-xs text-ink-muted">{r.servicio?.nombre}</p>
                    <p className="text-xs text-ink-muted">{r.fecha} · {r.hora?.slice(0, 5)}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        disabled={loadingId === r.reserva_id}
                        onClick={() => cambiarEstado(r.reserva_id, "confirmada")}
                        className="px-3 py-1 text-xs bg-ink text-white rounded hover:bg-primary disabled:opacity-50 cursor-pointer"
                      >
                        {loadingId === r.reserva_id ? "..." : "Confirmar"}
                      </button>
                      <button
                        disabled={loadingId === r.reserva_id}
                        onClick={() => cambiarEstado(r.reserva_id, "cancelada")}
                        className="px-3 py-1 text-xs border border-border rounded hover:bg-bg disabled:opacity-50 cursor-pointer"
                      >
                        {loadingId === r.reserva_id ? "..." : "Cancelar"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
