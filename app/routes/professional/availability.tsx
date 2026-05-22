import { useState } from "react";

const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

const initialSlots: Record<string, { active: boolean; blocks: { start: number; end: number; label: string }[] }> = {
  LUN: { active: true, blocks: [{ start: 9, end: 13, label: "Mañana" }, { start: 15, end: 19, label: "Tarde" }] },
  MAR: { active: true, blocks: [{ start: 9, end: 13, label: "Mañana" }, { start: 15, end: 19, label: "Tarde" }] },
  MIÉ: { active: true, blocks: [{ start: 9, end: 13, label: "Mañana" }, { start: 14, end: 18, label: "Tarde" }] },
  JUE: { active: true, blocks: [{ start: 10, end: 14, label: "Mañana" }, { start: 16, end: 20, label: "Tarde" }] },
  VIE: { active: true, blocks: [{ start: 9, end: 13, label: "Mañana" }] },
  SÁB: { active: false, blocks: [] },
  DOM: { active: false, blocks: [] },
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-ink" : "bg-border"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`}
    />
  </button>
);

export default function Availability() {
  const [slots, setSlots] = useState(initialSlots);
  const [activeTab, setActiveTab] = useState("Horario semanal");

  const toggleDay = (day: string) => {
    setSlots((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Configuración</nav>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Disponibilidad</h1>
          <p className="text-ink-muted mt-1">Definí cuándo aceptás reservas y tus reglas de agenda.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink">
            📋 Copiar semana
          </button>
          <button className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors">
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {["Horario semanal", "Excepciones", "Reglas avanzadas"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? "border-ink text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Weekly grid */}
        <div className="col-span-2 bg-surface border border-border rounded overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-3 border-r border-border" />
            {DAYS.map((day) => (
              <div key={day} className="p-3 border-r border-border last:border-r-0">
                <p className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-1">{day}</p>
                <Toggle checked={slots[day].active} onChange={() => toggleDay(day)} />
                <p className="text-xs text-ink-muted mt-1">{slots[day].active ? "Activo" : "Off"}</p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-8">
            {/* Hours column */}
            <div className="border-r border-border">
              {HOURS.map((h) => (
                <div key={h} className="h-10 border-b border-border/50 flex items-center px-2">
                  <span className="text-xs text-ink-muted">{h}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((day) => (
              <div key={day} className="relative border-r border-border last:border-r-0">
                {HOURS.map((_, i) => (
                  <div key={i} className="h-10 border-b border-border/30" />
                ))}
                {/* Blocks */}
                {slots[day].active &&
                  slots[day].blocks.map((block, bi) => {
                    const top = (block.start - 8) * 40;
                    const height = (block.end - block.start) * 40;
                    return (
                      <div
                        key={bi}
                        className="absolute left-1 right-1 bg-accent/40 border border-accent rounded flex flex-col items-center justify-center cursor-pointer hover:bg-accent/60 transition-colors"
                        style={{ top, height }}
                      >
                        <span className="text-xs font-bold text-ink">
                          {block.start.toString().padStart(2, "0")}:00 —{" "}
                          {block.end.toString().padStart(2, "0")}:00
                        </span>
                        <span className="text-xs text-ink-muted">{block.label}</span>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>

          {/* Exceptions count */}
          <div className="p-3 border-t border-border bg-bg">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wide">
              EXCEPCIONES · 4
            </span>
          </div>
        </div>

        {/* Rules */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Reglas de la agenda</h3>
            <div className="space-y-4">
              {[
                { label: "Duración mínima de aviso", sub: "¿Con cuánta anticipación pueden reservar?", value: "24 horas" },
                { label: "Buffer entre sesiones", sub: "Margen automático para preparar la siguiente", value: "15 min" },
                { label: "Pausa para almorzar", sub: "13:00 a 14:00", value: "Activa" },
                { label: "Reservas anticipadas", sub: "Máximo en el futuro", value: "60 días" },
                { label: "Política de cancelación", sub: "Tiempo mínimo sin cargo", value: "24 horas" },
              ].map((rule) => (
                <div key={rule.label} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{rule.label}</p>
                    <p className="text-xs text-ink-muted">{rule.sub}</p>
                  </div>
                  <select className="text-xs border border-border rounded px-2 py-1.5 bg-bg text-ink font-semibold shrink-0">
                    <option>{rule.value}</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4 space-y-3">
              {[
                { label: "Aceptación automática", checked: true },
                { label: "Permitir reservas en feriados", checked: false },
                { label: "Mostrar slots en hora completa", checked: true },
              ].map((opt) => (
                <div key={opt.label} className="flex items-center justify-between">
                  <span className="text-sm text-ink">{opt.label}</span>
                  <Toggle checked={opt.checked} onChange={() => {}} />
                </div>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-accent border border-accent/50 rounded p-4">
            <p className="text-sm font-bold text-ink mb-1">El sistema evita conflictos</p>
            <p className="text-xs text-ink">
              Si dos servicios se superponen, solo uno se ofrece como disponible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
