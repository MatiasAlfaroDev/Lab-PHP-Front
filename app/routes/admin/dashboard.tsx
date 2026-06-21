import { useEffect, useState } from "react"; 
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

/* =========================
   KPIs (ahora dinámicos)
========================= */
const defaultKpis = [
  { label: "USUARIOS TOTALES", value: "-", delta: "", sub: "" },
  { label: "CLIENTES REGISTRADOS", value: "-", delta: "", sub: "" },
  { label: "PROFESIONALES REGISTRADOS", value: "-", delta: "", sub: "" },
  { label: "RESERVAS TOTALES", value: "-", delta: "", sub: "" },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [kpis, setKpis] = useState(defaultKpis);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState<null | {
    x: number;
    y: number;
    data: any;
  }>(null);
  const [serviceByType, setServiceByType] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const loadKpis = async () => {
      try {
        const res: any = await api.get("/admin/dashboard", token);

        if (!res.success) return;

        setKpis([
          {
            label: "USUARIOS TOTALES",
            value: res.data.kpis.users,
            delta: "",
            sub: "",
          },
          {
            label: "CLIENTES TOTALES",
            value: res.data.kpis.clients,  
            delta: "",
            sub: "",
          },
          {
            label: "PROFESIONALES ACTIVOS",
            value: res.data.kpis.professionals,
            delta: "",
            sub: "",
          },
          {
            label: "RESERVAS TOTALES",
            value: res.data.kpis.reservas,
            delta: "",
            sub: "",
          },
        ]);
        setRecentActivity(res.data.recent_activity);
        setBarData(res.data.reservas_por_dia);
        setServiceByType(res.data.servicios_por_tipo);
        setTopServices(res.data.servicios_mas_reservados);
      } catch (e) {
        console.error("Error KPIs:", e);
      }
    };

    loadKpis();
  }, [token]);

  const maxService = Math.max(
  ...serviceByType.map((s) => Number(s.total || 0)),
  1
);
  const maxValue = Math.max(
    ...barData.map(
      (d) =>
        Number(d.finalizadas || 0) +
        Number(d.no_asistidas || 0) +
        Number(d.canceladas || 0)
    ),
    1
  );
  const rawMax = Math.max(
  ...barData.map(
    (d) =>
      Number(d.finalizadas || 0) +
      Number(d.no_asistidas || 0) +
      Number(d.canceladas || 0)
  ),
  1
);

