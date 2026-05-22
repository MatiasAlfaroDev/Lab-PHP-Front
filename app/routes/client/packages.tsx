const activePackages = [
  {
    id: 1,
    initials: "MO",
    name: "María Ortiz",
    title: "Paquete 8 sesiones",
    used: 5,
    total: 8,
    expires: "12 ago 2026",
    paid: 320,
    color: "bg-violet-500",
  },
];

const availablePackages = [
  { sessions: 4, discount: 5, price: 180, perSession: 45 },
  { sessions: 8, discount: 12, price: 320, perSession: 40, popular: true },
  { sessions: 12, discount: 20, price: 460, perSession: 38 },
];

export default function Packages() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-6">Mis paquetes</h1>

      {/* Active */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">ACTIVOS</h2>
        {activePackages.map((p) => (
          <div key={p.id} className="bg-surface border border-border rounded p-6 flex items-center gap-6">
            <div className={`w-14 h-14 rounded-lg ${p.color} flex items-center justify-center text-white font-bold text-lg`}>
              {p.initials}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl text-ink mb-1">{p.title} · {p.name}</h3>
              <div className="flex items-center gap-4 text-sm text-ink-muted mb-3">
                <span>Vence {p.expires}</span>
                <span>€{p.paid} · pagado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-border rounded-full">
                  <div
                    className="h-full bg-ink rounded-full"
                    style={{ width: `${((p.total - p.used) / p.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-ink whitespace-nowrap">
                  {p.total - p.used} de {p.total} sesiones restantes
                </span>
              </div>
            </div>
            <span className="badge badge-confirmada">ACTIVO</span>
          </div>
        ))}
      </section>

      {/* Buy new */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest">COMPRAR PAQUETE</h2>
          <span className="text-xs text-ink-muted">Hasta 20% off en sesiones múltiples</span>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {availablePackages.map((p) => (
            <div
              key={p.sessions}
              className={`rounded border p-5 ${p.popular ? "border-ink bg-surface shadow-md" : "border-border bg-surface"}`}
            >
              {p.popular && (
                <span className="text-xs font-bold bg-ink text-white px-2 py-0.5 rounded mb-3 inline-block">
                  MÁS POPULAR
                </span>
              )}
              <span className="text-xs font-bold bg-accent text-ink px-2 py-0.5 rounded mb-2 inline-block">
                −{p.discount}%
              </span>
              <h3 className="font-display text-3xl text-ink mb-1">{p.sessions} sesiones</h3>
              <p className="text-xs text-ink-muted mb-3">Sesión individual</p>
              <p className="font-display text-4xl text-ink font-bold mb-1">€{p.price}</p>
              <p className="text-xs text-ink-muted mb-4">€{p.perSession} por sesión</p>
              <button className="w-full bg-ink text-white py-2.5 rounded hover:bg-primary font-semibold text-sm transition-colors">
                Comprar →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
