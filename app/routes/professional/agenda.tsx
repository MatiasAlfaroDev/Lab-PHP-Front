import { useState, useEffect, useRef } from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

interface Reserva {
  reserva_id: number;
  fecha: string;
  hora: string;
  estado: string;
  cliente_nombre: string;
  servicio: { nombre: string; duracion: number; modalidad: string };
}

const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
const CELL  = 48;
const GRID_START = 8;

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  "bg-amber-100 border-l-4 border-amber-400",
  confirmada: "bg-blue-100 border-l-4 border-blue-400",
  pagada:     "bg-green-100 border-l-4 border-green-500",
  en_curso:   "bg-violet-100 border-l-4 border-violet-500",
  finalizada: "bg-surface border-l-4 border-border",
};

function getWeekDates(referenceMonday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(referenceMonday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toMonday(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_NAMES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DOW_SHORT   = ["dom","lun","mar","mié","jue","vie","sáb"];

export default function Agenda() {
  const { token } = useAuth();
  const [reservas,  setReservas]  = useState<Reserva[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [weekStart, setWeekStart] = useState(() => toMonday(new Date()));
  const [mobileStartDay, setMobileStartDay] = useState(0);
  const touchStartX = useRef(0);

  const fetchAgenda = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const res = await api.get<{
        success: boolean;
        data: Reserva[];
      }>("/mi-agenda", token);

      if (res.success) {
        setReservas(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [token]);

  useEffect(() => {
    const handler = () => {
      console.log("AGENDA REFRESH");
      fetchAgenda();
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
  }, [token]);

  useEffect(() => { setMobileStartDay(0); }, [weekStart]);

  const weekDates = getWeekDates(weekStart);
  const todayStr  = toDateStr(new Date());

  const prevWeek = () => {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  };
  const nextWeek = () => {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  };
  const goToday = () => setWeekStart(toMonday(new Date()));

  const prevMobileDays = () => setMobileStartDay((d) => Math.max(0, d - 1));
  const nextMobileDays = () => setMobileStartDay((d) => Math.min(4, d + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 40) nextMobileDays();
    else if (delta < -40) prevMobileDays();
  };

  const mobileDays = weekDates.slice(mobileStartDay, mobileStartDay + 3);

  const reservasByDay: Record<string, Reserva[]> = {};
  for (const r of reservas) {
    if (!reservasByDay[r.fecha]) reservasByDay[r.fecha] = [];
    reservasByDay[r.fecha].push(r);
  }

  const weekLabel = (() => {
    const from = weekDates[0];
    const to   = weekDates[6];
    if (from.getMonth() === to.getMonth())
      return `${from.getDate()}–${to.getDate()} ${MONTH_NAMES[from.getMonth()]} ${from.getFullYear()}`;
    return `${from.getDate()} ${MONTH_NAMES[from.getMonth()]} – ${to.getDate()} ${MONTH_NAMES[to.getMonth()]} ${to.getFullYear()}`;
  })();

  const renderDayColumn = (d: Date, timeCols: string) => {
    const str     = toDateStr(d);
    const isToday = str === todayStr;
    const dayRes  = reservasByDay[str] ?? [];
    return (
      <div key={str} className={`relative border-r border-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
        {HOURS.map((_, hi) => (
          <div key={hi} className="border-b border-border/20" style={{ height: CELL }} />
        ))}
        {dayRes.map((r) => {
          const [hh, mm] = r.hora.split(":").map(Number);
          const topH  = hh + mm / 60 - GRID_START;
          const durH  = (r.servicio?.duracion ?? 60) / 60;
          const color = ESTADO_COLOR[r.estado] ?? "bg-surface border-l-4 border-border";
          return (
            <div
              key={r.reserva_id}
              className={`absolute left-1 right-1 ${color} rounded-r-lg px-2 py-1 overflow-hidden`}
              style={{ top: topH * CELL, height: Math.max(durH * CELL - 2, 22) }}
            >
              <p className="text-xs font-bold text-ink truncate leading-tight">{r.cliente_nombre}</p>
              {durH * CELL > 34 && (
                <p className="text-xs text-ink-muted truncate">{r.servicio?.nombre}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayHeader = (d: Date) => {
    const str     = toDateStr(d);
    const isToday = str === todayStr;
    return (
      <div
        key={str}
        className={`p-3 border-r border-border last:border-r-0 text-center ${isToday ? "bg-primary/5" : ""}`}
      >
        <p className="text-xs text-ink-muted uppercase tracking-wide font-semibold">{DOW_SHORT[d.getDay()]}</p>
        <p className={`text-base font-bold mt-0.5 ${isToday ? "text-primary" : "text-ink"}`}>{d.getDate()}</p>
        {reservasByDay[str]?.length > 0 && (
          <p className="text-xs text-ink-muted mt-0.5">
            {reservasByDay[str].length} turno{reservasByDay[str].length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  };

  const HoursColumn = ({ width }: { width: number }) => (
    <div className="border-r border-border" style={{ minWidth: width }}>
      {HOURS.map((h) => (
        <div key={h} className="border-b border-border/30 flex items-center justify-center px-1" style={{ height: CELL }}>
          <span className="text-xs text-ink-muted">{h}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Profesional</nav>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl text-ink">Agenda</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors"
          >
            <ion-icon name="chevron-back-outline" style={{ fontSize: "14px" }} />
          </button>
          <span className="text-sm font-medium text-ink min-w-[140px] sm:min-w-[180px] text-center">{weekLabel}</span>
          <button
            onClick={nextWeek}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors"
          >
            <ion-icon name="chevron-forward-outline" style={{ fontSize: "14px" }} />
          </button>
          <button
            onClick={goToday}
            className="ml-1 px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-bg text-ink-muted transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-2xl h-96 animate-pulse" />
      ) : (
        <>
          {/* ── Mobile: 3-day view ──────────────────────────────────────── */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <button
                onClick={prevMobileDays}
                disabled={mobileStartDay === 0}
                className="w-8 h-8 border border-border rounded-lg flex items-center justify-center text-ink-muted disabled:opacity-30 hover:bg-bg transition-colors"
              >
                <ion-icon name="chevron-back-outline" style={{ fontSize: "14px" }} />
              </button>
              <span className="text-sm font-medium text-ink">
                {DOW_SHORT[mobileDays[0].getDay()]} {mobileDays[0].getDate()}
                {" – "}
                {DOW_SHORT[mobileDays[2].getDay()]} {mobileDays[2].getDate()}
              </span>
              <button
                onClick={nextMobileDays}
                disabled={mobileStartDay >= 4}
                className="w-8 h-8 border border-border rounded-lg flex items-center justify-center text-ink-muted disabled:opacity-30 hover:bg-bg transition-colors"
              >
                <ion-icon name="chevron-forward-outline" style={{ fontSize: "14px" }} />
              </button>
            </div>

            <div
              className="bg-surface border border-border rounded-2xl overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="grid border-b border-border" style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}>
                <div className="border-r border-border" />
                {mobileDays.map(renderDayHeader)}
              </div>
              <div className="relative grid" style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}>
                <HoursColumn width={48} />
                {mobileDays.map((d) => renderDayColumn(d, "48px repeat(3, 1fr)"))}
              </div>
            </div>

            <div className="flex justify-center gap-1.5 mt-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  onClick={() => setMobileStartDay(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === mobileStartDay ? "bg-ink-fixed" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ── Desktop: full 7-day view ─────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
              <div style={{ minWidth: "520px" }}>
                <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                  <div className="border-r border-border" />
                  {weekDates.map(renderDayHeader)}
                </div>
                <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                  <HoursColumn width={56} />
                  {weekDates.map((d) => renderDayColumn(d, "56px repeat(7, 1fr)"))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && reservas.length === 0 && (
        <p className="text-center text-sm text-ink-muted mt-8">No tenés reservas en esta semana.</p>
      )}
    </div>
  );
}
