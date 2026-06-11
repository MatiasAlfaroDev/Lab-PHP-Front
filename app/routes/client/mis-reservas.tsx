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
  pendiente:    { label: "Pendiente",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmada:   { label: "Confirmada",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pagada:       { label: "Pagada",      cls: "bg-green-50 text-green-700 border-green-200" },
  en_curso:     { label: "En curso",    cls: "bg-violet-50 text-violet-700 border-violet-200" },
  cancelada:    { label: "Cancelada",   cls: "bg-red-50 text-red-400 border-red-200" },
  finalizada:   { label: "Finalizada",  cls: "bg-surface text-ink-muted border-border" },
  no_asistida:  { label: "No asistida", cls: "bg-red-50 text-red-400 border-red-200" },
  realizada:    { label: "No aceptada",   cls: "bg-green-50 text-green-600 border-green-200" },
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
    if (filter === "Próximas")   return !past && !cancelled;
    if (filter === "Pasadas")    return past && !cancelled;
    if (filter === "Canceladas") return cancelled;
    return true;
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
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border"
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
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-border"
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

      <div className="p-6 max-w-3xl mx-auto">
        <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Cliente</nav>
        <h1 className="font-display text-3xl text-ink mb-1">Reservas</h1>
        <p className="text-ink-muted text-sm mb-6">Historial y estado de tus turnos.</p>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border cursor-pointer ${
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
          <div className="space-y-3">
            {filtered.map((r) => {
              const [ry, rm, rd] = r.fecha.split("-").map(Number);
              const rDate = new Date(ry, rm - 1, rd);
              const isPast = rDate < today;
              const puedeCalificar =  isPast &&  r.estado === "finalizada" && !r.calificacion;
              const canReschedule = ["confirmada", "pagada"].includes(r.estado) && !isPast;
              const isCancelled = r.estado === "cancelada" || r.estado === "no_asistida";
              const displayEstado = isPast && !TERMINAL.has(r.estado) ? "no aceptada" : r.estado;
              const badge      = ESTADO_STYLE[displayEstado] ?? { label: displayEstado, cls: "bg-surface text-ink-muted border-border" };
              const canCancel  = ["pendiente", "confirmada"].includes(r.estado) && !isPast;

              return (
                <div
                  key={r.reserva_id}
                  className={`bg-surface border border-border rounded-2xl p-4 flex items-start gap-4 transition-opacity ${
                    isCancelled ? "opacity-50" : ""
                  }`}
                >
                  {/* Date block */}
                  <div className="shrink-0 w-14 flex flex-col items-center bg-bg border border-border rounded-xl py-2">
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
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-semibold ${isCancelled ? "text-ink-muted line-through" : "text-ink"}`}>
                        {r.servicio?.nombre}
                      </p>
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
                      <span className={`font-semibold ${isCancelled ? "text-ink-muted" : "text-ink"}`}>
                        $ {Number(r.servicio?.precio).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-2">
                    
                    {canReschedule && (
                      <Link
                        to={`/client/professional/${r.servicio.profesional_id}?reprogramar=${r.reserva_id}`}
                        className="px-3 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg text-xs"
                      >
                        Reprogramar
                      </Link>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => setConfirmingCancel(r.reserva_id)}
                        disabled={cancelling === r.reserva_id}
                        title="Cancelar reserva"
                        className="w-full px-3 py-2 text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        {cancelling === r.reserva_id
                          ? <ion-icon name="hourglass-outline" style={{ fontSize: "16px" }} />
                          : <ion-icon name="trash-outline" style={{ fontSize: "16px" }} />
                        }
                      </button>
                    )}

                  </div>
                  {puedeCalificar && (
                    <button
                      onClick={() => abrirModalCalificacion(r)}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs"
                    >
                      Calificar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}


