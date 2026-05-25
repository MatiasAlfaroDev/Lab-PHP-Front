import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { api } from "~/lib/api";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": React.HTMLAttributes<HTMLElement> & {
        name?: string;
        size?: string;
      };
    }
  }
}

interface Profesional {
  user_id: number;
  descripcion: string | null;
  ubicacion: string | null;
}

interface Servicio {
  servicio_id: number;
  profesional_id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  precio: string | number;
  duracion: number;
  pausa: number;
  modalidad: string;
  profesional: Profesional | null;
}

interface ApiResponse {
  success: boolean;
  data: Servicio[];
}

const CARD_COLORS = [
  { bg: "from-orange-200 to-rose-200", avatar: "bg-violet-400" },
  { bg: "from-orange-100 to-amber-100", avatar: "bg-orange-400" },
  { bg: "from-teal-100 to-green-100", avatar: "bg-teal-500" },
  { bg: "from-purple-100 to-violet-100", avatar: "bg-purple-500" },
  { bg: "from-pink-100 to-rose-100", avatar: "bg-pink-500" },
  { bg: "from-sky-100 to-blue-100", avatar: "bg-blue-500" },
];

const MODALITIES = ["Todas", "Presencial", "Virtual", "Híbrida"];

function getCardColors(id: number) {
  return CARD_COLORS[id % CARD_COLORS.length];
}

