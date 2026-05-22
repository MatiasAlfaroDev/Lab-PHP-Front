import { useState } from "react";
import { Link } from "react-router";

const professionals = [
  {
    id: 1,
    initials: "MO",
    name: "María Ortiz",
    specialty: "Psicología clínica",
    rating: 4.9,
    reviews: 234,
    modalities: ["Presencial", "Virtual"],
    next: "Hoy 16:30",
    price: 48,
    top: true,
    color: "from-orange-200 to-rose-200",
    avatarColor: "bg-violet-400",
  },
  {
    id: 2,
    initials: "AC",
    name: "Andrés Calleja",
    specialty: "Entrenamiento personalizado",
    rating: 4.7,
    reviews: 88,
    modalities: ["Presencial", "Híbrida"],
    next: "Mañana 09:00",
    price: 35,
    top: false,
    color: "from-orange-100 to-amber-100",
    avatarColor: "bg-orange-400",
  },
  {
    id: 3,
    initials: "LS",
    name: "Liana Souza",
    specialty: "Nutrición · Asesoría",
    rating: 5.0,
    reviews: 56,
    modalities: ["Virtual"],
    next: "Jueves 11:00",
    price: 42,
    top: true,
    color: "from-teal-100 to-green-100",
    avatarColor: "bg-teal-500",
  },
  {
    id: 4,
    initials: "TR",
    name: "Tomás Riveiro",
    specialty: "Coaching ejecutivo",
    rating: 4.8,
    reviews: 142,
    modalities: ["Virtual", "Híbrida"],
    next: "Hoy 18:00",
    price: 80,
    top: false,
    color: "from-purple-100 to-violet-100",
    avatarColor: "bg-purple-500",
  },
  {
    id: 5,
    initials: "NA",
    name: "Nora Aguilar",
    specialty: "Fisioterapia",
    rating: 4.6,
    reviews: 73,
    modalities: ["Presencial"],
    next: "Sáb 10:30",
    price: 55,
    top: false,
    color: "from-pink-100 to-rose-100",
    avatarColor: "bg-pink-500",
  },
  {
    id: 6,
    initials: "JM",
    name: "Julián Marín",
    specialty: "Asesoría financiera",
    rating: 4.9,
    reviews: 31,
    modalities: ["Virtual"],
    next: "Mañana 14:00",
    price: 95,
    top: true,
    color: "from-sky-100 to-blue-100",
    avatarColor: "bg-blue-500",
  },
];

const serviceTypes = [
  { label: "Salud y bienestar", count: 42, key: "salud" },
  { label: "Consultoría", count: 28, key: "consultoria" },
  { label: "Entrenamiento", count: 17, key: "entrenamiento" },
  { label: "Educación", count: 24, key: "educacion" },
  { label: "Servicios técnicos", count: 13, key: "tecnicos" },
];

const modalities = ["Todas", "Presencial", "Virtual", "Híbrida"];

