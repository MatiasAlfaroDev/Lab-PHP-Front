import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useState, useEffect } from "react";
import { api } from "~/lib/api";

const agenda = [
  { time: "09:00", duration: "50min", initials: "LP", name: "Lucía Pérez", type: "Sesión individual · Virtual", status: "finalizada", color: "bg-violet-500" },
  { time: "10:30", duration: "50min", initials: "CR", name: "Carlos Ruiz", type: "Primera consulta · Presencial", status: "finalizada", color: "bg-purple-400" },
  { time: "12:00", duration: "60min", initials: "ML", name: "Marta López", type: "Sesión de pareja · Presencial", status: "en-vivo", color: "bg-orange-400", action: "Entrar" },
  { time: "14:00", duration: "50min", initials: "JV", name: "Joaquín Vega", type: "Sesión individual · Virtual", status: "confirmada", color: "bg-teal-500" },
  { time: "15:00", duration: "25min", initials: "SM", name: "Sol Méndez", type: "Seguimiento breve · Virtual", status: "confirmada", color: "bg-amber-500" },
  { time: "16:30", duration: "50min", initials: "LP", name: "Lucía Pérez", type: "Sesión individual · paquete · Virtual", status: "pagada", color: "bg-violet-500" },
  { time: "18:00", duration: "50min", initials: null, name: "— Slot libre —", type: "", status: "libre", color: "" },
];

const statusLabel: Record<string, { label: string; cls: string }> = {
  finalizada: { label: "FINALIZADA", cls: "text-ink-muted text-xs font-bold uppercase" },
  "en-vivo": { label: "EN VIVO", cls: "badge badge-en-vivo" },
  confirmada: { label: "CONFIRMADA", cls: "badge badge-confirmada" },
  pagada: { label: "PAGADA", cls: "badge badge-pagada" },
  libre: { label: "", cls: "" },
};

const kpis = [
  { label: "SESIONES ESTA SEMANA", value: "24", delta: "+12%", sub: "vs. semana anterior" },
  { label: "INGRESOS DEL MES", value: "€2.840", delta: "+8%", sub: "meta: €3.500" },
  { label: "TASA DE OCUPACIÓN", value: "78%", delta: null, sub: "32 de 41 slots" },
  { label: "CALIFICACIÓN", value: "4.9", delta: null, sub: "234 reseñas · top 5%" },
];

const calendar = [
  [24, 25, 26, 27, 1, 2, 3],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, 31],
];
const busyDays = [2, 5, 8, 12, 14, 15, 19, 22, 26, 27, 28];