function getInitials(text: string): string {
  return text
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeModality(m: string): string {
  const map: Record<string, string> = {
    presencial: "Presencial",
    virtual: "Virtual",
    hibrida: "Híbrida",
    híbrida: "Híbrida",
  };
  return map[m.toLowerCase()] ?? m;
}

export default function Discover() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedModality, setSelectedModality] = useState("Todas");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceRange, setPriceRange] = useState(1000);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse>("/servicios")
      .then((res) => {
        if (res.success) {
          setServicios(res.data);
          setSelectedTypes([...new Set(res.data.map((s) => s.tipo))]);
          const max = Math.max(...res.data.map((s) => Number(s.precio)), 100);
          const roundedMax = Math.ceil(max / 100) * 100;
          setMaxPrice(roundedMax);
          setPriceRange(roundedMax);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const serviceTypes = [...new Set(servicios.map((s) => s.tipo))].map((tipo) => ({
    label: tipo,
    count: servicios.filter((s) => s.tipo === tipo).length,
    key: tipo,
  }));

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const filtered = servicios.filter((s) => {
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(s.tipo);
    const modalityMatch =
      selectedModality === "Todas" ||
      normalizeModality(s.modalidad) === selectedModality;
    const priceMatch = Number(s.precio) <= priceRange;
    return typeMatch && modalityMatch && priceMatch;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Filters sidebar */}
      <aside
        className={`${
          filtersOpen ? "w-64" : "w-10"
        } bg-surface border-r border-border overflow-hidden shrink-0 transition-all duration-200 ease-in-out flex flex-col`}
      >
        {filtersOpen ? (
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between p-5 pb-4">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wide">
                Filtros
              </h3>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs text-primary underline"
                  onClick={() => {
                    setSelectedTypes(serviceTypes.map((t) => t.key));
                    setSelectedModality("Todas");
                    setPriceRange(maxPrice);
                  }}
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  title="Contraer filtros"
                  className="text-ink-muted hover:text-ink p-1 rounded transition-colors"
                >
                  <ChevronLeftIcon />
                </button>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-5 flex-1">
              {/* Service type */}
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                  Tipo de servicio
                </p>
                {loading ? (
                  <p className="text-xs text-ink-muted">Cargando...</p>
                ) : serviceTypes.length === 0 ? (
                  <p className="text-xs text-ink-muted">Sin tipos disponibles</p>
                ) : (
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
                )}
              </div>

              {/* Modality */}
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                  Modalidad
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MODALITIES.map((m) => (
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
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                  Precio por sesión
                </p>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-ink-muted mt-1">
                  <span>$ 0</span>
                  <span>$ {priceRange}</span>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                  Ubicación
                </p>
                <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-bg">
                  <ion-icon
                    name="location-outline"
                    style={{ fontSize: "16px", color: "var(--color-ink-muted)" }}
                  />
                  <input
                    className="flex-1 bg-transparent text-sm text-ink placeholder-ink-muted outline-none"
                    placeholder="Ciudad o zona..."
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center pt-4 gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              title="Expandir filtros"
              className="text-ink-muted hover:text-ink p-1 rounded transition-colors"
            >
              <ChevronRightIcon />
            </button>
            <div
              className="text-xs font-semibold text-ink-muted uppercase tracking-widest"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Filtros
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display italic text-3xl text-ink mb-1">
              Encontrá a tu profesional
            </h1>
            <p className="text-ink-muted text-sm">
              {loading
                ? "Cargando servicios..."
                : `${filtered.length} servicio${filtered.length !== 1 ? "s" : ""} disponible${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button className="relative p-2 rounded-xl border border-border bg-surface hover:bg-bg">
            <ion-icon name="notifications-outline" style={{ fontSize: "18px" }} />
          </button>
        </div>

        {/* Active filters + view toggle */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {selectedTypes.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 text-xs bg-primary-soft text-primary px-3 py-1 rounded-full font-medium"
            >
              <ion-icon name="checkmark-outline" style={{ fontSize: "12px" }} />
              {t}
            </span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button className="text-sm text-ink px-3 py-1.5 rounded-lg border border-border bg-surface font-medium">
              Grilla
            </button>
            <button className="text-sm text-ink-muted px-3 py-1.5 rounded-lg hover:bg-bg">
              Lista
            </button>
            <span className="text-ink-muted">|</span>
            <span className="text-sm text-ink-muted">
              Ordenar: <strong className="text-ink">Precio</strong>
            </span>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ion-icon
              name="cloud-offline-outline"
              style={{ fontSize: "40px", color: "var(--color-ink-muted)", marginBottom: "8px" }}
            />
            <p className="text-ink-muted mb-1">No se pudo cargar los servicios.</p>
            <p className="text-xs text-ink-muted/60">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-28 bg-border/50" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-border/50 rounded w-2/3" />
                  <div className="h-3 bg-border/50 rounded w-1/2" />
                  <div className="h-3 bg-border/50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ion-icon
              name="search-outline"
              style={{ fontSize: "40px", color: "var(--color-ink-muted)", marginBottom: "8px" }}
            />
            <p className="text-ink-muted">No hay servicios que coincidan con los filtros.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((servicio) => {
              const colors = getCardColors(servicio.servicio_id);
              const initials = getInitials(servicio.nombre);
              const modalityLabel = normalizeModality(servicio.modalidad);

              return (
                <div
                  key={servicio.servicio_id}
                  onClick={() => navigate(`/client/professional/${servicio.profesional_id}`)}
                  className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Cover */}
                  <div className={`h-28 bg-gradient-to-br ${colors.bg} relative`}>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink-muted hover:text-accent transition-colors"
                    >
                      <ion-icon name="heart-outline" style={{ fontSize: "16px" }} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-9 h-9 rounded-full ${colors.avatar} flex items-center justify-center text-white text-xs font-semibold shrink-0 -mt-7 border-2 border-white`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{servicio.nombre}</p>
                        <p className="text-xs text-ink-muted">{servicio.tipo}</p>
                      </div>
                    </div>

                    {servicio.descripcion && (
                      <p className="text-xs text-ink-muted mb-3 line-clamp-2">
                        {servicio.descripcion}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                          modalityLabel === "Virtual"
                            ? "border-primary/30 text-primary bg-primary-soft/40"
                            : "border-border text-ink-muted bg-bg"
                        }`}
                      >
                        <ion-icon
                          name={
                            modalityLabel === "Virtual"
                              ? "desktop-outline"
                              : "location-outline"
                          }
                          style={{ fontSize: "12px" }}
                        />
                        {modalityLabel}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border text-ink-muted bg-bg">
                        <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                        {servicio.duracion} min
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      {servicio.profesional?.ubicacion ? (
                        <div className="flex items-center gap-1">
                          <ion-icon
                            name="location-outline"
                            style={{ fontSize: "13px", color: "var(--color-ink-muted)" }}
                          />
                          <p className="text-sm font-medium text-ink">
                            {servicio.profesional.ubicacion}
                          </p>
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="text-right">
                        <p className="text-xs text-ink-muted">desde</p>
                        <p className="text-lg font-bold text-ink">
                          $ {Number(servicio.precio).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
