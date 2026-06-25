import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";
import { useCatalogoUpdates } from "~/hooks/useCatalogoUpdates";
import "leaflet/dist/leaflet.css";

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
  latitud?: number;
  longitud?: number;
  direccion?: string;
  profesional: Profesional | null;
  promedio?: number;
  cantidad_calificaciones?: number;
}

interface PackageItem {
  servicio_id: number;
  nombre?: string;
  precio?: number;
  duracion?: number;
  pivot?: { cantidad_sesiones: number };
  cantidad_sesiones?: number;
}

interface Paquete {
  paquete_id: number;
  nombre: string;
  descripcion: string;
  precio_total: number;
  servicios: PackageItem[];
}

const CARD_COLORS = [
  { bg: "from-orange-200 to-rose-200",   avatar: "bg-violet-400" },
  { bg: "from-orange-100 to-amber-100",  avatar: "bg-orange-400" },
  { bg: "from-teal-100 to-green-100",    avatar: "bg-teal-500" },
  { bg: "from-purple-100 to-violet-100", avatar: "bg-purple-500" },
  { bg: "from-pink-100 to-rose-100",     avatar: "bg-pink-500" },
  { bg: "from-sky-100 to-blue-100",      avatar: "bg-blue-500" },
];

const MODALITIES = ["Todas", "Presencial", "Virtual", "Híbrida"];
const MODALITY_PARAM: Record<string, string> = {
  Presencial: "presencial", Virtual: "virtual", Híbrida: "hibrido",
};
const ORDEN_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "alfabetico", label: "Alfabético (A-Z)" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
];

function getCardColors(id: number) { return CARD_COLORS[id % CARD_COLORS.length]; }
function getInitials(text: string) { return text.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(); }
function normalizeModality(m: string) {
  return ({ presencial: "Presencial", virtual: "Virtual", hibrido: "Híbrida", híbrido: "Híbrida" } as Record<string, string>)[m.toLowerCase()] ?? m;
}

