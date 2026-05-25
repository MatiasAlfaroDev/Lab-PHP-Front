import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
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

interface Servicio {
  servicio_id: number;
  nombre: string;
  tipo: string;
  precio: string | number;
  duracion: number;
  modalidad: string;
  descripcion: string;
}

interface ProfesionalProfile {
  id: number;
  name: string;
  email: string;
  profesional: {
    user_id: number;
    descripcion: string | null;
    ubicacion: string | null;
    servicios: Servicio[];
  };
}

interface ApiResponse {
  success: boolean;
  data: ProfesionalProfile;
}

function getInitials(name: string): string {
  return name
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

const TABS = ["Acerca de", "Servicios", "Reseñas"];

export default function ProfessionalDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState<ProfesionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Servicios");
  const [selectedService, setSelectedService] = useState<Servicio | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<ApiResponse>(`/profesionales/${id}`)
      .then((res) => {
        if (res.success) {
          setProfile(res.data);
          const servicios = res.data.profesional?.servicios ?? [];
          if (servicios.length > 0) setSelectedService(servicios[0]);
        } else {
          setError("Profesional no encontrado");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-4 bg-border/50 rounded w-48 mb-6" />
        <div className="h-8 bg-border/50 rounded w-72 mb-2" />
        <div className="h-4 bg-border/50 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="h-40 bg-border/30" />
            <div className="p-6 space-y-3">
              <div className="h-5 bg-border/50 rounded w-40" />
              <div className="h-4 bg-border/50 rounded w-64" />
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl h-48" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <ion-icon
          name="person-outline"
          style={{ fontSize: "48px", color: "var(--color-ink-muted)", marginBottom: "12px" }}
        />
        <p className="text-ink font-medium mb-1">Profesional no encontrado</p>
        <p className="text-ink-muted text-sm mb-4">{error}</p>
        <Link to="/client/discover" className="text-primary text-sm underline">
          Volver a Descubrir
        </Link>
      </div>
    );
  }

  const { name, profesional } = profile;
  const servicios = profesional?.servicios ?? [];
  const tabLabel = (t: string) =>
    t === "Servicios" ? `Servicios · ${servicios.length}` : t;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-muted mb-4 flex items-center gap-2">
        <Link to="/client/discover" className="hover:text-ink">
          Descubrir
        </Link>
        <span>·</span>
        <span>{name}</span>
      </nav>

      {/* Hero */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display italic text-3xl text-ink">{name}</h1>
          {profesional?.ubicacion && (
            <p className="text-ink-muted flex items-center gap-1 mt-1">
              <ion-icon name="location-outline" style={{ fontSize: "14px" }} />
              {profesional.ubicacion}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover + avatar */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="h-40 w-full bg-gradient-to-br from-violet-100 to-purple-200" />
            <div className="px-6 pb-6">
              <div className="flex items-start gap-4 -mt-6 mb-4">
                <div className="w-16 h-16 rounded-full bg-violet-400 flex items-center justify-center text-white text-xl font-semibold border-4 border-white shrink-0">
                  {getInitials(name)}
                </div>
                <div className="flex-1 mt-7">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="font-display italic text-xl text-ink">{name}</h2>
                      {servicios.length > 0 && (
                        <p className="text-sm text-ink-muted">{servicios[0].tipo}</p>
                      )}
                    </div>
                    <button className="w-9 h-9 border border-border rounded-xl flex items-center justify-center text-ink-muted hover:text-accent transition-colors">
                      <ion-icon name="heart-outline" style={{ fontSize: "16px" }} />
                    </button>
                  </div>
                  {profesional?.ubicacion && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-ink-muted">
                      <ion-icon name="location-outline" style={{ fontSize: "13px" }} />
                      {profesional.ubicacion}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border px-2 pt-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab
                      ? "border border-border border-b-surface -mb-px bg-surface text-ink"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {tabLabel(tab)}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Acerca de */}
              {activeTab === "Acerca de" && (
                <p className="text-sm text-ink leading-relaxed">
                  {profesional?.descripcion ?? "Este profesional aún no ha completado su descripción."}
                </p>
              )}

              {/* Servicios */}
              {activeTab === "Servicios" && (
                <div className="space-y-3">
                  {servicios.length === 0 ? (
                    <p className="text-sm text-ink-muted">Este profesional aún no tiene servicios publicados.</p>
                  ) : (
                    servicios.map((s) => {
                      const modality = normalizeModality(s.modalidad);
                      const isSelected = selectedService?.servicio_id === s.servicio_id;
                      return (
                        <div
                          key={s.servicio_id}
                          onClick={() => setSelectedService(s)}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary-soft/20"
                              : "border-border bg-bg hover:border-primary/40"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink mb-0.5">{s.nombre}</p>
                            {s.descripcion && (
                              <p className="text-xs text-ink-muted line-clamp-1 mb-1">
                                {s.descripcion}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-ink-muted">
                                <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                                {s.duracion} min
                              </span>
                              <span
                                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                                  modality === "Virtual"
                                    ? "border-primary/30 text-primary bg-primary-soft/40"
                                    : "border-border text-ink-muted bg-surface"
                                }`}
                              >
                                <ion-icon
                                  name={modality === "Virtual" ? "desktop-outline" : "location-outline"}
                                  style={{ fontSize: "11px" }}
                                />
                                {modality}
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-ink shrink-0">
                            $ {Number(s.precio).toFixed(0)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Reseñas */}
              {activeTab === "Reseñas" && (
                <div className="flex flex-col items-center py-8 text-center">
                  <ion-icon
                    name="star-outline"
                    style={{ fontSize: "36px", color: "var(--color-ink-muted)", marginBottom: "8px" }}
                  />
                  <p className="text-ink-muted text-sm">Las reseñas estarán disponibles próximamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: service summary */}
        <div>
          <div className="bg-surface border border-border rounded-2xl p-5 sticky top-6">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Servicio seleccionado
            </p>

            {selectedService ? (
              <>
                <h3 className="font-display italic text-xl text-ink mb-1">
                  {selectedService.nombre}
                </h3>
                <p className="text-sm text-ink-muted mb-4">
                  {selectedService.descripcion}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs bg-bg border border-border px-3 py-1 rounded-full text-ink-muted">
                    <ion-icon name="time-outline" style={{ fontSize: "12px" }} />
                    {selectedService.duracion} min
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${
                      normalizeModality(selectedService.modalidad) === "Virtual"
                        ? "border-primary/30 text-primary bg-primary-soft/40"
                        : "border-border text-ink-muted bg-bg"
                    }`}
                  >
                    <ion-icon
                      name={
                        normalizeModality(selectedService.modalidad) === "Virtual"
                          ? "desktop-outline"
                          : "location-outline"
                      }
                      style={{ fontSize: "12px" }}
                    />
                    {normalizeModality(selectedService.modalidad)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-5">
                  <span className="text-sm text-ink-muted">Precio</span>
                  <span className="font-display italic text-3xl text-ink">
                    $ {Number(selectedService.precio).toFixed(0)}
                  </span>
                </div>

                <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-3 mb-4">
                  <ion-icon
                    name="calendar-outline"
                    style={{ fontSize: "20px", color: "var(--color-ink-muted)", flexShrink: 0 }}
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">Disponibilidad</p>
                    <p className="text-xs text-ink-muted">Calendario disponible próximamente</p>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full bg-primary/40 text-white font-medium py-3 rounded-xl cursor-not-allowed"
                >
                  Reservar turno
                </button>
                <p className="text-xs text-ink-muted text-center mt-2">
                  Las reservas estarán disponibles próximamente
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                Seleccioná un servicio de la lista para ver el detalle.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