const step = Math.ceil(rawMax / 4);
const maxScale = step * 4;
  const ESTADO_BADGE: Record<string, string> = {
    pendiente: "badge badge-pendiente",
    confirmada: "badge badge-confirmada",
    pagada: "badge badge-pagada",
    cancelada: "badge badge-cancelada",
    finalizada: "badge badge-no-asistida",
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Admin</nav>
          <h1 className="font-display text-3xl text-ink">Panel administrativo</h1>
        </div>
      </div>

      {/* =========================
          KPIs (AHORA BACKEND)
      ========================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border border-border rounded p-4">

            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2 min-h-[32px]">
              {k.label}
            </p>

            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl text-ink font-bold">
                {k.value}
              </span>

              {k.delta && (
                <span className="text-xs text-green-500 font-semibold">
                  {k.delta}
                </span>
              )}
            </div>

            {k.sub && (
              <p className="text-xs text-ink-muted mt-1">
                {k.sub}
              </p>
            )}

          </div>
        ))}
      </div>

      {/* =========================
          TODO LO DEMÁS IGUAL
      ========================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-surface border border-border rounded p-6">

          <h2 className="font-display text-xl text-ink">Volumen de reservas del último mes</h2>

          <div className="mt-4">
            <div className="flex">

              {/* EJE Y */}
              <div className="w-10 h-56 flex flex-col justify-between text-xs text-ink-muted pr-2">
                <span>{maxScale}</span>
                <span>{step * 3}</span>
                <span>{step * 2}</span>
                <span>{step}</span>
                <span>0</span>
              </div>

              {/* GRAFICA */}
              <div className="flex-1">

                <div className="relative h-56 border-l border-b border-border">

                  {/* líneas horizontales */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[1,2,3,4].map((n) => (
                      <div
                        key={n}
                        className="border-t border-dashed border-border"
                      />
                    ))}
                  </div>

                  {/* barras */}
                  <div className="absolute inset-0 flex items-end gap-1 px-1">
                    {barData.map((d, i) => {
                      const finalizadas = Number(d.finalizadas || 0);
                      const no_asistidas = Number(d.no_asistidas || 0);
                      const canceladas = Number(d.canceladas || 0);

                      const total = finalizadas + no_asistidas + canceladas;

                      const hFinalizadas = (finalizadas / maxScale) * 100;
                      const hNo = (no_asistidas / maxScale) * 100;
                      const hCanceladas = (canceladas / maxScale) * 100;

                      return (
                        <div
                          key={i}
                          className="flex-1 h-full flex items-end cursor-pointer relative"
                          onMouseEnter={(e) => {
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              data: d,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >

                          <div className="w-full flex flex-col justify-end h-full">

                            {canceladas > 0 && (
                              <div
                                className="bg-red-500 w-full"
                                style={{ height: `${hCanceladas}%` }}
                              />
                            )}

                            {no_asistidas > 0 && (
                              <div
                                className="bg-orange-400 w-full"
                                style={{ height: `${hNo}%` }}
                              />
                            )}

                            {finalizadas > 0 && (
                              <div
                                className="bg-green-500 w-full"
                                style={{ height: `${hFinalizadas}%` }}
                              />
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
                {tooltip && (
                  <div
                    className="fixed z-50 bg-black text-white text-xs p-3 rounded shadow-lg pointer-events-none"
                    style={{
                      left: tooltip.x + 10,
                      top: tooltip.y + 10,
                    }}
                  >
                    <div className="font-bold mb-1">
                      {tooltip.data.fecha}
                    </div>

                    <div>✔ Finalizadas: {tooltip.data.finalizadas}</div>
                    <div>⚠ No asistieron: {tooltip.data.no_asistidas}</div>
                    <div>✖ Canceladas: {tooltip.data.canceladas}</div>
                  </div>
                )}
                {/* FECHAS */}
                <div className="flex mt-2 text-[10px] text-ink-muted">
                  {barData.map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end"
                    >
                      {i % 5 === 0
                        ? new Date(d.fecha)
                            .toLocaleDateString("es-UY", {
                              day: "2-digit",
                              month: "2-digit",
                            })
                        : ""}
                    </div>
                  ))}
                </div>
                {/* LEYENDA */}
                <div className="flex items-center gap-5 mt-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-sm" />
                    Finalizadas
                  </span>

                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-orange-400 rounded-sm" />
                    No asistieron
                  </span>

                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-sm" />
                    Canceladas
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-bold text-ink-muted uppercase mb-3">
              RESERVAS RECIENTES
            </p>

            {recentActivity.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {a.texto}
                  </p>

                  <p className="text-xs text-ink-muted">
                    {a.fecha} · {a.hora}
                  </p>
                </div>

                <span className={ESTADO_BADGE[a.estado] ?? "badge badge-no-asistida"}>
                  {a.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">

          {/* CATEGORIES */}
          <div className="bg-surface border border-border rounded p-5">
            <h3 className="font-display text-lg mb-4">Categorias más reservadas</h3>

            {serviceByType.map((s, i) => (
              <div key={i} className="mb-3">

                <div className="flex justify-between text-sm">
                  <span>{s.tipo}</span>
                  <span className="font-semibold">{s.total}</span>
                </div>

                <div className="h-1.5 bg-border rounded">
                  <div
                    className="h-full bg-ink-fixed rounded"
                    style={{
                      width: `${(s.total / maxService) * 100}%`
                    }}
                  />
                </div>

              </div>
            ))}
          </div>
          
          <div className="bg-surface border border-border rounded p-5">
            <h3 className="font-display text-lg mb-4">
              Servicios más reservados
            </h3>

            {topServices.map((s, i) => (
              <div key={i} className="mb-3">

                <div className="flex justify-between text-sm">
                  <span>{s.nombre}</span>
                  <span className="font-semibold">{s.total}</span>
                </div>

                <div className="h-1.5 bg-border rounded">
                  <div
                    className="h-full bg-ink-fixed rounded"
                    style={{
                      width: `${(s.total / Math.max(...topServices.map(x => x.total), 1)) * 100}%`
                    }}
                  />
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}