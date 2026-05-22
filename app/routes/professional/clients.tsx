const clients = [
  { initials: "LP", name: "Lucía Pérez", email: "lucia@gmail.com", sessions: 14, nextSession: "Hoy 16:30", status: "Activa", color: "bg-violet-500" },
  { initials: "CR", name: "Carlos Ruiz", email: "carlos@gmail.com", sessions: 3, nextSession: "Mañana 10:30", status: "Activa", color: "bg-purple-400" },
  { initials: "ML", name: "Marta López", email: "marta@gmail.com", sessions: 8, nextSession: "Hoy 12:00", status: "En sesión", color: "bg-orange-400" },
  { initials: "JV", name: "Joaquín Vega", email: "jv@gmail.com", sessions: 5, nextSession: "Hoy 14:00", status: "Activa", color: "bg-teal-500" },
  { initials: "SM", name: "Sol Méndez", email: "sol@gmail.com", sessions: 2, nextSession: "Hoy 15:00", status: "Activa", color: "bg-amber-500" },
];

export default function Clients() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Clientes</h1>
          <p className="text-ink-muted mt-1">{clients.length} clientes activos</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="border border-border rounded px-4 py-2 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink w-56"
            placeholder="Buscar cliente..."
          />
          <button className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors">
            + Agregar cliente
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
          {["CLIENTE", "EMAIL", "SESIONES", "PRÓXIMA SESIÓN", "ESTADO", ""].map((h, i) => (
            <div
              key={i}
              className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${
                i === 0 ? "col-span-3" : i === 1 ? "col-span-3" : i === 2 ? "col-span-1" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-1"
              }`}
            >
              {h}
            </div>
          ))}
        </div>

        {clients.map((c) => (
          <div key={c.name} className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors">
            <div className="col-span-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {c.initials}
              </div>
              <span className="text-sm font-semibold text-ink">{c.name}</span>
            </div>
            <div className="col-span-3">
              <span className="text-sm text-ink-muted">{c.email}</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-semibold text-ink">{c.sessions}</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-ink">{c.nextSession}</span>
            </div>
            <div className="col-span-2">
              <span className={`badge ${c.status === "En sesión" ? "badge-en-vivo" : "badge-confirmada"}`}>
                {c.status.toUpperCase()}
              </span>
            </div>
            <div className="col-span-1 flex items-center gap-2">
              <button className="text-ink-muted hover:text-ink p-1">›</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
