import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { api } from "~/lib/api";

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
type Reserva = {
  reserva_id: number;
  fecha: string;
  hora: string;
  estado: string;
  estado_videollamada: "pendiente" | "no_aplica" | "en_curso" | "finalizada";
  modalidad: "virtual" | "presencial" | null;
  servicio: {
    nombre: string;
    profesional_nombre: string;
    duracion?: number;
    precio?: string | number;
  };
  pago?: {
    estado: string;
  } | null;
};
export default function ClientDashboard() {
  const {token, user } = useAuth();
  const [bookings, setBookings] = useState<Reserva[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const now = new Date();

 const load = async () => {
      if (!token) return;

      const [reservasRes, paquetesRes] =
        await Promise.all([
          api.get<{ success: boolean; data: Reserva[] }>(
            "/mis-reservas",
            token
          ),
          api.get<any[]>(
            "/mis-compras-paquetes",
            token
          ),
        ]);

      setBookings(reservasRes.data);
      setPackages(paquetesRes);
    };
  
  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    const handler = () => {
      console.log("CLIENT DASHBOARD REFRESH");
      load();
    };

    window.addEventListener(
      "reserva-updated",
      handler
    );

    return () =>
      window.removeEventListener(
        "reserva-updated",
        handler
      );
  }, [token]);

  const upcomingBookings = bookings
  .filter((b) => {
    const date = new Date(`${b.fecha}T${b.hora}`);

    const cancelled =
      b.estado === "cancelada" || b.estado === "no_asistida";
    if (cancelled) return false;

    // una sesión virtual en curso debe seguir visible aunque su hora
    // agendada ya haya pasado
    if (b.estado_videollamada === "en_curso") return true;

    return date >= now;
  })
  .sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora}`);
    const dateB = new Date(`${b.fecha}T${b.hora}`);
    return dateA.getTime() - dateB.getTime();
  });
  const upcomingCount = upcomingBookings.length;
  const todaySession = useMemo(() => {
  // fecha local (no UTC) para evitar que en Uruguay (UTC-3) la sesión
  // de hoy desaparezca pasadas las 21:00
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return bookings
    .filter((b) => {
      return (
        b.fecha === todayStr &&
        b.modalidad === "virtual" &&
        b.estado !== "cancelada"
      );
    })
    .sort((a, b) => a.hora.localeCompare(b.hora))[0];
}, [bookings]);

  const paqueteDestacado =
    packages.find((p) => p.pago?.estado === "aprobado") ??
    packages.find((p) => p.pago?.estado === "pendiente") ??
    null;

    const totalSesiones = paqueteDestacado
      ? paqueteDestacado.items.reduce(
          (sum: number, item: any) =>
            sum + item.item_paquete.cantidad_sesiones,
          0
        )
      : 0;

      const sesionesRestantes = paqueteDestacado
      ? paqueteDestacado.items.reduce(
          (sum: number, item: any) =>
            sum + item.sesiones_restantes,
          0
        )
      : 0;

      const porcentaje =
      totalSesiones > 0
        ? (sesionesRestantes / totalSesiones) * 100
        : 0;
  
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          { <h1 className="font-display italic text-3xl text-ink">Hola, {user?.name}</h1> }
          <p className="text-ink-muted mt-1">Tenés {upcomingCount} reserva{upcomingCount !== 1 ? "s" : ""} próximas</p>
        </div>
        <Link
          to="/client/discover"
          className="self-start sm:self-auto flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          + Nueva reserva
        </Link>
      </div>

      {todaySession && (
        <div className="bg-primary-soft rounded-2xl p-6 mb-8 flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              Hoy · {todaySession.hora.slice(0, 5)}
            </span>

            <h2 className="font-display italic text-2xl text-ink mb-2">
              Sesión con {todaySession.servicio.profesional_nombre}
            </h2>

            <div className="flex items-center gap-4 text-sm text-ink-muted">
              <span>{todaySession.hora.slice(0, 5)}</span>
              <span>Virtual</span>
            </div>

            <div className="flex gap-3 mt-4">
              {todaySession.estado_videollamada === "en_curso" && (
                <Link
                  to={`/videollamada/${todaySession.reserva_id}`}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Entrar a la sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display italic text-xl text-ink">Próximas reservas</h3>
            <div className="flex gap-1">
            </div>
          </div>

          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <div
                key={b.reserva_id}
                className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                {/* FECHA */}
                <div className="text-center min-w-10">
                  <p className="text-xs text-ink-muted uppercase font-medium">
                    {b.fecha}
                  </p>
                  <p className="font-display italic text-lg text-ink">
                    {b.hora.slice(0, 5)}
                  </p>
                </div>

                {/* AVATAR SIMPLE (sin initials por ahora) */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-white text-xs font-semibold shrink-0">
                  {b.servicio.profesional_nombre[0]}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-ink">
                      {b.servicio.profesional_nombre}
                    </span>

                    <span className="badge">
                      {b.estado}
                    </span>
                  </div>

                  <p className="text-xs text-ink-muted truncate">
                    {b.modalidad}
                  </p>
                </div>

                {/* ACCIONES */}
                <div className="flex items-center gap-2">
                  {b.modalidad === "virtual" &&
                    b.estado_videollamada === "en_curso" && (
                      <Link
                        to={`/videollamada/${b.reserva_id}`}
                        className="text-sm bg-accent text-white px-3 py-1.5 rounded-lg"
                      >
                        Entrar
                      </Link>
                    )}
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
          
          <div className="bg-surface border border-border rounded-2xl p-4">
            {paqueteDestacado ? (
              <>
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
                  <PackageIcon />
                  {paqueteDestacado.pago?.estado === "aprobado"
                    ? "Activo"
                    : "Pendiente"}
                </div>

                <p className="font-display italic text-lg text-ink mb-3">
                  {paqueteDestacado.paquete.nombre}
                </p>

                <p className="text-ink-muted text-sm mb-2">
                  <span className="text-3xl font-bold text-ink">
                    {sesionesRestantes}
                  </span>{" "}
                  de {totalSesiones} sesiones restantes
                </p>

                <div className="h-1.5 bg-border rounded-full mb-3">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>
                    Compra #{paqueteDestacado.compra_paquete_id}
                  </span>

                  <span>
                    ${paqueteDestacado.paquete.precio_total}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium mb-2">
                  <PackageIcon />
                  Sin paquetes
                </div>

                <p className="text-sm text-ink-muted">
                  Todavía no tienes paquetes comprados.
                </p>
              </>
            )}
          </div>

            {/* Buy package */}
            <Link
              to="/client/discover?tab=packages"
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
