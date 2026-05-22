import { useState } from "react";

const services = [
  { id: 1, active: true, name: "Sesión individual", sub: "Atención individual estándar", duration: "50 min", modalities: ["PRESENCIAL", "VIRTUAL"], price: 48, count: 142 },
  { id: 2, active: true, name: "Primera consulta", sub: "Evaluación inicial · diagnóstica", duration: "60 min", modalities: ["PRESENCIAL", "VIRTUAL"], price: 55, count: 28 },
  { id: 3, active: true, name: "Sesión de pareja", sub: "Para dos participantes", duration: "75 min", modalities: ["PRESENCIAL"], price: 78, count: 34 },
  { id: 4, active: true, name: "Seguimiento breve", sub: "Check-in entre sesiones", duration: "25 min", modalities: ["VIRTUAL"], price: 28, count: 67 },
  { id: 5, active: false, name: "Sesión familiar", sub: "Hasta 4 participantes", duration: "90 min", modalities: ["PRESENCIAL"], price: 110, count: 12 },
];

const packages = [
  { sessions: 4, discount: 5, price: 180, perSession: 45, sold: 28 },
  { sessions: 8, discount: 12, price: 320, perSession: 40, sold: 41, popular: true },
  { sessions: 12, discount: 20, price: 460, perSession: 38, sold: 14 },
];

const Toggle = ({ checked }: { checked: boolean }) => (
  <div className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-ink" : "bg-border"}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`} />
  </div>
);

export default function Services() {
  const [activeTab, setActiveTab] = useState("Servicios individuales");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Servicios y paquetes</h1>
          <p className="text-ink-muted mt-1">6 servicios activos · 3 paquetes</p>
        </div>
        <button className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors">
          + Nuevo servicio
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {["Servicios individuales", "Paquetes", "Precios y promociones"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Servicios individuales" && (
        <div className="bg-surface border border-border rounded overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
            {["", "SERVICIO", "DURACIÓN", "MODALIDAD", "PRECIO", "RESERVAS", ""].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${
                  i === 0 ? "col-span-1" : i === 1 ? "col-span-3" : i === 5 ? "col-span-2" : i === 6 ? "col-span-1" : "col-span-2"
                }`}
              >
                {h}
              </div>
            ))}
          </div>

          {services.map((s) => (
            <div
              key={s.id}
              className={`grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center ${
                !s.active ? "opacity-50" : ""
              }`}
            >
              <div className="col-span-1">
                <Toggle checked={s.active} />
              </div>
              <div className="col-span-3">
                <p className="text-sm font-semibold text-ink">{s.name}</p>
                <p className="text-xs text-ink-muted">{s.sub}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-ink">{s.duration}</span>
              </div>
              <div className="col-span-2 flex flex-wrap gap-1">
                {s.modalities.map((m) => (
                  <span
                    key={m}
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      m === "VIRTUAL"
                        ? "bg-accent text-ink"
                        : "bg-primary-soft text-ink-muted"
                    }`}
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="col-span-2">
                <span className="font-display text-xl text-ink font-bold">€{s.price}</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-ink-muted">{s.count} este año</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <button className="text-ink-muted hover:text-ink p-1">✏️</button>
                <button className="text-ink-muted hover:text-ink p-1">⋯</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Paquetes" && (
        <div>
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">PAQUETES OFRECIDOS</h3>
          <div className="grid grid-cols-3 gap-5">
            {packages.map((p) => (
              <div
                key={p.sessions}
                className={`rounded border p-5 ${
                  p.popular ? "border-ink bg-surface shadow-md" : "border-border bg-surface"
                }`}
              >
                {p.popular && (
                  <span className="text-xs font-bold bg-ink text-white px-2 py-0.5 rounded mb-3 inline-block">
                    MÁS POPULAR
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-accent text-ink px-2 py-0.5 rounded">−{p.discount}%</span>
                </div>
                <h3 className="font-display text-3xl text-ink mb-1">{p.sessions} sesiones</h3>
                <p className="text-xs text-ink-muted mb-3">Sesión individual · {p.sessions * 50} min en total</p>
                <p className="font-display text-4xl text-ink font-bold mb-1">€{p.price}</p>
                <div className="flex items-center justify-between text-xs text-ink-muted mt-2">
                  <span>€{p.perSession} por sesión</span>
                  <span>{p.sold} vendidos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Precios y promociones" && (
        <div className="bg-surface border border-border rounded p-8 text-center">
          <p className="text-ink-muted">Configura descuentos y promociones especiales aquí.</p>
        </div>
      )}
    </div>
  );
}
