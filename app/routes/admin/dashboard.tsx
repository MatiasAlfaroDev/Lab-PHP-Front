const kpis = [
  { label: "USUARIOS TOTALES", value: "14.328", delta: "+3.2%", sub: "↑ 442 esta semana" },
  { label: "PROFESIONALES ACTIVOS", value: "2.187", delta: "+18", sub: "91% verificados" },
  { label: "RESERVAS (MES)", value: "38.412", delta: "+11%", sub: "€1.84M en GMV" },
  { label: "TASA DE CANCELACIÓN", value: "4.2%", delta: "-0.6%", sub: "bajo el target de 5%" },
  { label: "REPORTES ABIERTOS", value: "3", delta: "−2", sub: "2 alta prioridad" },
];

const recentActivity = [
  { time: "09:42", text: "Pedro Yáñez creó cuenta de profesional", status: "PENDIENTE VERIFICACIÓN", cls: "badge badge-pendiente" },
  { time: "09:38", text: "Carolina A. reportó a Roberto M. por no presentarse", status: "ALTA PRIORIDAD", cls: "badge badge-cancelada" },
  { time: "09:21", text: "Sistema liquidó €38.420 a 142 profesionales", status: "PROCESADO", cls: "badge badge-confirmada" },
  { time: "09:14", text: "Tomás Riveiro editó su perfil y agregó 2 servicios", status: "OK", cls: "text-xs text-ink-muted font-semibold" },
];

const pending = [
  { initials: "PY", name: "Pedro Yáñez", sub: "Consultoría legal · Hoy 09:42", dot: false, color: "bg-orange-500" },
  { initials: "SM", name: "Sofía Mendiluce", sub: "Coaching · Ayer", dot: true, color: "bg-purple-500" },
  { initials: "LC", name: "Luis Carmona", sub: "Fisioterapia · Hace 2 días", dot: false, color: "bg-teal-500" },
];

const categories = [
  { name: "Salud y bienestar", count: 842 },
  { name: "Consultoría", count: 487 },
  { name: "Entrenamiento", count: 364 },
  { name: "Educación", count: 268 },
  { name: "Otros", count: 226 },
];

const maxCat = 842;

const barData = Array.from({ length: 30 }, (_, i) => ({
  confirmed: Math.floor(80 + Math.random() * 120),
  paid: Math.floor(70 + Math.random() * 110),
  cancelled: Math.floor(5 + Math.random() * 15),
}));

export default function AdminDashboard() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Panel administrativo</h1>
          <p className="text-ink-muted mt-1">Última actualización: hace 2 min · 1.247 usuarios activos hoy</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-border rounded bg-surface px-4 py-2">
            <span className="text-ink-muted text-sm">🔍</span>
            <input className="bg-transparent text-sm text-ink placeholder-ink-muted outline-none w-52" placeholder="Buscar usuarios, reservas..." />
          </div>
          <button className="relative p-2 border border-border rounded bg-surface hover:bg-bg">
            🔔
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold">3</span>
          </button>
          <button className="border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink">Exportar</button>
          <button className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors">Reporte mensual</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border border-border rounded p-4">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">{k.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl text-ink font-bold">{k.value}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${k.delta.startsWith("-") ? "bg-red-100 text-red-700" : "bg-accent text-ink"}`}>
                {k.delta}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 bg-surface border border-border rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl text-ink">Volumen de reservas</h2>
              <p className="text-xs text-ink-muted">Últimos 30 días · todas las modalidades</p>
            </div>
            <div className="flex gap-1">
              {["7d", "30d", "90d", "YTD"].map((v) => (
                <button key={v} className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors ${v === "30d" ? "bg-ink text-white" : "border border-border text-ink-muted hover:bg-bg"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div className="h-48 flex items-end gap-0.5">
            {barData.map((d, i) => {
              const total = d.confirmed + d.paid + d.cancelled;
              const max = 250;
              const h = (total / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5" style={{ height: `${h}%` }}>
                  <div className="bg-red-400" style={{ height: `${(d.cancelled / total) * 100}%`, minHeight: 2 }} />
                  <div className="bg-accent" style={{ height: `${(d.paid / total) * 100}%` }} />
                  <div className="bg-ink" style={{ height: `${(d.confirmed / total) * 100}%` }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-ink rounded-sm" />Confirmadas 34.812</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-accent rounded-sm" />Pagadas 32.144</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-sm" />Canceladas 1.612</span>
          </div>

          {/* Recent activity */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">ACTIVIDAD RECIENTE DEL SISTEMA</p>
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="text-ink-muted w-12 shrink-0">{a.time}</span>
                  <span className="text-ink flex-1">{a.text}</span>
                  <span className={a.cls}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Pending verifications */}
          <div className="bg-surface border border-border rounded p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-ink">Verificaciones pendientes</h3>
              <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-ink text-sm font-bold">7</span>
            </div>
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.name} className="flex items-center gap-3 hover:bg-bg rounded p-2 -mx-2 cursor-pointer transition-colors">
                  <div className={`w-9 h-9 rounded-lg ${p.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{p.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-ink">{p.name}</p>
                      {p.dot && <span className="w-2 h-2 rounded-full bg-red-500" />}
                    </div>
                    <p className="text-xs text-ink-muted">{p.sub}</p>
                  </div>
                  <span className="text-ink-muted">›</span>
                </div>
              ))}
            </div>
            <button className="w-full text-sm text-ink-muted font-semibold text-center mt-3 hover:text-ink transition-colors">
              Ver todos →
            </button>
          </div>

          {/* Top categories */}
          <div className="bg-surface border border-border rounded p-5">
            <h3 className="font-display text-lg text-ink mb-4">Top categorías</h3>
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink">{c.name}</span>
                    <span className="text-sm font-semibold text-ink">{c.count}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full">
                    <div className="h-full bg-ink rounded-full" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System status */}
          <div className="bg-surface border border-border rounded p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Estado del sistema</span>
            <span className="badge badge-confirmada">OPERATIVO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
