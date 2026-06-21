import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

export default function Packages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadPackages = async () => {
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

    loadPackages();
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

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        Cargando paquetes...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-6">
        Paquetes
      </h1>

      <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
        MIS PAQUETES
      </h2>

      {packages.length === 0 ? (
        <p>No tienes paquetes comprados.</p>
      ) : (

        packages.map((compra) => {
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

          const badge =
          !estadoPago
            ? {
                label: "Sin pago",
                cls: "bg-slate-50 text-slate-700 border-slate-200",
              }
            : estadoPago === "pendiente"
            ? {
                label: "Pendiente de pago",
                cls: "bg-amber-50 text-amber-700 border-amber-200",
              }
            : estadoPago !== "aprobado"
            ? {
                label: "Pago rechazado",
                cls: "bg-red-50 text-red-700 border-red-200",
              }
            : restantes > 0
            ? {
                label: "Activo",
                cls: "bg-green-50 text-green-700 border-green-200",
              }
            : {
                label: "Finalizado",
                cls: "bg-gray-50 text-gray-700 border-gray-200",
              };

          return (
            <div
              key={compra.compra_paquete_id}
              className="bg-surface border border-border rounded-2xl p-4 flex items-start gap-4 mb-3"
            >
              {/* Icono lateral */}
              <div className="shrink-0 w-14 h-14 flex items-center justify-center bg-bg border border-border rounded-xl">
                <ion-icon
                  name="cube-outline"
                  style={{ fontSize: "26px" }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-ink">
                    {compra.paquete.nombre}
                  </p>

                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-ink-muted">
                  Compra #{compra.compra_paquete_id}
                </p>

                <p className="text-xs text-ink-muted mb-2">
                  Comprado el {compra.fecha_compra}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                  <span>
                    {restantes} de {total} sesiones restantes
                  </span>

                  <div className="mt-4 space-y-2">
                    {compra.items.map((item: any) => (
                      <div
                        key={item.compra_item_paquete_id}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {item.item_paquete.servicio.nombre}
                          </p>

                          <p className="text-sm text-ink-muted">
                            {item.sesiones_restantes} sesiones restantes
                          </p>
                        </div>

                        {estadoPago === "aprobado" &&
                          item.sesiones_restantes > 0 && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/client/professional/${item.item_paquete.servicio.profesional_id}?compraItem=${item.compra_item_paquete_id}`
                                )
                              }
                              className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-hover"
                            >
                              Reservar sesión
                            </button>
                          )}
                      </div>
                    ))}
                  </div>

                  <span className="font-semibold text-ink">
                    ${Number(
                      compra.paquete.precio_total
                    ).toFixed(0)}
                  </span>
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  {estadoPago === "pendiente" && (
                    <button
                      onClick={() =>
                        navigate(
                          `/client/compra-package/${compra.compra_paquete_id}/pay`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                    >
                      Completar pago
                    </button>
                  )}

                  {(estadoPago === "rechazado" ||
                    estadoPago === "fallido") && (
                    <button
                      onClick={() =>
                        navigate(
                          `/client/compra-package/${compra.compra_paquete_id}/pay`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Reintentar pago
                    </button>
                  )}

                  {estadoPago === "pendiente" && (
                    <button
                      onClick={() =>
                        cancelarCompra(
                          compra.compra_paquete_id
                        )
                      }
                      disabled={
                        cancelling ===
                        compra.compra_paquete_id
                      }
                      className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {cancelling === compra.compra_paquete_id
                        ? "Cancelando..."
                        : "Cancelar compra"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

