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

interface Resumen {
  total_mes: number;
  pagado: number;
  pendiente: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getSaludo() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}

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
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

const HOURS      = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
const CELL       = 44;
const GRID_START = 8;
const DOW_LABELS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  "bg-amber-100  border-l-4 border-amber-400",
  confirmada: "bg-blue-100   border-l-4 border-blue-400",
  pagada:     "bg-green-100  border-l-4 border-green-500",
  en_curso:   "bg-violet-100 border-l-4 border-violet-500",
  finalizada: "bg-gray-50    border-l-4 border-gray-300",
};

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border/60 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Ganancias skeleton */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda skeleton */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="grid border-b border-border grid-cols-[48px_1fr] sm:grid-cols-[48px_1fr_1fr_1fr]">
              <div className="border-r border-border" />
              {[0, 1, 2].map((i) => (
                <div key={i} className={`border-r border-border last:border-r-0 flex flex-col items-center justify-center gap-1 py-2 min-h-[52px] ${i > 0 ? "hidden sm:flex" : ""}`}>
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[48px_1fr_1fr_1fr]">
              <div className="border-r border-border">
                {Array.from({ length: 6 }).map((_, h) => (
                  <div key={h} className="border-b border-border/30 flex items-center justify-center" style={{ height: 44 }}>
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className={`border-r border-border last:border-r-0 ${i > 0 ? "hidden sm:block" : ""}`}>
                  {Array.from({ length: 6 }).map((_, h) => (
                    <div key={h} className="border-b border-border/20" style={{ height: 44 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="space-y-5">
          {/* Por revisar */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
              <Skeleton className="h-5 w-5 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>

          {/* Reseñas */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-3 px-4 pb-4 border-b border-border">
              <Skeleton className="h-9 w-6" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className={`px-4 py-3 space-y-1.5 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
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
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [promedio, setPromedio] = useState(0);
  const [openCalificaciones, setOpenCalificaciones] = useState(false);
  const [cantidadCalificaciones, setCantidadCalificaciones] = useState(0);
  const [resumen, setResumen] = useState<Resumen>({ total_mes: 0, pagado: 0, pendiente: 0 });
  const [agendaStart, setAgendaStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  const loadDashboard = async () => {
    if (!token || !user?.id) return;

    try {
      const [agendaRes, pendientesRes, calificacionesRes, resumenRes] =
        await Promise.all([
          api.get("/mi-agenda", token),
          api.get("/reservas/pendientes", token),
          api.get(`/profesionales/${user.id}/calificaciones`, token),
          api.get("/profesional/pagos/resumen", token),
        ]);

      const agenda: any = agendaRes;
      const pendientesData: any = pendientesRes;
      const calificacionesData: any = calificacionesRes;
      const resumenData: any = resumenRes;

      setAllReservas(agenda.data ?? []);
      setPendientes(pendientesData.data ?? []);

      setCalificaciones(calificacionesData.data ?? []);
      setPromedio(calificacionesData.promedio ?? 0);
      setCantidadCalificaciones(calificacionesData.cantidad ?? 0);

      setResumen(resumenData.data ?? {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
   /* if (!token || !user?.id) return;
    Promise.all([
      api.get("/mi-agenda", token).then((res: any) => setAllReservas(res.data ?? [])).catch(() => {}),
      api.get("/reservas/pendientes", token).then((res: any) => setPendientes(res.data ?? [])).catch(() => {}),
      api.get(`/profesionales/${user.id}/calificaciones`, token).then((res: any) => {
        const payload = res; 
        setCalificaciones(payload.data ?? []);
        setPromedio(payload.promedio ?? 0);
        setCantidadCalificaciones(payload.cantidad ?? 0);
      }).catch(() => {}),
    ]).finally(() => setLoading(false)); */
    loadDashboard();
  }, [token, user?.id]);

  useEffect(() => {
    const handler = () => {
      console.log("PRO DASHBOARD REFRESH");
      loadDashboard();
    };

    window.addEventListener(
      "reserva-updated",
      handler
    );

    return () =>
      window.removeEventListener(
        "reserva-updated",
        handler
      );
  }, [token, user?.id]);

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

  const agendaDays = [0, 1, 2].map((i) => addDays(agendaStart, i));
  const reservasByDay = useMemo(() => {
    const map: Record<string, Reserva[]> = {};
    for (const r of allReservas) {
      if (!map[r.fecha]) map[r.fecha] = [];
      map[r.fecha].push(r);
    }
    return map;
  }, [allReservas]);
  const prevAgendaDays = () => setAgendaStart((d) => addDays(d, -1));
  const nextAgendaDays = () => setAgendaStart((d) => addDays(d, 1));

  const kpis = [
    { label: "SESIONES HOY",         value: String(sesionesHoy),        sub: "reservas para hoy" },
    { label: "SESIONES ESTA SEMANA", value: String(sesionesEstaSemana), sub: "semana en curso" },
    { label: "PENDIENTES",           value: String(pendientes.length),  sub: "esperan confirmación" },
    { label: "CALIFICACIÓN",         value: promedio > 0 ? promedio.toString() : "—", sub: `${cantidadCalificaciones} reseñas`,},
  ];

  const cambiarEstado = async (id: number, estado: "confirmada" | "cancelada") => {
    try {
      setLoadingId(id);
      await api.put(`/reservas/${id}/estado`, { estado }, token);
      setPendientes((prev) => prev.filter((r) => r.reserva_id !== id));
      setAllReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === id
            ? { ...r, estado }
            : r
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) return <DashboardSkeleton />;
  return (
    <div className="p-4 md:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">{getSaludo()}, {firstName}</h1>
          <p className="text-ink-muted mt-1">
            {sesionesHoy > 0
              ? `Tenés ${sesionesHoy} sesión${sesionesHoy !== 1 ? "es" : ""} hoy`
              : "Sin sesiones hoy"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to="/professional/services"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
          >
            <PlusIcon />
            Nuevo servicio
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-sm text-ink-muted mb-2">{k.label}</p>
            <span className="font-display text-3xl text-ink">{k.value}</span>
            <p className="text-xs text-ink-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Ganancias */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { label: "Ingresos del mes", value: `$${resumen.total_mes}`, sub: "Total generado" },
            { label: "Pagado",           value: `$${resumen.pagado}`,    sub: "Ya acreditado" },
            { label: "Pendiente",        value: `$${resumen.pendiente}`, sub: "Por liquidar" },
          ].map((c) => (
            <div key={c.label} className="p-5">
              <p className="text-sm text-ink-muted mb-2">{c.label}</p>
              <p className="font-display text-3xl text-ink font-bold">{c.value}</p>
              <p className="text-xs text-ink-muted mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Agenda</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevAgendaDays}
                className="w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors cursor-pointer"
              >
                <ChevronLeftIcon />
              </button>
              <span className="text-sm font-medium text-ink px-1 whitespace-nowrap sm:hidden">
                {DOW_LABELS[agendaDays[0].getDay() === 0 ? 6 : agendaDays[0].getDay() - 1]} {agendaDays[0].getDate()}
              </span>
              <span className="text-sm font-medium text-ink px-1 whitespace-nowrap hidden sm:inline">
                {DOW_LABELS[agendaDays[0].getDay() === 0 ? 6 : agendaDays[0].getDay() - 1]} {agendaDays[0].getDate()}
                {" – "}
                {DOW_LABELS[agendaDays[2].getDay() === 0 ? 6 : agendaDays[2].getDay() - 1]} {agendaDays[2].getDate()}
              </span>
              <button
                onClick={nextAgendaDays}
                className="w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors cursor-pointer"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="grid border-b border-border grid-cols-[48px_1fr] sm:grid-cols-[48px_1fr_1fr_1fr]">
              <div className="border-r border-border" />
              {agendaDays.map((d, i) => {
                const str = toDateStr(d);
                const isToday = str === hoy;
                const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
                return (
                  <div key={str} className={`border-r border-border last:border-r-0 flex flex-col items-center justify-center py-2 min-h-[52px] ${isToday ? "bg-accent/10" : ""} ${i > 0 ? "hidden sm:flex" : ""}`}>
                    <p className="text-xs text-ink-muted uppercase tracking-wide font-semibold">{DOW_LABELS[dow]}</p>
                    {isToday ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full bg-ink-fixed text-white text-xs font-bold">{d.getDate()}</span>
                    ) : (
                      <p className="text-sm font-bold text-ink mt-0.5">{d.getDate()}</p>
                    )}
                    {reservasByDay[str]?.length > 0 && (
                      <p className="text-xs text-ink-muted mt-0.5">{reservasByDay[str].length} turno{reservasByDay[str].length !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative grid grid-cols-[48px_1fr] sm:grid-cols-[48px_1fr_1fr_1fr]">
              <div className="border-r border-border">
                {HOURS.map((h) => (
                  <div key={h} className="border-b border-border/30 flex items-center justify-center px-1" style={{ height: CELL }}>
                    <span className="text-xs text-ink-muted">{h}</span>
                  </div>
                ))}
              </div>
              {agendaDays.map((d, i) => {
                const str = toDateStr(d);
                const isToday = str === hoy;
                const dayRes = reservasByDay[str] ?? [];
                return (
                  <div key={str} className={`relative border-r border-border last:border-r-0 ${isToday ? "bg-accent/5" : ""} ${i > 0 ? "hidden sm:block" : ""}`}>
                    {HOURS.map((_, hi) => <div key={hi} className="border-b border-border/20" style={{ height: CELL }} />)}
                    {dayRes.map((r) => {
                      const [hh, mm] = r.hora.split(":").map(Number);
                      const topH = hh + mm / 60 - GRID_START;
                      const durH = (r.servicio?.duracion ?? 60) / 60;
                      const color = ESTADO_COLOR[r.estado] ?? "bg-surface border-l-4 border-border";
                      return (
                        <div
                          key={r.reserva_id}
                          title={`${r.cliente_nombre} · ${r.servicio?.nombre ?? ""}`}
                          className={`absolute left-0.5 right-0.5 ${color} rounded-r px-1.5 py-1 overflow-hidden transition-all hover:brightness-95`}
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

        {/* Columna derecha */}
        <div className="space-y-5">
          {/* Por revisar */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <h3 className="text-sm font-semibold text-ink px-4 pt-4 pb-3">Por revisar</h3>
            <div
              className="flex items-center gap-3 px-4 py-3 border-t border-border hover:bg-bg cursor-pointer transition-colors"
              onClick={() => setOpenSolicitudes((v) => !v)}
            >
              <span className="shrink-0 text-ink-muted"><ClipboardIcon /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">
                  {pendientes.length} solicitudes de reserva
                </p>
                <p className="text-xs text-ink-muted">Esperan tu confirmación</p>
              </div>
              <span className="text-ink-muted"><ChevronIcon open={openSolicitudes} /></span>
            </div>
          </div>

          {/* Reseñas */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h3 className="text-sm font-semibold text-ink">Reseñas</h3>
              {calificaciones.length > 0 && (
                <button
                  onClick={() => setOpenCalificaciones(true)}
                  className="text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 px-4 pb-4 border-b border-border">
              <span className="font-display text-3xl text-ink font-bold">
                {promedio > 0 ? promedio : "—"}
              </span>
              <div>
                <div className="flex items-center gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} filled={i < Math.round(promedio)} />
                  ))}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  {cantidadCalificaciones} reseña{cantidadCalificaciones !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {calificaciones.length === 0 ? (
              <p className="text-xs text-ink-muted px-4 py-4">Aún no tenés reseñas.</p>
            ) : (
              calificaciones.slice(0, 3).map((c, idx) => (
                <div key={c.calificacion_id} className={`px-4 py-3 ${idx > 0 ? "border-t border-border" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-0.5 text-accent shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} filled={i < c.puntuacion} size={12} />
                      ))}
                    </span>
                    <span className="text-xs text-ink-muted truncate">{c.reserva?.servicio?.nombre}</span>
                  </div>
                  {c.comentario && (
                    <p className="text-xs text-ink-muted mt-1.5 line-clamp-2">{c.comentario}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal solicitudes */}
      {openSolicitudes && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface w-full max-w-lg rounded-2xl border border-border p-4">
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
                        className="px-3 py-1 text-xs bg-ink-fixed text-white rounded hover:bg-primary disabled:opacity-50 cursor-pointer"
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
      {openCalificaciones && (
        <div className="fixed inset-0 z-50 flex justify-end p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenCalificaciones(false)} />

          <div className="relative w-full max-w-md bg-surface shadow-xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="font-display text-2xl text-ink">
                Reseñas recibidas
              </h2>

              <button
                onClick={() => setOpenCalificaciones(false)}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {calificaciones.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Aún no tenés reseñas.
                </p>
              ) : (
                calificaciones.map((c) => (
                  <div
                    key={c.calificacion_id}
                    className="p-3 border border-border rounded-lg"
                  >
                    <span className="flex items-center gap-0.5 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} filled={i < c.puntuacion} size={14} />
                      ))}
                    </span>

                    {c.comentario && (
                      <p className="text-sm text-ink-muted mt-2">
                        {c.comentario}
                      </p>
                    )}

                    <p className="text-xs text-ink-muted mt-2">
                      {c.reserva?.servicio?.nombre}
                    </p>
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
function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}
function StarIcon({ filled = true, size = 16 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