export default function Discover() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["salud", "consultoria"]);
  const [selectedModality, setSelectedModality] = useState("Todas");
  const [priceRange, setPriceRange] = useState(120);
  const [minRating, setMinRating] = useState(4);
  const [availability, setAvailability] = useState("Esta semana");

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Filters sidebar */}
      <aside className="w-64 bg-surface border-r border-border overflow-y-auto p-5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wide">Filtros</h3>
          <button className="text-xs text-primary underline">Limpiar</button>
        </div>

        {/* Service type */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Tipo de servicio
          </p>
          <div className="space-y-2">
            {serviceTypes.map(({ label, count, key }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(key)}
                  onChange={() => toggleType(key)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-ink flex-1">{label}</span>
                <span className="text-xs text-ink-muted">{count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Modality */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Modalidad
          </p>
          <div className="flex flex-wrap gap-1.5">
            {modalities.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModality(m)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedModality === m
                    ? "bg-ink text-white border-ink"
                    : "border-border text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Precio por sesión
          </p>
          <input
            type="range"
            min={20}
            max={150}
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-ink-muted mt-1">
            <span>€20</span>
            <span>€{priceRange}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Calificación mínima
          </p>
          <div className="flex gap-1.5">
            {[5, 4, 3].map((r) => (
              <button
                key={r}
                onClick={() => setMinRating(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  minRating === r
                    ? "bg-ink text-white border-ink"
                    : "border-border text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                ★ {r}+
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Disponibilidad
          </p>
          <div className="space-y-2">
            {["Hoy", "Esta semana", "Próximos 30 días"].map((a) => (
              <label key={a} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  checked={availability === a}
                  onChange={() => setAvailability(a)}
                  className="accent-primary"
                />
                <span className="text-sm text-ink">{a}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Ubicación
          </p>
          <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-bg">
            <span className="text-ink-muted text-sm">📍</span>
            <input
              className="flex-1 bg-transparent text-sm text-ink placeholder-ink-muted outline-none"
              placeholder="Palermo, CABA"
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display italic text-3xl text-ink mb-1">
              Encontrá a tu profesional
            </h1>
            <p className="text-ink-muted text-sm">124 profesionales disponibles esta semana</p>
          </div>
          <button className="relative p-2 rounded-xl border border-border bg-surface hover:bg-bg">
            <BellIcon />
          </button>
        </div>

        {/* Active filters + view toggle */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {selectedTypes.includes("salud") && (
            <span className="flex items-center gap-1 text-xs bg-primary-soft text-primary px-3 py-1 rounded-full font-medium">
              ✓ Salud y bienestar
            </span>
          )}
          {selectedTypes.includes("consultoria") && (
            <span className="flex items-center gap-1 text-xs bg-primary-soft text-primary px-3 py-1 rounded-full font-medium">
              ✓ Consultoría
            </span>
          )}
          <span className="text-xs bg-bg border border-border text-ink-muted px-3 py-1 rounded-full">
            ★ {minRating}+ estrellas
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button className="text-sm text-ink px-3 py-1.5 rounded-lg border border-border bg-surface font-medium">
              Grilla
            </button>
            <button className="text-sm text-ink-muted px-3 py-1.5 rounded-lg hover:bg-bg">Lista</button>
            <button className="text-sm text-ink-muted px-3 py-1.5 rounded-lg hover:bg-bg">Mapa</button>
            <span className="text-ink-muted">|</span>
            <span className="text-sm text-ink-muted">
              Ordenar: <strong className="text-ink">Mejor valorados</strong>
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {professionals.map((pro) => (
            <Link key={pro.id} to={`/client/professional/${pro.id}`}>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                {/* Cover */}
                <div className={`h-28 bg-gradient-to-br ${pro.color} relative`}>
                  {pro.top && (
                    <span className="absolute top-3 left-3 text-xs bg-ink text-white px-2.5 py-1 rounded-full font-medium">
                      ★ Top valorado
                    </span>
                  )}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink-muted hover:text-accent transition-colors">
                    ♡
                  </button>
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-full ${pro.avatarColor} flex items-center justify-center text-white text-xs font-semibold shrink-0 -mt-7 border-2 border-white`}
                    >
                      {pro.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{pro.name}</p>
                      <p className="text-xs text-ink-muted">{pro.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs text-amber-500">★★★★★</span>
                    <span className="text-xs text-ink font-medium">{pro.rating}</span>
                    <span className="text-xs text-ink-muted">({pro.reviews})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pro.modalities.map((m) => (
                      <span
                        key={m}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          m === "Virtual"
                            ? "border-primary/30 text-primary bg-primary-soft/40"
                            : m === "Presencial"
                            ? "border-border text-ink-muted bg-bg"
                            : "border-border text-ink-muted bg-bg"
                        }`}
                      >
                        {m === "Virtual" ? "⬜ " : "📍 "}
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-ink-muted">Próximo</p>
                      <p className="text-sm font-medium text-ink">{pro.next}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink-muted">desde</p>
                      <p className="text-lg font-bold text-ink">€{pro.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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