export default function Discover() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [servicios, setServicios]               = useState<Servicio[]>([]);
  const [paquetes, setPaquetes]                 = useState<Paquete[]>([]);
  const [loadingSvc, setLoadingSvc]             = useState(true);
  const [loadingPkg, setLoadingPkg]             = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [errorPkg, setErrorPkg]                 = useState<string | null>(null);

  // Opciones de filtro — se derivan una sola vez de la lista completa (sin filtrar)
  const [allTypes, setAllTypes]                 = useState<{ label: string; count: number }[]>([]);
  const [maxPrice, setMaxPrice]                 = useState(1000);

  // Filtros — se envían como query params a GET /servicios
  const [search, setSearch]                     = useState("");
  const [selectedType, setSelectedType]         = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState("Todas");
  const [priceRange, setPriceRange]             = useState(1000);
  const [orden, setOrden]                       = useState("");
  const [filtersOpen, setFiltersOpen]           = useState(false);

  const [buyingPackageId, setBuyingPackageId] = useState<number | null>(null);
  const [searchParams]                          = useSearchParams();
  const center: [number, number] = [-34.9011, -56.1645];
  const [LeafletMap, setLeafletMap] = useState<any>(null);
  const [markerIcon, setMarkerIcon] = useState<any>(null);
  const [catalogVersion, setCatalogVersion] = useState(0);
  useCatalogoUpdates(() => setCatalogVersion((v) => v + 1));

  // El ícono default de Leaflet apunta a rutas relativas a su propio paquete,
  // que se rompen al bundlear para producción — usamos un ícono propio servido
  // desde /public (ruta absoluta, no depende del bundler) con el logo de CitaPro.
  useEffect(() => {
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([reactLeaflet, leaflet]) => {
      setLeafletMap(reactLeaflet);
      const L = leaflet.default ?? leaflet;
      setMarkerIcon(
        L.icon({
          iconUrl: "/icon.svg",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15],
        })
      );
    });
  }, []);

  // Opciones de filtro (tipos + tope de precio) — una sola vez, sin filtros aplicados
  useEffect(() => {
    api
      .get<{ success: boolean; data: Servicio[] }>("/servicios")
      .then((res) => {
        if (!res.success) return;
        const tipos = [...new Set(res.data.map((s) => s.tipo))].map((tipo) => ({
          label: tipo,
          count: res.data.filter((s) => s.tipo === tipo).length,
        }));
        setAllTypes(tipos);
        const max = Math.max(...res.data.map((s) => Number(s.precio)), 100);
        const rounded = Math.ceil(max / 100) * 100;
        setMaxPrice(rounded);
        setPriceRange(rounded);
      })
      .catch(() => {});
  }, []);

  // Paquetes (sin filtros de back — Tarea 2 solo cubre /servicios)
  useEffect(() => {
    api
      .get<Paquete[] | { success: boolean; data: Paquete[] }>("/paquetes", token)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any).data ?? [];
        setPaquetes(list);
      })
      .catch((e) => setErrorPkg(e.message ?? "Error al cargar paquetes"))
      .finally(() => setLoadingPkg(false));
  }, [token, catalogVersion]);

  // Servicios filtrados — debounced, consume los query params de GET /servicios
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoadingSvc(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (selectedType) params.set("tipo", selectedType);
      if (selectedModality !== "Todas") params.set("modalidad", MODALITY_PARAM[selectedModality]);
      if (priceRange < maxPrice) params.set("precio_max", String(priceRange));
      if (orden && orden !== "alfabetico") params.set("orden", orden);

      const qs = params.toString();

      api
        .get<{ success: boolean; data: Servicio[] }>(`/servicios${qs ? `?${qs}` : ""}`, undefined, controller.signal)
        .then((res) => {
          if (res.success) setServicios(res.data);
        })
        .catch((e) => { if (e?.name !== "AbortError") setError(e.message); })
        .finally(() => setLoadingSvc(false));
    }, 350);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, selectedType, selectedModality, priceRange, maxPrice, orden, catalogVersion]);

  const activeTab =
    searchParams.get("tab") === "packages"
      ? "paquetes"
      : "servicios";

  const servicioId = searchParams.get("servicio");
  const compraItemId = searchParams.get("compraItem");

  const filteredSvc = orden === "alfabetico"
    ? [...servicios].sort((a, b) => a.nombre.localeCompare(b.nombre))
    : servicios;
  const filteredPkg = paquetes.filter((p) => Number(p.precio_total) <= priceRange);

  const resetFilters = () => {
    setSearch("");
    setSelectedType(null);
    setSelectedModality("Todas");
    setPriceRange(maxPrice);
    setOrden("");
  };

  const typeDropdown = (
    <div className="flex items-center gap-1.5 shrink-0">
      <label className="text-xs text-ink-muted font-medium">Tipo</label>
      <select
        value={selectedType ?? ""}
        onChange={(e) => setSelectedType(e.target.value || null)}
        disabled={allTypes.length === 0}
        className="text-xs border border-border rounded-full px-3 py-1.5 bg-transparent text-ink cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">Todos</option>
        {allTypes.map(({ label, count }) => (
          <option key={label} value={label}>{label} ({count})</option>
        ))}
      </select>
    </div>
  );

  const modalityChips = MODALITIES.map((m) => (
    <button
      key={m}
      onClick={() => setSelectedModality(m)}
      className={`shrink-0 text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
        selectedModality === m
          ? "bg-ink-fixed text-white border-ink-fixed"
          : "border-border text-ink-muted hover:border-ink hover:text-ink"
      }`}
    >
      {m}
    </button>
  ));

  const activeFiltersCount =
    (selectedType ? 1 : 0) + (selectedModality !== "Todas" ? 1 : 0);

  return (
    <div className="w-full">
      {/* Toolbar de filtros — horizontal en desktop, dropdown en mobile */}
      <div className="border-b border-border">
        {/* Mobile: botón que despliega los filtros, para no apilar varias filas de chips */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-ink border border-border rounded-full pl-3 pr-2.5 py-1.5 cursor-pointer"
          >
            <ion-icon name="options-outline" style={{ fontSize: "15px" }} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-ink-fixed text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ion-icon name={filtersOpen ? "chevron-up-outline" : "chevron-down-outline"} style={{ fontSize: "13px" }} />
          </button>
          <button className="text-xs text-ink  underline cursor-pointer shrink-0" onClick={resetFilters}>
            Limpiar
          </button>
        </div>

        {filtersOpen && (
          <div className="px-4 pb-3 md:hidden space-y-3">
            {typeDropdown}

            <div className="flex flex-wrap items-center gap-2">
              {modalityChips}
            </div>

            {activeTab === "servicios" && (
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="w-full text-sm border border-border rounded-full px-3 py-2 bg-transparent text-ink cursor-pointer"
              >
                {ORDEN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted whitespace-nowrap">hasta $ {priceRange}</span>
              <input
                type="range"
                min={0}
                max={maxPrice}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
            </div>
          </div>
        )}

        {/* Desktop: todo en una fila, coherente con /professional/services */}
        <div className="hidden md:flex md:items-center gap-2 px-6 py-3">
          {typeDropdown}
          <span className="w-px h-5 bg-border shrink-0" />
          {modalityChips}

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {activeTab === "servicios" && (
              <>
                <div className="hidden lg:flex items-center gap-1.5 border border-border rounded-full px-3 py-1.5">
                  <ion-icon name="search-outline" style={{ fontSize: "14px", color: "var(--color-ink-muted)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-32 bg-transparent text-xs text-ink placeholder-ink-muted outline-none"
                    placeholder="Buscar servicios..."
                  />
                </div>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="text-xs border border-border rounded-full px-3 py-1.5 bg-transparent text-ink cursor-pointer"
                >
                  {ORDEN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </>
            )}
            <span className="text-xs text-ink-muted whitespace-nowrap">
              hasta $ {priceRange}
            </span>
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-24 accent-primary"
            />
            <button className="text-xs text-primary underline cursor-pointer shrink-0" onClick={resetFilters}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-display italic text-3xl text-ink mb-1">
              {activeTab === "servicios" ? "Encontrá a tu profesional" : "Paquetes"}
            </h1>
            <p className="text-ink-muted text-sm">
              {activeTab === "servicios"
                ? loadingSvc ? "Cargando servicios..." : `${filteredSvc.length} servicio${filteredSvc.length !== 1 ? "s" : ""} disponible${filteredSvc.length !== 1 ? "s" : ""}`
                : loadingPkg ? "Cargando paquetes..." : `${filteredPkg.length} paquete${filteredPkg.length !== 1 ? "s" : ""} disponible${filteredPkg.length !== 1 ? "s" : ""}`
              }
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {(["servicios", "paquetes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => navigate(`/client/discover?tab=${tab === "paquetes"? "packages" : "services"}`)}
              className={`px-5 py-2.5 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
                activeTab === tab ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── SERVICIOS ── */}
        {activeTab === "servicios" && (
          <>
            {selectedType && (
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="flex items-center gap-1 text-xs bg-primary-soft text-primary px-3 py-1 rounded-full font-medium">
                  <ion-icon name="checkmark-outline" style={{ fontSize: "12px" }} />{selectedType}
                </span>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <ion-icon name="cloud-offline-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
                <p className="text-ink font-medium">No se pudieron cargar los servicios</p>
                <p className="text-sm text-ink-muted">Problema de conexión con el servidor. Intentá de nuevo.</p>
                <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline cursor-pointer">Reintentar</button>
              </div>
            )}

            {loadingSvc && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-28 bg-border/50" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-border/50 rounded w-2/3" />
                      <div className="h-3 bg-border/50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingSvc && !error && filteredSvc.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ion-icon name="search-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)", marginBottom: "8px" }} />
                <p className="text-ink-muted">No hay servicios que coincidan con los filtros.</p>
              </div>
            )}

            {!loadingSvc && !error && filteredSvc.length > 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  {filteredSvc.map((servicio) => {
                    const colors        = getCardColors(servicio.servicio_id);
                    const initials      = getInitials(servicio.nombre);
                    const modalityLabel = normalizeModality(servicio.modalidad);

                    return (
                      <div
                        key={servicio.servicio_id}
                        onClick={() => navigate(`/client/professional/${servicio.profesional_id}`, {state: {servicioId: servicio.servicio_id}})}
                        className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className={`h-28 bg-gradient-to-br ${colors.bg} relative`} />
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3 relative">
                            <div className={`w-9 h-9 rounded-full ${colors.avatar} flex items-center justify-center text-white text-xs font-semibold border-2 border-white`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink">{servicio.nombre}</p>
                              <p className="text-xs text-ink-muted">{servicio.tipo}</p>
                              {servicio.cantidad_calificaciones ? (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="flex items-center gap-0.5 text-accent">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <StarIcon key={i} filled={i < Math.round(servicio.promedio ?? 0)} />
                                      ))}
                                    </span>
                                    <span className="text-xs text-ink-muted">
                                      {servicio.promedio?.toFixed(1)} ({servicio.cantidad_calificaciones})
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-ink-muted mt-1">
                                    Sin reseñas
                                  </p>
                                )}
                            </div>
                          </div>
                          {servicio.descripcion && (
                            <p className="text-xs text-ink-muted mb-3 line-clamp-2">{servicio.descripcion}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${modalityLabel === "Virtual" ? "border-primary/30 text-primary bg-primary-soft/40" : "border-border text-ink-muted bg-bg"}`}>
                              <ion-icon name={modalityLabel === "Virtual" ? "desktop-outline" : "location-outline"} style={{ fontSize: "12px" }} />
                              {modalityLabel}
                            </span>
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border text-ink-muted bg-bg">
                              <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                              {servicio.duracion} min
                            </span>
                          </div>
                          <div className="flex items-end justify-between">
                            {servicio.direccion ? (
                              <div className="flex items-center gap-1">
                                <ion-icon name="location-outline" style={{ fontSize: "13px", color: "var(--color-ink-muted)" }} />
                                <p className="text-sm font-medium text-ink">{servicio.direccion
                                  ?.split(",")
                                  .map(p => p.trim())
                                  .slice(0, 3)
                                  .reduce((acc, _, i, arr) => {
                                    const [num, calle, ciudad] = arr;
                                    return `${calle} ${num}, ${ciudad}`;
                                  }, "")}</p>
                              </div>
                            ) : <div />}
                            <div className="text-right">
                              <p className="text-xs text-ink-muted">desde</p>
                              <p className="text-lg font-bold text-ink">$ {Number(servicio.precio).toFixed(0)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">
                    Servicios en el mapa
                  </h2>

                  {LeafletMap && markerIcon && (
                    <LeafletMap.MapContainer
                      center={center}
                      zoom={7}
                      style={{ height: "500px", width: "100%" }}
                    >
                      <LeafletMap.TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <LeafletMap.Marker position={[-34.9011, -56.1645]} icon={markerIcon}>
                        <LeafletMap.Popup>
                          Montevideo
                        </LeafletMap.Popup>
                      </LeafletMap.Marker>

                      {filteredSvc
                        .filter((s) => s.latitud && s.longitud)
                        .map((servicio) => (
                          <LeafletMap.Marker
                            key={servicio.servicio_id}
                            position={[
                              servicio.latitud!,
                              servicio.longitud!,
                            ]}
                            icon={markerIcon}
                          >
                            <LeafletMap.Popup>
                              <div className="min-w-[180px]">
                                <strong>{servicio.nombre}</strong>
                                <br />
                                ${servicio.precio}
                                <br />
                                {servicio.tipo}

                                <button
                                  className="mt-2 w-full bg-primary text-white px-2 py-1 rounded text-sm cursor-pointer"
                                  onClick={() =>
                                    navigate(
                                      `/client/professional/${servicio.profesional_id}`,
                                      {
                                        state: {
                                          servicioId: servicio.servicio_id,
                                        },
                                      }
                                    )
                                  }
                                >
                                  Ver servicio
                                </button>
                              </div>
                            </LeafletMap.Popup>
                          </LeafletMap.Marker>
                        ))}
                    </LeafletMap.MapContainer>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ── PAQUETES ── */}
        {activeTab === "paquetes" && (
          <>
            {errorPkg && (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <ion-icon name="cloud-offline-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
                <p className="text-ink font-medium">No se pudieron cargar los paquetes</p>
                <p className="text-sm text-ink-muted">Problema de conexión con el servidor. Intentá de nuevo.</p>
                <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline cursor-pointer">Reintentar</button>
              </div>
            )}

            {loadingPkg && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-6 bg-border/50 rounded m-5 w-1/2" />
                    <div className="px-5 pb-5 space-y-3">
                      <div className="h-3 bg-border/50 rounded w-3/4" />
                      <div className="h-8 bg-border/50 rounded w-1/3" />
                      <div className="h-10 bg-border/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingPkg && !errorPkg && filteredPkg.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ion-icon name="cube-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)", marginBottom: "8px" }} />
                <p className="text-ink-muted">No hay paquetes disponibles.</p>
              </div>
            )}
            {!loadingPkg && !errorPkg && filteredPkg.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {filteredPkg.map((paquete) => (
                  <div
                    key={paquete.paquete_id}
                    className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="h-32 bg-gradient-to-r from-orange-200 to-pink-200" />

                    <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-display text-xl text-ink mb-2">
                        {paquete.nombre}
                      </h3>

                      <p className="text-sm text-ink-muted line-clamp-3">
                        {paquete.descripcion}
                      </p>
                        <div className="mt-4">
                          <p className="text-sm font-medium text-ink mb-2">
                            Incluye:
                          </p>

                          <ul className="space-y-1">
                            {paquete.servicios.map((servicio) => (
                              <li
                                key={servicio.servicio_id}
                                className="text-sm text-ink-muted"
                              >
                                • {servicio.nombre} ({servicio.pivot?.cantidad_sesiones} sesiones)
                              </li>
                            ))}
                          </ul>
                        </div> 
                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <span className="font-bold text-2xl">
                          ${paquete.precio_total}
                        </span>

                       <button
                          disabled={buyingPackageId === paquete.paquete_id}
                          className="
                            bg-ink-fixed text-white px-4 py-2 rounded-lg
                            hover:bg-primary
                            transition-colors
                            disabled:opacity-70
                            disabled:cursor-not-allowed
                           cursor-pointer"
                          onClick={async () => {
                            try {
                              setBuyingPackageId(paquete.paquete_id);

                              navigate(
                                `/client/package/${paquete.paquete_id}/pay`
                              );
                            } catch (error) {
                              console.error(error);
                            } finally {
                              setBuyingPackageId(null);
                            }
                          }}
                        >
                          {buyingPackageId === paquete.paquete_id
                            ? "Procesando..."
                            : "Comprar"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StarIcon({ filled = true, size = 12 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
