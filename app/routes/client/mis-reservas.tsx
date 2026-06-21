import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Reserva {
  reserva_id: number;
  fecha: string;
  hora: string;
  estado: string;
   calificacion?: {
    calificacion_id: number;
    puntuacion: number;
    comentario: string;
  } | null;
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
  pendiente:    { label: "Pendiente",   cls: "bg-amber-100 text-amber-800" },
  confirmada:   { label: "Confirmada",  cls: "bg-blue-100 text-blue-800" },
  pagada:       { label: "Pagada",      cls: "bg-green-100 text-green-800" },
  en_curso:     { label: "En curso",    cls: "bg-violet-100 text-violet-800" },
  cancelada:    { label: "Cancelada",   cls: "bg-gray-100 text-ink-muted" },
  finalizada:   { label: "Finalizada",  cls: "bg-gray-100 text-ink-muted" },
  no_asistida:  { label: "No asistida", cls: "bg-gray-100 text-ink-muted" },
  realizada:    { label: "No aceptada", cls: "bg-green-100 text-green-800" },
};

const TERMINAL = new Set(["cancelada", "finalizada", "no_asistida", "no aceptada"]);

const MONTH_NAMES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

const FILTERS = ["Todas", "Próximas", "Pasadas", "Canceladas"];

export default function MisReservas() {
  const { token } = useAuth();
  const [reservas, setReservas]     = useState<Reserva[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filter, setFilter]         = useState("Próximas");
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<number | null>(null);
  const [showCalificacion, setShowCalificacion] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [search, setSearch] = useState("");

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
    const past      = rDate < today;
    const cancelled = r.estado === "cancelada" || r.estado === "no_asistida";
    if (filter === "Próximas"   && (past || cancelled)) return false;
    if (filter === "Pasadas"    && (!past || cancelled)) return false;
    if (filter === "Canceladas" && !cancelled) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.servicio?.nombre?.toLowerCase().includes(q) ||
      r.servicio?.profesional_nombre?.toLowerCase().includes(q)
    );
  });

  const handleCancel = async () => {
    if (confirmingCancel === null) return;

    const id = confirmingCancel;
    setCancelling(id);

    try {
      await api.put(`/reservas/${id}/cancelar`, {}, token);

      setReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === id ? { ...r, estado: "cancelada" } : r
        )
      );

      setCancelling(null);
      setCancelSuccess(true); //mostramos éxito en el modal

      setTimeout(() => {
        setConfirmingCancel(null);
        setCancelSuccess(false); 
      }, 6000);
    } catch (e: any) {
      setCancelling(null);
      setConfirmingCancel(null);
    }
  };
  const abrirModalCalificacion = (reserva: Reserva) => {
      setReservaSeleccionada(reserva);
      setPuntuacion(5);
      setComentario("");
      setShowCalificacion(true);
    };
  const guardarCalificacion = async () => {
    if (!reservaSeleccionada) return;

    try {
      const response: any = await api.post(
        `/reservas/${reservaSeleccionada.reserva_id}/calificar`,
        {
          puntuacion,
          comentario,
        },
        token
      );

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      const nuevaCalificacion = response.data;

      setReservas(prev =>
        prev.map(r =>
          r.reserva_id === reservaSeleccionada.reserva_id
            ? {
                ...r,
                calificacion: nuevaCalificacion,
              }
            : r
        )
      );
      
      console.log("RESPUESTA:", response);
      toast.success("Calificación enviada");
      setShowCalificacion(false);
    } catch (e: any) {
      toast.error(e.message ?? "Error al enviar la calificación");
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} closeOnClick pauseOnHover />

      {/* Confirmation modal */}
      {confirmingCancel !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setConfirmingCancel(null);
            setCancelSuccess(false);
          }}
        >
          <div
            className="bg-surface rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {cancelSuccess ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <ion-icon name="checkmark-outline" style={{ fontSize: "22px", color: "#22c55e" }} />
                </div>

                <h2 className="font-semibold text-lg">Reserva cancelada</h2>

                <p className="text-sm text-ink-muted">
                  Cancelada correctamente. Contactá al profesional para gestionar el reembolso.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 mb-5">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-1">
                    <ion-icon name="trash-outline" style={{ fontSize: "22px", color: "#f87171" }} />
                  </div>
                  <h2 className="font-display text-lg text-ink text-center">
                    ¿Cancelar esta reserva?
                  </h2>
                  <p className="text-sm text-ink-muted text-center">
                    Esta acción no se puede deshacer. La reserva quedará cancelada permanentemente.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmingCancel(null)}
                    className="flex-1 px-4 py-2 rounded-xl border border-border text-ink text-sm font-medium hover:bg-surface transition-colors"
                  >
                    Volver
                  </button>

                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Sí, cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showCalificacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCalificacion(false)}
        >
          <div
            className="bg-surface rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">
              Calificar servicio
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Puntuación
              </label>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPuntuacion(n)}
                    className={`text-3xl ${
                      n <= puntuacion
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Comentario
              </label>

              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Contanos tu experiencia..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCalificacion(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={guardarCalificacion}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {/* Toolbar — búsqueda, coherente con /professional/services */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar reservas"
              className="w-full pl-8 pr-3 py-1.5 text-sm text-ink placeholder-ink-muted bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 px-4 py-3 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border cursor-pointer ${
                filter === f
                  ? "bg-ink-fixed text-white border-ink-fixed"
                  : "border-border text-ink-muted hover:border-primary/40 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-surface border-t border-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-4 ${i > 1 ? "border-t border-border" : ""}`}>
                <div className="w-14 h-14 rounded-xl bg-border/50 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 rounded bg-border/50 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-border/50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <ion-icon name="cloud-offline-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
            <p className="text-ink font-medium">No se pudieron cargar las reservas</p>
            <p className="text-sm text-ink-muted">Hubo un problema al conectar con el servidor. Intentá de nuevo.</p>
            <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline cursor-pointer">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center gap-3">
            <ion-icon name="calendar-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
            <p className="text-ink font-medium">No hay reservas {filter !== "Todas" ? filter.toLowerCase() : ""}</p>
            <Link to="/client/discover" className="text-sm text-primary hover:underline">
              Explorar profesionales
            </Link>
          </div>
        ) : (
          <div className="bg-surface border-t border-border">
            {filtered.map((r, idx) => {
              const [ry, rm, rd] = r.fecha.split("-").map(Number);
              const rDate = new Date(ry, rm - 1, rd);
              const isPast = rDate < today;
              const puedeCalificar =  isPast &&  r.estado === "finalizada" && !r.calificacion;
              const canReschedule = ["confirmada", "pagada"].includes(r.estado) && !isPast;
              const isCancelled = r.estado === "cancelada" || r.estado === "no_asistida";
              const displayEstado = isPast && !TERMINAL.has(r.estado) ? "no aceptada" : r.estado;
              const badge      = ESTADO_STYLE[displayEstado] ?? { label: displayEstado, cls: "bg-gray-100 text-ink-muted" };
              const canCancel  = ["pendiente", "confirmada"].includes(r.estado) && !isPast;

              return (
                <div
                  key={r.reserva_id}
                  className={`flex items-center gap-4 px-4 py-4 transition-opacity ${idx > 0 ? "border-t border-border" : ""} ${
                    isCancelled ? "opacity-50" : ""
                  }`}
                >
                  {/* Date block */}
                  <div className="shrink-0 w-14 flex flex-col items-center bg-bg rounded-xl py-2">
                    <span className="text-xs text-ink-muted uppercase">
                      {MONTH_NAMES[Number(r.fecha.split("-")[1]) - 1]}
                    </span>
                    <span className={`text-2xl font-bold leading-tight ${isCancelled ? "text-ink-muted" : "text-ink"}`}>
                      {Number(r.fecha.split("-")[2])}
                    </span>
                    <span className="text-xs text-ink-muted">{formatTime(r.hora)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold mb-1 ${isCancelled ? "text-ink-muted line-through" : "text-ink"}`}>
                      {r.servicio?.nombre}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap mb-2">
                      <span className="flex items-center gap-1">
                        <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                        {r.servicio?.duracion} min
                      </span>
                      <span className="flex items-center gap-1">
                        <ion-icon name={r.servicio?.modalidad === "virtual" ? "desktop-outline" : "location-outline"} style={{ fontSize: "12px" }} />
                        {r.servicio?.modalidad}
                      </span>
                      <span className={`font-semibold ${isCancelled ? "text-ink-muted" : "text-ink"}`}>
                        $ {Number(r.servicio?.precio).toFixed(0)}
                      </span>
                    </div>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Acciones — botón coherente con /professional, ícono de borrar alineado */}
                  <div className="shrink-0 flex items-center gap-3">
                    {canReschedule && (
                      <Link
                        to={`/client/professional/${r.servicio.profesional_id}?reprogramar=${r.reserva_id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
                      >
                        Reprogramar
                      </Link>
                    )}

                    {puedeCalificar && (
                      <button
                        onClick={() => abrirModalCalificacion(r)}
                        title="Calificar"
                        className="text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        <ion-icon name="star-outline" style={{ fontSize: "16px" }} />
                      </button>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => setConfirmingCancel(r.reserva_id)}
                        disabled={cancelling === r.reserva_id}
                        className="px-4 py-2 rounded-full text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancelling === r.reserva_id ? "Cancelando..." : "Cancelar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}


