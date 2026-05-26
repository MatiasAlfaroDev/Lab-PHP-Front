import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams } from "react-router";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": React.HTMLAttributes<HTMLElement> & { name?: string };
    }
  }
}

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

function normalizeModality(m: string): string {
  const map: Record<string, string> = {
    presencial: "Presencial", virtual: "Virtual",
    hibrida: "Híbrida",      híbrida: "Híbrida",
  };
  return map[m.toLowerCase()] ?? m;
}

// Returns the Spanish day-of-week key for a Date
const DOW_MAP = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAY_NAMES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const TABS = ["Acerca de", "Servicios", "Reseñas"];

// ── Mini Calendar ──────────────────────────────────────────────────────────
function MiniCalendar({
  year, month, availableDays, selectedDate, onSelect, onPrev, onNext,
}: {
  year: number; month: number;
  availableDays: Set<string>;   // set of "lunes"|"martes"...
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onPrev: () => void; onNext: () => void;
}) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrev}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg text-sm"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-ink">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNext}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg text-sm"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-ink-muted py-1 font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(year, month, day);
          const dateStr = toDateStr(year, month, day);
          const isPast = date <= today;
          const dow = DOW_MAP[date.getDay()];
          const isAvailable = availableDays.has(dow) && !isPast;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={i}
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(dateStr)}
              className={`relative text-xs py-1.5 rounded-lg transition-colors font-medium
                ${isSelected
                  ? "bg-primary text-white"
                  : isAvailable
                  ? "hover:bg-primary-soft text-ink"
                  : "text-ink-muted/40 cursor-default"}`}
            >
              {day}
              {isAvailable && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  service, date, slot, onClose, token,
}: {
  service: Servicio; date: string; slot: string;
  onClose: (success: boolean) => void; token: string | null;
}) {
  const [method, setMethod]         = useState<"sitio" | "paypal">("sitio");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
  // PayPal SDK state
  const [reservaId, setReservaId]   = useState<number | null>(null);
  const [ppReady, setPpReady]       = useState(false);
  const ppContainerRef              = useRef<HTMLDivElement>(null);
  const ppRendered                  = useRef(false);

  // Load PayPal SDK once
  useEffect(() => {
    if (document.getElementById("paypal-sdk")) { setPpReady(true); return; }
    const script = document.createElement("script");
    script.id  = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.onload = () => setPpReady(true);
    document.body.appendChild(script);
  }, []);

  // Render PayPal button when we have a reserva_id and SDK is ready
  useEffect(() => {
    if (!ppReady || !reservaId || !ppContainerRef.current || ppRendered.current) return;
    ppRendered.current = true;
    const win = window as any;
    win.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
      createOrder: async () => {
        setError(null);
        const res = await api.post<{ paypal_order_id: string }>(
          `/pagos/reserva/${reservaId}/iniciar`, {}, token
        );
        return res.paypal_order_id;
      },
      onApprove: async (_data: any, _actions: any) => {
        try {
          await api.post(
            `/pagos/reserva/${reservaId}/capturar`,
            { paypal_order_id: _data.orderID },
            token
          );
          setSuccess(true);
        } catch (e: any) {
          setError(e.message ?? "Error al capturar el pago");
        }
      },
      onError: (err: any) => {
        setError("Error en el pago de PayPal. Intentá nuevamente.");
        console.error(err);
      },
    }).render(ppContainerRef.current);
  }, [ppReady, reservaId]);

  // Step 1: create the reservation (only for "sitio"; PayPal does it in createOrder)
  const confirmSitio = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean; data: { reserva_id: number }; message?: string }>(
        "/reservas",
        { servicio_id: service.servicio_id, fecha: date, hora: slot },
        token
      );
      if (!res.success) throw new Error(res.message ?? "Error al crear la reserva");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Error al reservar");
    } finally {
      setLoading(false);
    }
  };

  // When switching to PayPal, pre-create the reservation so the button has an ID
  const activatePaypal = async () => {
    if (reservaId) { setMethod("paypal"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean; data: { reserva_id: number }; message?: string }>(
        "/reservas",
        { servicio_id: service.servicio_id, fecha: date, hora: slot },
        token
      );
      if (!res.success) throw new Error(res.message ?? "Error al crear la reserva");
      setReservaId(res.data.reserva_id);
      setMethod("paypal");
    } catch (e: any) {
      setError(e.message ?? "Error al preparar el pago");
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
              {service.nombre} · {formatDateHuman(date)} · {slot}
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
                className="flex-1 py-2.5 rounded-xl bg-ink text-white text-sm text-center font-medium hover:bg-primary transition-colors"
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
              <div className="bg-bg rounded-xl p-4 space-y-1.5">
                <p className="text-sm font-semibold text-ink">{service.nombre}</p>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <ion-icon name="calendar-outline" style={{ fontSize: "13px" }} />
                  {formatDateHuman(date)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <ion-icon name="time-outline" style={{ fontSize: "13px" }} />
                  {slot} · {service.duracion} min
                </div>
                <p className="text-base font-bold text-ink pt-1">$ {Number(service.precio).toFixed(0)}</p>
              </div>

              {/* Payment method selector */}
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Forma de pago</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMethod("sitio")}
                    disabled={!!reservaId}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                      method === "sitio"
                        ? "border-primary bg-primary-soft/20 text-ink"
                        : "border-border text-ink-muted hover:border-primary/40"
                    }`}
                  >
                    <ion-icon name="cash-outline" style={{ fontSize: "16px" }} />
                    En el sitio
                  </button>
                  <button
                    onClick={activatePaypal}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                      method === "paypal"
                        ? "border-[#0070ba] bg-[#0070ba]/5 text-[#003087]"
                        : "border-border text-ink-muted hover:border-[#0070ba]/40"
                    }`}
                  >
                    <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-4" />
                    PayPal
                  </button>
                </div>
              </div>

              {/* PayPal button container */}
              {method === "paypal" && (
                <div>
                  {!ppReady || !reservaId ? (
                    <div className="flex justify-center py-3">
                      <span className="w-5 h-5 border-2 border-[#0070ba] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div ref={ppContainerRef} />
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Confirm button — only for "sitio" */}
              {method === "sitio" && (
                <button
                  onClick={confirmSitio}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-primary disabled:opacity-60 transition-colors"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? "Procesando..." : "Confirmar reserva"}
                </button>
              )}
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

  // Booking modal
  const [showModal, setShowModal] = useState(false);

  // Profile
  const [profile, setProfile] = useState<ProfesionalProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Tabs / service selection
  const [activeTab, setActiveTab] = useState("Servicios");
  const [selectedService, setSelectedService] = useState<Servicio | null>(null);

  // Calendar
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loadingDays, setLoadingDays] = useState(false);

  // Slots
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    if (!id) return;
    api
      .get<{ success: boolean; data: ProfesionalProfile }>(`/profesionales/${id}`)
      .then((res) => {
        if (res.success) {
          setProfile(res.data);
          const first = res.data.profesional?.servicios?.[0] ?? null;
          setSelectedService(first);
        } else {
          setProfileError("Profesional no encontrado");
        }
      })
      .catch((e) => setProfileError(e.message))
      .finally(() => setLoadingProfile(false));
  }, [id]);

  // Load available days when service changes
  useEffect(() => {
    if (!selectedService) { setAvailableDays(new Set()); return; }
    setLoadingDays(true);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    api
      .get<{ success: boolean; data: string[] }>(
        `/servicios/${selectedService.servicio_id}/dias-disponibles`
      )
      .then((res) => {
        if (res.success) setAvailableDays(new Set(res.data));
      })
      .catch(() => setAvailableDays(new Set()))
      .finally(() => setLoadingDays(false));
  }, [selectedService]);

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    setSlotsError(null);
    api
      .get<{ success: boolean; data: string[] }>(
        `/servicios/${selectedService.servicio_id}/slots?fecha=${selectedDate}`
      )
      .then((res) => { if (res.success) setSlots(res.data); })
      .catch((e: any) => setSlotsError(e.message ?? "Error al cargar horarios"))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedService]);

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
                <p className="text-sm text-ink leading-relaxed">
                  {profesional?.descripcion ?? "Este profesional aún no ha completado su descripción."}
                </p>
              )}

              {activeTab === "Servicios" && (
                <div className="space-y-3">
                  {servicios.length === 0 ? (
                    <p className="text-sm text-ink-muted">Sin servicios publicados.</p>
                  ) : (
                    servicios.map((s) => {
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
                <div className="flex flex-col items-center py-8 text-center">
                  <ion-icon name="star-outline" style={{ fontSize: "36px", color: "var(--color-ink-muted)", marginBottom: "8px" }} />
                  <p className="text-ink-muted text-sm">Las reseñas estarán disponibles próximamente.</p>
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

                {/* Calendar */}
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                    Seleccioná una fecha
                  </p>
                  {loadingDays ? (
                    <div className="flex justify-center py-6">
                      <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : availableDays.size === 0 ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-ink-muted">
                      <ion-icon name="calendar-outline" style={{ fontSize: "16px" }} />
                      Este servicio no tiene horarios configurados aún.
                    </div>
                  ) : (
                    <MiniCalendar
                      year={calMonth.year}
                      month={calMonth.month}
                      availableDays={availableDays}
                      selectedDate={selectedDate}
                      onSelect={setSelectedDate}
                      onPrev={() =>
                        setCalMonth(({ year, month }) =>
                          month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
                        )
                      }
                      onNext={() =>
                        setCalMonth(({ year, month }) =>
                          month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
                        )
                      }
                    />
                  )}
                </div>

                {/* Slots */}
                {selectedDate && (
                  <>
                    <hr className="border-border" />
                    <div>
                      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                        Horarios disponibles
                      </p>
                      {loadingSlots ? (
                        <div className="flex justify-center py-4">
                          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : slotsError ? (
                        <p className="text-sm text-red-500">{slotsError}</p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-ink-muted">
                          No hay turnos disponibles para este día.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                              className={`text-sm py-2 rounded-xl border transition-colors ${
                                selectedSlot === slot
                                  ? "bg-primary text-white border-primary"
                                  : "border-border text-ink hover:bg-bg"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <button
                  disabled={!selectedSlot}
                  onClick={() => selectedSlot && setShowModal(true)}
                  className={`w-full font-medium py-3 rounded-xl transition-colors ${
                    selectedSlot
                      ? "bg-primary hover:bg-primary-hover text-white"
                      : "bg-primary/30 text-white cursor-not-allowed"
                  }`}
                >
                  {selectedSlot ? "Reservar" : "Seleccioná fecha y horario"}
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

      {showModal && selectedService && selectedDate && selectedSlot && (
        <BookingModal
          service={selectedService}
          date={selectedDate}
          slot={selectedSlot}
          token={token}
          onClose={(success) => {
            setShowModal(false);
            if (success) { setSelectedSlot(null); setSelectedDate(null); }
          }}
        />
      )}
    </div>
  );
}
