import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": React.HTMLAttributes<HTMLElement> & { name?: string };
    }
  }
}

interface Reserva {
  reserva_id: number;
  fecha: string;
  hora: string;
  estado: string;
  servicio: {
    nombre: string;
    duracion: number;
    modalidad: string;
    precio: string | number;
    profesional_nombre: string;
    profesional_id: number;
  };
  pago?: { estado: string } | null;
}

const ESTADO_STYLE: Record<string, { label: string; cls: string }> = {
  pendiente:    { label: "Pendiente",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmada:   { label: "Confirmada",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pagada:       { label: "Pagada",      cls: "bg-green-50 text-green-700 border-green-200" },
  en_curso:     { label: "En curso",    cls: "bg-violet-50 text-violet-700 border-violet-200" },
  cancelada:    { label: "Cancelada",   cls: "bg-red-50 text-red-400 border-red-200" },
  finalizada:   { label: "Finalizada",  cls: "bg-surface text-ink-muted border-border" },
  no_asistida:  { label: "No asistida", cls: "bg-red-50 text-red-400 border-red-200" },
};

const MONTH_NAMES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DOW = ["dom","lun","mar","mié","jue","vie","sáb"];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = DOW[new Date(y, m - 1, d).getDay()];
  return `${dow} ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

const FILTERS = ["Todas", "Próximas", "Pasadas", "Canceladas"];

export default function MisReservas() {
  const { token } = useAuth();
  const [reservas, setReservas]   = useState<Reserva[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState("Próximas");
  const [cancelling, setCancelling] = useState<number | null>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get<{ success: boolean; data: Reserva[] }>("/mis-reservas", token)
      .then((res) => { if (res.success) setReservas(res.data); })
      .catch((e: any) => setError(e.message ?? "Error al cargar reservas"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = reservas.filter((r) => {
    const [y, m, d] = r.fecha.split("-").map(Number);
    const rDate = new Date(y, m - 1, d);
    const past   = rDate < today;
    const cancelled = r.estado === "cancelada" || r.estado === "no_asistida";
    if (filter === "Próximas")   return !past && !cancelled;
    if (filter === "Pasadas")    return past && !cancelled;
    if (filter === "Canceladas") return cancelled;
    return true;
  });

  const handleCancel = async (id: number) => {
    if (!confirm("¿Cancelar esta reserva?")) return;
    setCancelling(id);
    try {
      await api.put(`/reservas/${id}/cancelar`, {}, token);
      setReservas((prev) =>
        prev.map((r) => r.reserva_id === id ? { ...r, estado: "cancelada" } : r)
      );
    } catch (e: any) {
      alert(e.message ?? "Error al cancelar");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Cliente</nav>
      <h1 className="font-display text-3xl text-ink mb-1">Mis reservas</h1>
      <p className="text-ink-muted text-sm mb-6">Historial y estado de tus turnos.</p>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === f
                ? "bg-ink text-white border-ink"
                : "border-border text-ink-muted hover:border-primary/40 hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <ion-icon name="calendar-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
          <p className="text-ink font-medium">No hay reservas {filter !== "Todas" ? filter.toLowerCase() : ""}</p>
          <Link to="/client/discover" className="text-sm text-primary hover:underline">
            Explorar profesionales
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const badge = ESTADO_STYLE[r.estado] ?? { label: r.estado, cls: "bg-surface text-ink-muted border-border" };
            const canCancel = ["pendiente", "confirmada"].includes(r.estado);
            console.log("estado:", r.estado);
            return (
              <div
                key={r.reserva_id}
                className="bg-surface border border-border rounded-2xl p-4 flex items-start gap-4"
              >
                {/* Date block */}
                <div className="shrink-0 w-14 flex flex-col items-center bg-bg border border-border rounded-xl py-2">
                  <span className="text-xs text-ink-muted uppercase">
                    {MONTH_NAMES[Number(r.fecha.split("-")[1]) - 1]}
                  </span>
                  <span className="text-2xl font-bold text-ink leading-tight">
                    {Number(r.fecha.split("-")[2])}
                  </span>
                  <span className="text-xs text-ink-muted">{formatTime(r.hora)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-ink">{r.servicio?.nombre}</p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mb-1">{r.servicio?.profesional_nombre}</p>
                  <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                      {r.servicio?.duracion} min
                    </span>
                    <span className="flex items-center gap-1">
                      <ion-icon name={r.servicio?.modalidad === "virtual" ? "desktop-outline" : "location-outline"} style={{ fontSize: "12px" }} />
                      {r.servicio?.modalidad}
                    </span>
                    <span className="font-semibold text-ink">
                      $ {Number(r.servicio?.precio).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {canCancel && (
                  <button
                    onClick={() => handleCancel(r.reserva_id)}
                    disabled={cancelling === r.reserva_id}
                    className="shrink-0 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelling === r.reserva_id ? "..." : "Cancelar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
