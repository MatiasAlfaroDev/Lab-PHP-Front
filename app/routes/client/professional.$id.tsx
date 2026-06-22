import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router";
import { DateSlotPicker, normalizeModality, type Slot } from "~/components/DateSlotPicker";

// ── Types ──────────────────────────────────────────────────────────────────
interface Servicio {
  servicio_id: number;
  nombre: string;
  tipo: string;
  precio: string | number;
  duracion: number;
  modalidad: string;
  descripcion: string;
}

interface ProfesionalProfile {
  id: number;
  name: string;
  email: string;
  profesional: {
    user_id: number;
    descripcion: string | null;
    ubicacion: string | null;
    servicios: Servicio[];
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const TABS = ["Acerca de", "Servicios", "Reseñas"];

const MONTH_NAMES_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DOW_FULL = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

function formatDateHuman(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = DOW_FULL[new Date(y, m - 1, d).getDay()];
  return `${dow.charAt(0).toUpperCase() + dow.slice(1)} ${d} ${MONTH_NAMES_SHORT[m - 1]}`;
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

// ── Booking Modal ──────────────────────────────────────────────────────────
function BookingModal({
  service, date, slot, onClose, token, compraItemId,
}: {
  service: Servicio; date: string; slot: {
  hora: string;
  modalidad: string;
};
  onClose: (success: boolean) => void; token: string | null; compraItemId: string | null;
}) {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
 
  
  // Step 1: create the reservation (only for "sitio"; PayPal does it in createOrder)
  const confirmSitio = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        success: boolean;
        data: { reserva_id: number };
        message?: string;
      }>(
        "/reservas",
        {
          servicio_id: service.servicio_id,
          fecha: date,
          hora: slot.hora,
          modalidad: slot.modalidad,
          compra_item_paquete_id: compraItemId ? Number(compraItemId) : null,
        },
        token
      );

      if (!res.success) {
        throw new Error(res.message ?? "Error al crear la reserva");
      }

      setSuccess(true);

      window.dispatchEvent(
        new CustomEvent("reserva-updated")
      );

    } catch (e: any) {
      setError(e.message ?? "Error al reservar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(success); }}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl">
        {success ? (
          <div className="p-8 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-1">
              <ion-icon name="checkmark-outline" style={{ fontSize: "28px", color: "#22c55e" }} />
            </div>
            <h3 className="font-display text-xl text-ink">¡Reserva confirmada!</h3>
            <p className="text-sm text-ink-muted">
              {service.nombre} · {formatDateHuman(date)} · {slot.hora} · {normalizeModality(slot.modalidad)}
            </p>
            <div className="flex gap-2 mt-2 w-full">
              <button
                onClick={() => onClose(true)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink hover:bg-bg transition-colors"
              >
                Seguir explorando
              </button>
              <Link
                to="/client"
                className="flex-1 py-2.5 rounded-xl bg-ink-fixed text-white text-sm text-center font-medium hover:bg-primary transition-colors"
              >
                Mis reservas
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <h3 className="font-display text-lg text-ink">Confirmar reserva</h3>
              <button
                onClick={() => onClose(false)}
                className="w-7 h-7 rounded-full hover:bg-bg flex items-center justify-center text-ink-muted transition-colors"
              >
                <ion-icon name="close-outline" style={{ fontSize: "16px" }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Summary */}
              {compraItemId && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-700">
                    Esta reserva utilizará una sesión de tu paquete.
                  </p>
                </div>
              )}
              <div className="bg-bg rounded-xl p-4 space-y-1.5">
                <p className="text-sm font-semibold text-ink">{service.nombre}</p>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <ion-icon name="calendar-outline" style={{ fontSize: "13px" }} />
                  {formatDateHuman(date)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <ion-icon name="time-outline" style={{ fontSize: "13px" }} />
                  {slot.hora} · {service.duracion} min
                </div>
                <p className="text-base font-bold text-ink pt-1">$ {Number(service.precio).toFixed(0)}</p>
              </div>
               {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {/* Confirm button — only for "sitio" */}
             
                <button
                  onClick={confirmSitio}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ink-fixed text-white text-sm font-semibold hover:bg-primary disabled:opacity-60 transition-colors"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? "Procesando..." : "Confirmar reserva"}
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ProfessionalDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const compraItemId = searchParams.get("compraItem");
  const reprogramarId = searchParams.get("reprogramar");
  const servicioPaqueteId = searchParams.get("servicio");
  const isReprogramando = !!reprogramarId;
  const [reprogramError, setReprogramError] = useState("");
  const [reprogramado, setReprogramado] = useState(false);
  const [reservaOriginal, setReservaOriginal] = useState<any>(null);
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Booking modal
  const [showModal, setShowModal] = useState(false);

  // Profile
  const [profile, setProfile] = useState<ProfesionalProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Tabs / service selection
  const [activeTab, setActiveTab] = useState("Servicios");
  const [selectedService, setSelectedService] = useState<Servicio | null>(null);

  // Date + slot selection (fetching/calendar logic lives in DateSlotPicker)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [promedio, setPromedio] = useState(0);
  const [cantidadCalificaciones, setCantidadCalificaciones] = useState(0);
  const [loadingCalificaciones, setLoadingCalificaciones] = useState(false);

  const location = useLocation();
  const servicioIdPreseleccionado = location.state?.servicioId;

  useEffect(() => {
    if (!id || !token) return;
    setLoadingCalificaciones(true);

    api
      .get(`/profesionales/${id}/calificaciones`, token)
      .then((res: any) => {
        setCalificaciones(res.data ?? []);
        setPromedio(res.promedio ?? 0);
        setCantidadCalificaciones(res.cantidad ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoadingCalificaciones(false));
  }, [id, token]);

  // Load profile
  useEffect(() => {
    if (!id) return;
    api
      .get<{ success: boolean; data: ProfesionalProfile }>(`/profesionales/${id}`)
      .then((res) => {
        if (res.success) {
          setProfile(res.data);
          const servicios = res.data.profesional?.servicios ?? [];
          const seleccionado: Servicio | null =
            servicioPaqueteId
              ? servicios.find(
                  s => s.servicio_id === Number(servicioPaqueteId)
                ) ?? null
              : servicios.find(
                  s => s.servicio_id === Number(servicioIdPreseleccionado)
                ) ?? servicios[0] ?? null;

                  if (!reprogramarId) {
                    setSelectedService(seleccionado);
                  }
        } else {
          setProfileError("Profesional no encontrado");
        }
      })
      .catch((e) => setProfileError(e.message))
      .finally(() => setLoadingProfile(false));
  }, [id, servicioIdPreseleccionado, servicioPaqueteId, reprogramarId]);

useEffect(() => {
    if (!reprogramarId) return;

    setLoadingReserva(true);

    api
      .get(`/reservas/${reprogramarId}`, token)
      .then((res: any) => {
        if (!res.success) return;

        setReservaOriginal(res.data);
      })
      .catch(console.error)
      .finally(() => setLoadingReserva(false));
  }, [reprogramarId]);

  useEffect(() => {
    if (!profile || !reservaOriginal) return;

    const servicioId = reservaOriginal.servicio_id;

    const servicio = profile.profesional.servicios.find(
      (s) => Number(s.servicio_id) === Number(servicioId)
    );

    if (!servicio) return;

    setSelectedService(servicio);
    setActiveTab("Servicios");
  }, [profile, reservaOriginal]);

  const handleReprogramar = async () => {
  if (!reprogramarId || !selectedService || !selectedDate || !selectedSlot) return;

  try {
   setProcesando(true);
   const res = await api.put<{
      success: boolean;
      message?: string;
    }>(
      `/reservas/${reprogramarId}/reprogramar`,
      {
        servicio_id: selectedService.servicio_id,
        fecha: selectedDate,
        hora: selectedSlot.hora,
        modalidad: selectedSlot.modalidad,
      },
      token
    );

    if (!res.success) {
      setReprogramError(
        res.message ?? "Error al reprogramar la reserva"
      );
      return;
    }

    setReprogramado(true);
    toast.success("Reserva reprogramada correctamente");

    window.dispatchEvent(
      new CustomEvent("reserva-updated")
    );
  } catch (e: any) {
      setReprogramError(
        e?.message || "Error al reprogramar la reserva"
      );
      console.error(e);
        toast.error("Error al reprogramar la reserva");
    }
    finally {
      setProcesando(false);
    }
};

  useEffect(() => {
    if (reprogramarId) {
      toast.info("Estás reprogramando una reserva. Elegí nueva fecha y horario.");
    }
  }, [reprogramarId]);

  // ── Loading / error states ────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="p-6 max-w-6xl mx-auto animate-pulse space-y-4">
        <div className="h-4 bg-border/50 rounded w-48" />
        <div className="h-8 bg-border/50 rounded w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 h-64 bg-surface border border-border rounded-2xl" />
          <div className="h-64 bg-surface border border-border rounded-2xl" />
        </div>
      </div>
    );
  }
  if (loadingReserva) {
  return (
    <div className="p-6 max-w-6xl mx-auto flex items-center justify-center py-24 text-sm text-ink-muted">
      Cargando reserva...
    </div>
  );
}

  if (profileError || !profile) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-24 text-center">
        <ion-icon name="person-outline" style={{ fontSize: "48px", color: "var(--color-ink-muted)", marginBottom: "12px" }} />
        <p className="text-ink font-medium mb-1">Profesional no encontrado</p>
        <p className="text-ink-muted text-sm mb-4">{profileError}</p>
        <Link to="/client/discover" className="text-primary text-sm underline">Volver a Descubrir</Link>
      </div>
    );
  }

  const { name, profesional } = profile;
  const servicios = profesional?.servicios ?? [];
  const serviciosAMostrar = isReprogramando
  ? servicios.filter(
      s => s.servicio_id === reservaOriginal?.servicio_id
    )
  : servicioPaqueteId
    ? servicios.filter(
        s => s.servicio_id === Number(servicioPaqueteId)
      )
    : servicios;

  return (
    <>  
    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
    />

    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} closeOnClick pauseOnHover />

      {/* Breadcrumb */}
      <nav className="text-sm text-ink-muted mb-4 flex items-center gap-2">
        <Link to="/client/discover" className="hover:text-ink">Descubrir</Link>
        <span>·</span>
        <span>{name}</span>
      </nav>

      {/* Hero */}
      <div className="mb-6">
        <h1 className="font-display italic text-3xl text-ink">{name}</h1>
        {profesional?.ubicacion && (
          <p className="text-ink-muted flex items-center gap-1 mt-1 text-sm">
            <ion-icon name="location-outline" style={{ fontSize: "14px" }} />
            {profesional.ubicacion}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="h-40 w-full bg-gradient-to-br from-violet-100 to-purple-200" />
            <div className="px-6 pb-6">
              <div className="flex items-start gap-4 -mt-6 mb-3">
                <div className="w-16 h-16 rounded-full bg-violet-400 flex items-center justify-center text-white text-xl font-semibold border-4 border-white shrink-0">
                  {getInitials(name)}
                </div>
                <div className="flex-1 mt-7 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-display italic text-xl text-ink">{name}</h2>
                    {servicios.length > 0 && (
                      <p className="text-sm text-ink-muted">{servicios[0].tipo}</p>
                    )}
                  </div>
                  <button className="w-9 h-9 border border-border rounded-xl flex items-center justify-center text-ink-muted hover:text-accent transition-colors">
                    <ion-icon name="heart-outline" style={{ fontSize: "16px" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border px-2 pt-2">
              {TABS.map((tab) => {
                const label = tab === "Servicios" ? `Servicios · ${servicios.length}` : tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab
                        ? "border border-border border-b-surface -mb-px bg-surface text-ink"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === "Acerca de" && (
                <div className="space-y-3">
                  <p className="text-sm text-ink leading-relaxed">
                    {"Descripción:"} {profesional?.descripcion ?? "Este profesional aún no ha completado su descripción."}
                  </p>
                  {profesional?.ubicacion && (
                    <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                      <ion-icon name="location-outline" style={{ fontSize: "14px" }} />
                      {profesional.ubicacion}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "Servicios" && (
                <div className="space-y-3">
                  {servicios.length === 0 ? (
                    <p className="text-sm text-ink-muted">Sin servicios publicados.</p>
                  ) : (
                    serviciosAMostrar.map((s) => {
                      const modality = normalizeModality(s.modalidad);
                      const isSelected = selectedService?.servicio_id === s.servicio_id;
                      return (
                        <div
                          key={s.servicio_id}
                          onClick={() => setSelectedService(s)}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary-soft/20"
                              : "border-border bg-bg hover:border-primary/40"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink mb-0.5">{s.nombre}</p>
                            {s.descripcion && (
                              <p className="text-xs text-ink-muted line-clamp-1 mb-1">{s.descripcion}</p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-ink-muted">
                                <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                                {s.duracion} min
                              </span>
                              <span
                                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                                  modality === "Virtual"
                                    ? "border-primary/30 text-primary bg-primary-soft/40"
                                    : "border-border text-ink-muted bg-surface"
                                }`}
                              >
                                <ion-icon
                                  name={modality === "Virtual" ? "desktop-outline" : "location-outline"}
                                  style={{ fontSize: "11px" }}
                                />
                                {modality}
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-ink shrink-0">
                            $ {Number(s.precio).toFixed(0)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "Reseñas" && (
                <div className="space-y-4">

                  {/* Header igual concepto dashboard */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg text-ink">
                      Reseñas
                    </h3>

                    <div className="text-sm text-ink-muted">
                      ⭐ {promedio.toFixed(1)} · {cantidadCalificaciones} opiniones
                    </div>
                  </div>

                  {/* Loading */}
                  {loadingCalificaciones && (
                    <div className="text-sm text-ink-muted py-6">
                      Cargando reseñas...
                    </div>
                  )}

                  {/* Empty */}
                  {!loadingCalificaciones && calificaciones.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-center">
                      <ion-icon
                        name="star-outline"
                        style={{ fontSize: "36px", color: "var(--color-ink-muted)" }}
                      />
                      <p className="text-sm text-ink-muted mt-2">
                        Este profesional aún no tiene reseñas
                      </p>
                    </div>
                  )}

                  {/* Lista estilo dashboard profesional */}
                  <div className="space-y-2">
                    {calificaciones.map((c) => (
                      <div
                        key={c.calificacion_id}
                        className="p-4 border border-border rounded-xl bg-bg"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-ink">
                            {c.cliente_nombre ?? "Cliente"}
                          </p>

                          <span className="text-amber-500 text-sm font-bold">
                            ⭐ {c.puntuacion}/5
                          </span>
                        </div>

                        {c.comentario && (
                          <p className="text-sm text-ink-muted mt-2">
                            {c.comentario}
                          </p>
                        )}

                        <p className="text-[11px] text-ink-muted mt-2">
                          {c.reserva?.servicio?.nombre}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: booking panel ───────────────────────────────────── */}
        <div>
          <div className="bg-surface border border-border rounded-2xl p-5 sticky top-6 space-y-5">
            {/* Selected service summary */}
            {selectedService ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                    Servicio seleccionado
                  </p>
                  <h3 className="font-display italic text-xl text-ink">{selectedService.nombre}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-ink-muted">
                      <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                      {selectedService.duracion} min
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                        normalizeModality(selectedService.modalidad) === "Virtual"
                          ? "border-primary/30 text-primary bg-primary-soft/40"
                          : "border-border text-ink-muted bg-bg"
                      }`}
                    >
                      <ion-icon
                        name={normalizeModality(selectedService.modalidad) === "Virtual" ? "desktop-outline" : "location-outline"}
                        style={{ fontSize: "11px" }}
                      />
                      {normalizeModality(selectedService.modalidad)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-xs text-ink-muted">desde</span>
                    <span className="font-display italic text-2xl text-ink">
                      $ {Number(selectedService.precio).toFixed(0)}
                    </span>
                  </div>
                </div>

                <hr className="border-border" />
                {isReprogramando && !reprogramado && (
                  <div className="mb-3 bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-sm">
                    Estás reprogramando una reserva. Elegí nueva fecha y horario.
                  </div>
                )}
                {reprogramado && (
                  <div className="mb-3 bg-green-100 text-green-700 px-3 py-2 rounded-xl text-sm">
                    Reserva reprogramada correctamente ✔
                  </div>
                )}
                {reprogramError && (
                  <div className="mb-3 bg-red-100 text-red-700 px-3 py-2 rounded-xl text-sm">
                    {reprogramError}
                  </div>
                )}
                <DateSlotPicker
                  servicioId={selectedService.servicio_id}
                  modalidad={selectedService.modalidad}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  onSelectDate={setSelectedDate}
                  onSelectSlot={setSelectedSlot}
                />

                <button
                  disabled={!selectedSlot || procesando}
                  onClick={() => {
                    if (!selectedSlot || procesando) return;

                    if (isReprogramando) {
                      handleReprogramar();
                    } else {
                      setShowModal(true);
                    }
                  }}
                  className={`w-full font-medium py-3 rounded-xl transition-colors ${
                    selectedSlot && !procesando
                      ? "bg-primary hover:bg-primary-hover text-white"
                      : "bg-primary/30 text-white cursor-not-allowed"
                  }`}
                >
                  {procesando
                    ? "Reprogramando..."
                    : isReprogramando
                      ? "Confirmar reprogramación"
                      : selectedSlot
                        ? "Reservar"
                        : "Seleccioná fecha y horario"}
                </button>
              </>
            ) : (
              <p className="text-sm text-ink-muted py-4 text-center">
                Seleccioná un servicio para ver disponibilidad.
              </p>
            )}
          </div>
        </div>
      </div>

      {showModal && !isReprogramando && selectedService && selectedDate && selectedSlot && (
        <BookingModal
          service={selectedService}
          date={selectedDate}
          slot={selectedSlot}
          token={token}
          compraItemId={compraItemId}
          onClose={(success) => {
            setShowModal(false);
            if (success) { setSelectedSlot(null); setSelectedDate(null); }
          }}
        />
      )}
    </div>
  </>
  );
}
