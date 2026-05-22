import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const TIMES = ["09:00", "10:00", "11:30", "14:00", "15:00", "16:30"];

export default function ProfessionalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Servicios · 6");
  const [selectedTime, setSelectedTime] = useState("15:00");
  const [selectedDate, setSelectedDate] = useState(22);

  const calendarDays = [
    [24, 25, 26, 27, 1, 2, 3],
    [4, 5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29, 30, 31],
  ];
  const availableDays = [5, 8, 12, 14, 15, 19, 22, 26, 28];

  const tabs = ["Acerca de", "Servicios · 6", "Paquetes · 3", "Reseñas · 234"];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-muted mb-4 flex items-center gap-2">
        <Link to="/client/discover" className="hover:text-ink">Descubrir</Link>
        <span>·</span>
        <span>Salud y bienestar</span>
      </nav>

      {/* Hero title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display italic text-3xl text-ink">María Ortiz</h1>
          <p className="text-ink-muted">Psicología clínica · Palermo · CABA</p>
        </div>
        <button className="relative p-2 rounded-xl border border-border bg-surface hover:bg-bg">
          <BellIcon />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-xs flex items-center justify-center">3</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover + avatar */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div
              className="h-40 w-full"
              style={{ background: "linear-gradient(135deg, #e8c4b8, #d4a89a)" }}
            />
            <div className="px-6 pb-6">
              <div className="flex items-start gap-4 -mt-6 mb-4">
                <div className="w-16 h-16 rounded-full bg-violet-400 flex items-center justify-center text-white text-xl font-semibold border-4 border-white">
                  MO
                </div>
                <div className="flex-1 mt-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display italic text-xl text-ink flex items-center gap-2">
                        María Ortiz
                        <span className="text-ink-muted text-base">○</span>
                      </h2>
                      <p className="text-sm text-ink-muted">Psicología clínica · 8 años de experiencia</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-xl text-sm text-ink hover:bg-bg transition-colors">
                        💬 Mensaje
                      </button>
                      <button className="w-9 h-9 border border-border rounded-xl flex items-center justify-center text-ink-muted hover:text-accent transition-colors">
                        ♡
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-amber-500">★★★★★ <span className="text-ink font-medium">4.9</span> <span className="text-ink-muted">(234 reseñas)</span></span>
                    <span className="text-ink-muted">📍 Palermo · CABA</span>
                    <span className="text-ink-muted">🌐 Habla ES · EN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border px-2 pt-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab
                      ? "border border-border border-b-surface -mb-px bg-surface text-ink"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab.startsWith("Acerca") && (
                <p className="text-sm text-ink leading-relaxed">
                  Psicóloga clínica con enfoque cognitivo-conductual. Trabajo con adultos en
                  procesos de ansiedad, transiciones vitales y vínculos. Sesiones cálidas y
                  enfocadas, con un seguimiento entre encuentros si lo necesitás.
                </p>
              )}

              {activeTab.startsWith("Servicios") && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                    Servicios individuales
                  </h4>
                  {[
                    { name: "Sesión individual", badge: "Más reservada", duration: "50 min", modalities: "Presencial · Virtual", price: 48 },
                    { name: "Primera consulta · diagnóstica", badge: null, duration: "60 min", modalities: "Presencial · Virtual", price: 55 },
                    { name: "Sesión de pareja", badge: null, duration: "75 min", modalities: "Presencial", price: 78 },
                    { name: "Seguimiento breve", badge: null, duration: "25 min", modalities: "Virtual", price: 28 },
                  ].map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-ink">{s.name}</span>
                          {s.badge && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                              {s.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted">⏱ {s.duration} · {s.modalities}</p>
                      </div>
                      <span className="text-lg font-bold text-ink">€{s.price}</span>
                      <button
                        onClick={() => navigate(`/client/booking/${id}/pay`)}
                        className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                      >
                        Reservar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab.startsWith("Paquetes") && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { sessions: 4, discount: 5, price: 180, perSession: 45, sold: 28 },
                    { sessions: 8, discount: 12, price: 320, perSession: 40, sold: 41, popular: true },
                    { sessions: 12, discount: 20, price: 460, perSession: 38, sold: 14 },
                  ].map((p) => (
                    <div
                      key={p.sessions}
                      className={`p-4 rounded-xl border ${p.popular ? "border-primary bg-primary-soft/30" : "border-border bg-bg"}`}
                    >
                      {p.popular && (
                        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mb-2 inline-block">
                          Más popular
                        </span>
                      )}
                      <p className="text-xs text-accent font-medium">−{p.discount}%</p>
                      <p className="font-display italic text-2xl text-ink">{p.sessions} sesiones</p>
                      <p className="text-xs text-ink-muted mb-2">Sesión individual</p>
                      <p className="text-2xl font-bold text-ink">€{p.price}</p>
                      <p className="text-xs text-ink-muted">€{p.perSession} por sesión</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab.startsWith("Reseñas") && (
                <div className="space-y-4">
                  {[
                    { name: "Lucía P.", stars: 5, text: "Súper contenida y profesional. Cada sesión siento que avanzo un poco más.", date: "hace 2 días" },
                    { name: "Carlos R.", stars: 5, text: "Excelente profesional, muy empática y puntual. La recomiendo.", date: "hace 1 semana" },
                  ].map((r) => (
                    <div key={r.name} className="p-4 bg-bg rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink">{r.name}</span>
                        <span className="text-xs text-ink-muted">{r.date}</span>
                      </div>
                      <p className="text-amber-500 text-xs mb-1">{"★".repeat(r.stars)}</p>
                      <p className="text-sm text-ink">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: booking widget */}
        <div>
          <div className="bg-surface border border-border rounded-2xl p-5 sticky top-6">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
              Reservar turno
            </p>
            <h3 className="font-display italic text-xl text-ink mb-3">Sesión individual</h3>

            <div className="flex gap-2 mb-4">
              <span className="text-xs bg-bg border border-border px-3 py-1 rounded-full text-ink">
                📍 Presencial
              </span>
              <span className="text-xs bg-primary-soft text-primary border border-primary/20 px-3 py-1 rounded-full">
                ⬜ Virtual
              </span>
            </div>

            {/* Mini calendar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-ink">Mayo 2026</span>
                <div className="flex gap-1">
                  <button className="w-6 h-6 rounded border border-border text-ink-muted hover:bg-bg text-xs">‹</button>
                  <button className="w-6 h-6 rounded border border-border text-ink-muted hover:bg-bg text-xs">›</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs text-ink-muted py-1 font-medium">
                    {d}
                  </div>
                ))}
                {calendarDays.flat().map((day, i) => {
                  const isAvailable = availableDays.includes(day);
                  const isSelected = day === selectedDate;
                  return (
                    <button
                      key={i}
                      onClick={() => isAvailable && setSelectedDate(day)}
                      className={`text-xs py-1.5 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-primary text-white font-semibold"
                          : isAvailable
                          ? "hover:bg-primary-soft text-ink relative"
                          : "text-ink-muted"
                      }`}
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

            {/* Time slots */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                VIE {selectedDate} · HORARIOS LIBRES
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`text-sm py-2 rounded-xl border transition-colors ${
                      selectedTime === t
                        ? "bg-primary text-white border-primary"
                        : "border-border text-ink hover:bg-bg"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-ink-muted">Sesión de 50 min</span>
              <span className="font-display italic text-2xl text-ink">€48</span>
            </div>

            <button
              onClick={() => navigate(`/client/booking/${id}/pay`)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors"
            >
              Confirmar reserva →
            </button>
            <p className="text-xs text-ink-muted text-center mt-2">
              Cancelación gratuita hasta 24h antes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
