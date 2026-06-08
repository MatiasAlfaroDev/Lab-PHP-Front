const users = [
  { initials: "LP", name: "Lucía Pérez", email: "lucia@gmail.com", role: "Cliente", sessions: 14, joined: "15 mar 2026", status: "activo", color: "bg-violet-500" },
  { initials: "MO", name: "María Ortiz", email: "maria.ortiz@cita.pro", role: "Profesional", sessions: 234, joined: "10 ene 2025", status: "verificado", color: "bg-orange-400" },
  { initials: "PY", name: "Pedro Yáñez", email: "pedro@gmail.com", role: "Profesional", sessions: 0, joined: "hoy", status: "pendiente", color: "bg-teal-500" },
  { initials: "CR", name: "Carlos Ruiz", email: "carlos@gmail.com", role: "Cliente", sessions: 3, joined: "20 abr 2026", status: "activo", color: "bg-purple-400" },
];

const badgeCls: Record<string, string> = {
  activo: "badge badge-confirmada",
  verificado: "badge badge-pagada",
  pendiente: "badge badge-pendiente",
};

export default function AdminUsers() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Usuarios</h1>
          <p className="text-ink-muted mt-1">14.328 usuarios totales</p>
        </div>
        <div className="flex items-center gap-3">
          <input className="border border-border rounded px-4 py-2 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink w-56" placeholder="Buscar usuario..." />
          <select className="border border-border rounded px-4 py-2 text-sm bg-surface text-ink focus:outline-none">
            <option>Todos los roles</option>
            <option>Cliente</option>
            <option>Profesional</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
          {["USUARIO", "EMAIL", "ROL", "SESIONES", "DESDE", "ESTADO", ""].map((h, i) => (
            <div key={i} className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-3" : i === 1 ? "col-span-3" : i === 2 ? "col-span-1" : i === 3 ? "col-span-1" : i === 4 ? "col-span-2" : i === 5 ? "col-span-1" : "col-span-1"}`}>{h}</div>
          ))}
        </div>
        {users.map((u) => (
          <div key={u.name} className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors">
            <div className="col-span-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${u.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{u.initials}</div>
              <span className="text-sm font-semibold text-ink">{u.name}</span>
            </div>
            <div className="col-span-3"><span className="text-sm text-ink-muted">{u.email}</span></div>
            <div className="col-span-1"><span className="text-xs font-bold text-ink-muted uppercase">{u.role}</span></div>
            <div className="col-span-1"><span className="text-sm text-ink">{u.sessions}</span></div>
            <div className="col-span-2"><span className="text-sm text-ink-muted">{u.joined}</span></div>
            <div className="col-span-1"><span className={badgeCls[u.status]}>{u.status.toUpperCase()}</span></div>
            <div className="col-span-1"><button className="text-ink-muted hover:text-ink p-1">⋯</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
