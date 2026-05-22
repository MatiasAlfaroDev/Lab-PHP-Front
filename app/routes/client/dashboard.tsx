import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";

const upcomingBookings = [
  {
    id: 1,
    date: "MAY",
    day: "20",
    initials: "MO",
    name: "María Ortiz",
    status: "Confirmada",
    statusKey: "confirmada",
    detail: "Sesión individual · 16:30 · 50 min · Virtual",
  },
  {
    id: 2,
    date: "MAY",
    day: "24",
    initials: "AC",
    name: "Andrés Calleja",
    status: "Pagada",
    statusKey: "pagada",
    detail: "Entrenamiento personalizado · Lun 09:00 · 60 min · Presencial",
  },
  {
    id: 3,
    date: "MAY",
    day: "28",
    initials: "LS",
    name: "Liana Souza",
    status: "Pendiente",
    statusKey: "pendiente",
    detail: "Asesoría nutricional · Vie 11:00 · 45 min · Virtual",
  },
];

const badgeClass: Record<string, string> = {
  confirmada: "badge-confirmada",
  pendiente: "badge-pendiente",
  pagada: "badge-pagada",
};

const avatarColors: Record<string, string> = {
  MO: "bg-violet-400",
  AC: "bg-orange-400",
  LS: "bg-teal-500",
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "Lucía";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display italic text-3xl text-ink">Hola, {firstName}</h1>
          <p className="text-ink-muted mt-1">Tenés 2 reservas próximas y 1 paquete activo.</p>
        </div>
        <Link
          to="/client/discover"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          + Nueva reserva
        </Link>
      </div>

      {/* Upcoming session banner */}
      <div className="bg-primary-soft rounded-2xl p-6 mb-8 flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            Hoy · en 2h 14min
          </span>
          <h2 className="font-display italic text-2xl text-ink mb-2">
            Sesión con María Ortiz
          </h2>
          <div className="flex items-center gap-4 text-sm text-ink-muted">
            <span>16:30 — 17:20</span>
            <span>Virtual</span>
            <span>Paquete · sesión 5/8</span>
          </div>
          <div className="flex gap-3 mt-4">
            <Link
              to="/session/1"
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              Entrar a la sesión
            </Link>
            <button className="text-sm font-medium text-ink border border-border bg-white hover:bg-bg px-4 py-2 rounded-xl transition-colors">
              Reprogramar
            </button>
          </div>
        </div>
        <div
          className="w-40 h-28 rounded-xl opacity-60 shrink-0 hidden md:block"
          style={{ background: "linear-gradient(135deg, #e07055, #c8ddd2)" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display italic text-xl text-ink">Próximas reservas</h3>
            <div className="flex gap-1">
              {["Próximas", "Pasadas", "Canceladas"].map((tab) => (
                <button
                  key={tab}
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    tab === "Próximas"
                      ? "bg-surface border border-border text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="text-center min-w-10">
                  <p className="text-xs text-ink-muted uppercase font-medium">{b.date}</p>
                  <p className="font-display italic text-2xl text-ink">{b.day}</p>
                </div>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${
                    avatarColors[b.initials] ?? "bg-primary"
                  }`}
                >
                  {b.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-ink">{b.name}</span>
                    <span className={`badge ${badgeClass[b.statusKey]}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-ink-muted truncate">{b.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-primary font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-bg transition-colors">
                    Ver
                  </button>
                  <button className="text-ink-muted hover:text-ink">
                    <DotsIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Packages sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display italic text-xl text-ink">Paquetes</h3>
            <Link to="/client/packages" className="text-sm text-primary underline">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {/* Active package */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
                <PackageIcon />
                Activo
              </div>
              <p className="font-display italic text-lg text-ink mb-3">
                Paquete 8 sesiones · M. Ortiz
              </p>
              <p className="text-ink-muted text-sm mb-2">
                <span className="text-3xl font-bold text-ink">5</span> de 8 sesiones restantes
              </p>
              <div className="h-1.5 bg-border rounded-full mb-3">
                <div className="h-full bg-primary rounded-full" style={{ width: "62.5%" }} />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Vence 12 ago 2026</span>
                <span>€320 · pagado</span>
              </div>
            </div>

            {/* Buy package */}
            <Link
              to="/client/packages"
              className="flex items-center gap-3 bg-surface border border-dashed border-border rounded-2xl p-4 hover:bg-bg transition-colors"
            >
              <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-ink-muted text-lg">
                +
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Comprar paquete</p>
                <p className="text-xs text-ink-muted">Hasta 20% off en sesiones múltiples</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}
