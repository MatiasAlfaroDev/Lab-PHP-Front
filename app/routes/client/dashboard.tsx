import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useState, useEffect } from "react";
import { api } from "~/lib/api";

interface ProximaReserva {
  reserva_id: number;
  fecha: string;
  hora: string;
  estado: string;
  modalidad: "virtual" | "presencial" | "hibrido" | null;
  servicio: {
    servicio_id: number;
    nombre: string;
    profesional_nombre?: string;
  };
}

interface PaqueteActivo {
  compra_item_paquete_id: number;
  sesiones_restantes: number;
  item_paquete: {
    item_paquete_id: number;
    cantidad_sesiones: number;
    servicio: { servicio_id: number; nombre: string };
  };
}

interface ResumenData {
  proxima_reserva: ProximaReserva | null;
  paquetes_activos: PaqueteActivo[];
  notificaciones_no_leidas: number;
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "badge badge-pendiente",
  confirmada: "badge badge-confirmada",
  pagada: "badge badge-pagada",
  en_curso: "badge badge-en-curso",
  cancelada: "badge badge-cancelada",
  no_asistida: "badge badge-no-asistida",
  finalizada: "badge badge-no-asistida",
};

function getSaludo() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}

// Habilita el acceso a la videollamada desde 10 min antes de la sesión
// (no tenemos la duración acá, así que no cerramos la ventana del lado del cliente).
function puedeEntrarVideollamada(fecha: string, hora: string) {
  const ahora = new Date();
  const desde = new Date(`${fecha}T${hora}`);
  desde.setMinutes(desde.getMinutes() - 10);
  return ahora >= desde;
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 w-full animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded bg-border/60" />
          <div className="h-4 w-40 rounded bg-border/60" />
        </div>
        <div className="h-9 w-36 rounded-full bg-border/60" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div className="h-3 w-24 rounded bg-border/60" />
            <div className="h-9 w-16 rounded bg-border/60" />
            <div className="h-3 w-20 rounded bg-border/60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-32 bg-surface border border-border rounded-2xl" />
        <div className="space-y-4">
          <div className="h-32 bg-surface border border-border rounded-2xl" />
          <div className="h-20 bg-surface border border-dashed border-border rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { token, user } = useAuth();
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: ResumenData }>("/cliente/resumen", token);
      if (res.success) setResumen(res.data);
    } catch (e: any) {
      setError(e.message ?? "Error al cargar el resumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("reserva-updated", handler);
    return () => window.removeEventListener("reserva-updated", handler);
  }, [token]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-4 md:p-8 w-full flex flex-col items-center py-16 text-center gap-3">
        <ion-icon name="cloud-offline-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
        <p className="text-ink font-medium">No se pudo cargar el resumen</p>
        <p className="text-sm text-ink-muted">{error}</p>
        <button onClick={load} className="text-sm text-primary hover:underline cursor-pointer">
          Reintentar
        </button>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "";
  const proxima = resumen?.proxima_reserva ?? null;
  const paquetesActivos = resumen?.paquetes_activos ?? [];
  const notificacionesNoLeidas = resumen?.notificaciones_no_leidas ?? 0;
  const sesionesRestantesTotal = paquetesActivos.reduce((sum, p) => sum + p.sesiones_restantes, 0);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const esHoy = proxima?.fecha === todayStr;

  const kpis = [
    {
      label: "PRÓXIMA SESIÓN",
      value: proxima ? (esHoy ? "Hoy" : proxima.fecha) : "—",
      sub: proxima ? `${proxima.hora.slice(0, 5)} hs` : "sin reservas",
    },
    {
      label: "PAQUETES ACTIVOS",
      value: String(paquetesActivos.length),
      sub: paquetesActivos.length === 1 ? "paquete vigente" : "paquetes vigentes",
    },
    {
      label: "SESIONES RESTANTES",
      value: String(sesionesRestantesTotal),
      sub: "en tus paquetes",
    },
    {
      label: "NOTIFICACIONES",
      value: String(notificacionesNoLeidas),
      sub: "sin leer",
    },
  ];

  return (
    <div className="p-4 md:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">{getSaludo()}{firstName ? `, ${firstName}` : ""}</h1>
          <p className="text-ink-muted mt-1">
            {proxima ? "Tenés una reserva próxima" : "No tenés reservas próximas"}
          </p>
        </div>
        <Link
          to="/client/discover"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
        >
          <PlusIcon />
          Nueva reserva
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-sm text-ink-muted mb-2">{k.label}</p>
            <span className="font-display text-3xl text-ink">{k.value}</span>
            <p className="text-xs text-ink-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próxima reserva */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl text-ink mb-4">Próxima reserva</h2>

          {proxima ? (
            <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="text-center min-w-10 shrink-0">
                <p className="text-xs text-ink-muted uppercase font-medium">
                  {esHoy ? "Hoy" : proxima.fecha}
                </p>
                <p className="font-display text-lg text-ink">
                  {proxima.hora.slice(0, 5)}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-white text-xs font-semibold shrink-0">
                {(proxima.servicio.profesional_nombre ?? proxima.servicio.nombre)[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-ink">
                    {proxima.servicio.profesional_nombre ?? proxima.servicio.nombre}
                  </span>
                  <span className={ESTADO_BADGE[proxima.estado] ?? "badge"}>{proxima.estado}</span>
                </div>
                <p className="text-xs text-ink-muted truncate">
                  {proxima.servicio.nombre} · {proxima.modalidad}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {proxima.modalidad === "virtual" &&
                  !["cancelada", "no_asistida", "finalizada"].includes(proxima.estado) &&
                  puedeEntrarVideollamada(proxima.fecha, proxima.hora) && (
                    <Link
                      to={`/videollamada/${proxima.reserva_id}`}
                      className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
                    >
                      <VideoIcon />
                      Unirse
                    </Link>
                  )}
                <Link
                  to="/client/reservas"
                  className="text-sm text-primary hover:underline"
                >
                  Ver
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="text-sm text-ink-muted mb-3">No tenés reservas próximas</p>
              <Link to="/client/discover" className="text-sm text-primary hover:underline">
                Explorar profesionales
              </Link>
            </div>
          )}
        </div>

        {/* Packages sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Paquetes</h2>
            <Link to="/client/packages" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3 mb-3">
            {paquetesActivos.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium mb-2">
                  <PackageIcon />
                  Sin paquetes
                </div>
                <p className="text-sm text-ink-muted">
                  Todavía no tenés paquetes activos.
                </p>
              </div>
            ) : (
              paquetesActivos.map((p) => {
                const total = p.item_paquete.cantidad_sesiones;
                const restantes = p.sesiones_restantes;
                const porcentaje = total > 0 ? (restantes / total) * 100 : 0;

                return (
                  <div
                    key={p.compra_item_paquete_id}
                    className="bg-surface border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
                      <PackageIcon />
                      Activo
                    </div>

                    <p className="font-display text-lg text-ink mb-3">
                      {p.item_paquete.servicio.nombre}
                    </p>

                    <p className="text-ink-muted text-sm mb-2">
                      <span className="text-3xl font-bold text-ink">{restantes}</span> de {total} sesiones restantes
                    </p>

                    <div className="h-1.5 bg-border rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Buy package */}
          <Link
            to="/client/discover?tab=packages"
            className="flex items-center gap-3 bg-surface border border-dashed border-border rounded-2xl p-4 hover:bg-bg transition-colors"
          >
            <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-ink-muted shrink-0">
              <PlusIcon />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Comprar paquete</p>
              <p className="text-xs text-ink-muted">Hasta 20% off en sesiones múltiples</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
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