export default function ProfessionalDashboard() {
  const { user, token } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "María";
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [openSolicitudes, setOpenSolicitudes] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  useEffect(() => {
    if (!token) return;

    api
      .get("/reservas/pendientes", token)
      .then((res: any) => {
        setPendientes(res.data ?? []);
      })
      .catch(() => {
        setPendientes([]);
      });
  }, [token]);

  const cambiarEstado = async (
    id: number,
    estado: "confirmada" | "cancelada"
  ) => {
    try {
      setLoadingId(id);

      await api.put(`/reservas/${id}/estado`, { estado }, token);

      // refrescar pendientes
      const res: any = await api.get("/reservas/pendientes", token);
      setPendientes(res.data?.data ?? []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Buenos días, {firstName}</h1>
          <p className="text-ink-muted mt-1">Tenés 6 sesiones hoy · €312 estimados</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 border border-border rounded bg-surface hover:bg-bg">
            <BellIcon />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold">4</span>
          </button>
          <button className="flex items-center gap-2 border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink">
            + Nuevo servicio
          </button>
          <button className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors">
            📅 Bloquear agenda
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border border-border rounded p-5">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">{k.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl text-ink">{k.value}</span>
              {k.delta && (
                <span className="text-xs font-bold bg-accent text-ink px-1.5 py-0.5 rounded">
                  {k.delta}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Agenda */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Agenda de hoy · Miércoles 20 may</h2>
            <div className="flex gap-1">
              {["Día", "Semana", "Mes"].map((v) => (
                <button
                  key={v}
                  className={`text-sm px-3 py-1.5 rounded font-semibold transition-colors ${
                    v === "Día" ? "bg-ink text-white" : "text-ink-muted hover:bg-bg border border-border"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded overflow-hidden">
            {agenda.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 ${
                  item.status === "en-vivo" ? "bg-accent/10" : ""
                }`}
              >
                <div className="w-16 shrink-0">
                  <p className="text-sm font-semibold text-ink">{item.time}</p>
                  <p className="text-xs text-ink-muted">{item.duration}</p>
                </div>

                {item.initials ? (
                  <div
                    className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-white text-xs font-bold ${item.color}`}
                  >
                    {item.initials}
                  </div>
                ) : (
                  <div className="w-8 h-8" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${item.status === "libre" ? "text-ink-muted italic" : "text-ink"}`}>
                      {item.name}
                    </p>
                    {item.status === "en-vivo" && (
                      <span className="badge badge-en-vivo">● EN VIVO</span>
                    )}
                  </div>
                  {item.type && <p className="text-xs text-ink-muted">{item.type}</p>}
                </div>

                <div className="flex items-center gap-3">
                  {item.status !== "libre" && item.status !== "en-vivo" && item.status !== "finalizada" && (
                    <span className={statusLabel[item.status]?.cls}>
                      {statusLabel[item.status]?.label}
                    </span>
                  )}
                  {item.status === "finalizada" && (
                    <span className="text-xs text-ink-muted font-bold uppercase">Finalizada</span>
                  )}
                  {item.status === "en-vivo" && (
                    <Link
                      to="/session/1"
                      className="flex items-center gap-2 bg-ink text-white text-sm font-semibold px-4 py-2 rounded hover:bg-primary transition-colors"
                    >
                      ⬜ Entrar
                    </Link>
                  )}
                  {item.status === "libre" && (
                    <button className="text-sm text-ink-muted border border-border px-3 py-1.5 rounded hover:bg-bg transition-colors font-semibold">
                      Bloquear
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: calendar + review */}
        <div className="space-y-5">
          {/* Mini calendar */}
          <div className="bg-surface border border-border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-ink">Mayo 2026</span>
              <div className="flex gap-1">
                <button className="w-6 h-6 border border-border rounded text-ink-muted hover:bg-bg text-xs">‹</button>
                <button className="w-6 h-6 border border-border rounded text-ink-muted hover:bg-bg text-xs">›</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="text-center text-xs text-ink-muted py-1 font-semibold">{d}</div>
              ))}
              {calendar.flat().map((day, i) => {
                const busy = busyDays.includes(day);
                const today = day === 20;
                return (
                  <button
                    key={i}
                    className={`relative text-xs py-1.5 rounded transition-colors ${
                      today ? "bg-ink text-white font-bold" : busy ? "hover:bg-bg text-ink" : "text-ink-muted"
                    }`}
                  >
                    {day}
                    {busy && !today && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Por revisar */}
          <div className="bg-surface border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Por revisar</h3>

            <div className="space-y-2">

              {/* SOLICITUDES REALES */}
              <div
                className="flex items-start gap-3 p-3 bg-bg rounded border border-border hover:bg-border/50 cursor-pointer transition-colors"
                onClick={() => setOpenSolicitudes((v) => !v)}
              >
                <span className="text-sm shrink-0">📅</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {pendientes.length} solicitudes de reserva
                  </p>
                  <p className="text-xs text-ink-muted">
                    Esperan tu confirmación
                  </p>
                </div>

                <span className="text-ink-muted">
                  {openSolicitudes ? "⌃" : "›"}
                </span>
              </div>

              {/* LIQUIDACIONES (queda estático por ahora) */}
              <div className="flex items-start gap-3 p-3 bg-bg rounded border border-border hover:bg-border/50 cursor-pointer transition-colors">
                <span className="text-sm shrink-0">$</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    €890 pendientes de liquidación
                  </p>
                  <p className="text-xs text-ink-muted">
                    Se acreditan el viernes
                  </p>
                </div>

                <span className="text-ink-muted">›</span>
              </div>

              {/* RESEÑAS (queda estático por ahora) */}
              <div className="flex items-start gap-3 p-3 bg-bg rounded border border-border hover:bg-border/50 cursor-pointer transition-colors">
                <span className="text-sm shrink-0">★</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    2 reseñas nuevas
                  </p>
                  <p className="text-xs text-ink-muted">
                    4.8 ★ promedio
                  </p>
                </div>

                <span className="text-ink-muted">›</span>
              </div>

            </div>
          </div>
        </div>
      </div>
      {openSolicitudes && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    
    <div className="bg-surface w-full max-w-lg rounded border border-border p-4">

      {/* header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-ink">
          Solicitudes de reserva
        </h3>

        <button
          onClick={() => setOpenSolicitudes(false)}
          className="text-ink-muted"
        >
          ✕
        </button>
      </div>

      {/* contenido */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">

        {pendientes.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No hay solicitudes
          </p>
        ) : (
          pendientes.map((r) => (
            <div key={r.reserva_id} className="p-3 border rounded bg-bg cursor-pointer hover:bg-border/50 transition-colors">

              <p className="text-sm font-semibold text-ink">
                {r.cliente_nombre}
              </p>

              <p className="text-xs text-ink-muted">
                {r.servicio?.nombre}
              </p>

              <p className="text-xs text-ink-muted">
                {r.fecha} · {r.hora}
              </p>

              <div className="flex gap-2 mt-3">

                <button
                  onClick={() => cambiarEstado(r.reserva_id, "confirmada")}
                  className="px-3 py-1 text-xs bg-ink text-white rounded cursor-pointer hover:bg-primary"
                >
                  Confirmar
                </button>

                <button
                  onClick={() => cambiarEstado(r.reserva_id, "cancelada")}
                  className="px-3 py-1 text-xs bg-ink text-white rounded cursor-pointer hover:bg-primary"
                >
                  Cancelar
                </button>

              </div>

            </div>
          ))
        )}

      </div>
    </div>
  </div>
)}
    </div>
  );
}

function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
