import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

const ESTADO_BADGE: Record<string, { label: string; cls: string }> = {
  sin_pago:  { label: "Sin pago",            cls: "bg-gray-100 text-ink-muted" },
  pendiente: { label: "Pendiente de pago",   cls: "bg-amber-100 text-amber-800" },
  rechazado: { label: "Pago rechazado",      cls: "bg-red-100 text-red-700" },
  activo:    { label: "Activo",              cls: "bg-green-100 text-green-800" },
  finalizado:{ label: "Finalizado",          cls: "bg-gray-100 text-ink-muted" },
};

export default function Packages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const loadPackages = async () => {
    if (!token) return;

    try {
      const misCompras = await api.get<any[]>(
        "/mis-compras-paquetes",
        token
      );

      setPackages(misCompras);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [token]);

  useEffect(() => {
    const handler = () => loadPackages();
    window.addEventListener("reserva-updated", handler);
    return () => window.removeEventListener("reserva-updated", handler);
  }, [token]);

  const cancelarCompra = async (id: number) => {
    try {
      setCancelling(id);

      await api.delete(
        `/compra-paquetes/${id}`,
        token
      );

      setPackages((prev) =>
        prev.filter(
          (p) => p.compra_paquete_id !== id
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="w-full">
      <div className="px-4 md:px-6 py-4 border-b border-border">
        <h1 className="font-display text-2xl text-ink">Paquetes</h1>
        <p className="text-sm text-ink-muted mt-0.5">Tus paquetes de sesiones comprados</p>
      </div>

      {loading ? (
        <div className="bg-surface border-t border-border">
          {[0, 1].map((i) => (
            <div key={i} className={`flex items-center gap-4 px-4 md:px-6 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="w-14 h-14 rounded-xl bg-border/50 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-border/50 animate-pulse" />
                <div className="h-3 w-28 rounded bg-border/50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <ion-icon name="cube-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
          <p className="text-ink font-medium">Sin paquetes aún</p>
          <p className="text-sm text-ink-muted">Comprá un paquete de sesiones para empezar a ahorrar</p>
          <button
            onClick={() => navigate("/client/discover?tab=packages")}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Explorar paquetes
          </button>
        </div>
      ) : (
        <div className="bg-surface border-t border-border">
          {packages.map((compra, compraIdx) => {
            const total = compra.items.reduce(
              (sum: number, item: any) =>
                sum + item.item_paquete.cantidad_sesiones,
              0
            );

            const restantes = compra.items.reduce(
              (sum: number, item: any) =>
                sum + item.sesiones_restantes,
              0
            );

            const estadoPago = compra.pago?.estado;

            const estadoKey =
              !estadoPago ? "sin_pago"
              : estadoPago === "pendiente" ? "pendiente"
              : estadoPago !== "aprobado" ? "rechazado"
              : restantes > 0 ? "activo"
              : "finalizado";

            const badge = ESTADO_BADGE[estadoKey];

            return (
              <div key={compra.compra_paquete_id} className={compraIdx > 0 ? "border-t-8 border-bg" : ""}>
                {/* Encabezado del paquete — info + estado + acciones de pago */}
                <div className="flex items-center gap-4 px-4 md:px-6 py-4">
                  <div className="shrink-0 w-14 flex flex-col items-center justify-center bg-bg rounded-xl py-2">
                    <ion-icon name="cube-outline" style={{ fontSize: "22px" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate mb-1">
                      {compra.paquete.nombre}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap mb-2">
                      <span>Compra #{compra.compra_paquete_id} · {compra.fecha_compra}</span>
                      <span className="font-semibold text-ink">${Number(compra.paquete.precio_total).toFixed(0)}</span>
                      <span>{restantes} de {total} sesiones restantes</span>
                    </div>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {estadoPago === "pendiente" && (
                      <>
                        <button
                          onClick={() => navigate(`/client/compra-package/${compra.compra_paquete_id}/pay`)}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
                        >
                          Completar pago
                        </button>
                        <button
                          onClick={() => cancelarCompra(compra.compra_paquete_id)}
                          disabled={cancelling === compra.compra_paquete_id}
                          className="px-4 py-2 rounded-full text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {cancelling === compra.compra_paquete_id ? "Cancelando..." : "Cancelar"}
                        </button>
                      </>
                    )}

                    {(estadoPago === "rechazado" || estadoPago === "fallido") && (
                      <button
                        onClick={() => navigate(`/client/compra-package/${compra.compra_paquete_id}/pay`)}
                        className="px-4 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
                      >
                        Reintentar pago
                      </button>
                    )}
                  </div>
                </div>

                {/* Servicios incluidos en el paquete */}
                {compra.items.map((item: any) => (
                  <div
                    key={item.compra_item_paquete_id}
                    className="flex items-center gap-4 px-4 md:px-6 py-3 border-t border-border"
                  >
                    <span className="w-14 shrink-0 hidden md:block" />
                    <div className="flex-1 min-w-0 pl-4 md:pl-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {item.item_paquete.servicio.nombre}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {item.sesiones_restantes} de {item.item_paquete.cantidad_sesiones} sesiones restantes
                      </p>
                    </div>

                    {estadoPago === "aprobado" && item.sesiones_restantes > 0 && (
                      <button
                        onClick={() =>
                          navigate(
                            `/client/professional/${item.item_paquete.servicio.profesional_id}?compraItem=${item.compra_item_paquete_id}&servicio=${item.item_paquete.servicio.servicio_id}`
                          )
                        }
                        className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
                      >
                        Reservar sesión
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
