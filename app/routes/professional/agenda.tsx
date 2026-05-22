export default function Agenda() {
  const hours = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
  const days = ["LUN 19", "MAR 20", "MIÉ 21", "JUE 22", "VIE 23", "SÁB 24", "DOM 25"];

  const events = [
    { day: 1, start: 1, duration: 1, label: "Lucía Pérez", sub: "Sesión individual", color: "bg-accent/50" },
    { day: 1, start: 2.5, duration: 1, label: "Carlos Ruiz", sub: "Primera consulta", color: "bg-primary-soft" },
    { day: 1, start: 4, duration: 1.2, label: "Marta López", sub: "Sesión de pareja", color: "bg-accent/30 border-2 border-accent" },
    { day: 2, start: 1, duration: 1, label: "Joaquín Vega", sub: "Sesión individual", color: "bg-primary-soft" },
    { day: 3, start: 3, duration: 0.5, label: "Sol Méndez", sub: "Seguimiento breve", color: "bg-accent/50" },
    { day: 4, start: 5, duration: 1, label: "Lucía Pérez", sub: "Sesión individual · paquete", color: "bg-accent/30" },
  ];

  const CELL = 48;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-ink">Agenda</h1>
        <div className="flex gap-2">
          {["Día", "Semana", "Mes"].map((v) => (
            <button
              key={v}
              className={`text-sm px-3 py-1.5 rounded font-semibold transition-colors ${
                v === "Semana" ? "bg-ink text-white" : "border border-border text-ink-muted hover:bg-bg"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded overflow-auto">
        {/* Header */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}>
          <div className="p-3 border-r border-border" />
          {days.map((d) => (
            <div key={d} className="p-3 border-r border-border last:border-r-0 text-center">
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wide">{d}</p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative grid" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}>
          {/* Hour labels */}
          <div className="border-r border-border">
            {hours.map((h) => (
              <div key={h} className="border-b border-border/30 flex items-center px-2" style={{ height: CELL }}>
                <span className="text-xs text-ink-muted">{h}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((_, di) => (
            <div key={di} className="relative border-r border-border last:border-r-0">
              {hours.map((_, hi) => (
                <div key={hi} className="border-b border-border/20" style={{ height: CELL }} />
              ))}
              {/* Events */}
              {events
                .filter((e) => e.day === di)
                .map((e, ei) => (
                  <div
                    key={ei}
                    className={`absolute left-1 right-1 ${e.color} rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity`}
                    style={{
                      top: e.start * CELL,
                      height: e.duration * CELL - 2,
                    }}
                  >
                    <p className="text-xs font-bold text-ink truncate">{e.label}</p>
                    <p className="text-xs text-ink-muted truncate">{e.sub}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
