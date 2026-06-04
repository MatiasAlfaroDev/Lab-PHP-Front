import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

export default function Packages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadPackages = async () => {
      try {
        const misCompras = await api.get(
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

  if (loading) {
    return (
      <div className="p-8">
        Cargando paquetes...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
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
              : estadoPago === "aprobado"
              ? {
                  label: "Activo",
                  cls: "bg-green-50 text-green-700 border-green-200",
                }
              : estadoPago === "pendiente"
              ? {
                  label: "Pendiente de pago",
                  cls: "bg-amber-50 text-amber-700 border-amber-200",
                }
              : {
                  label: "Pago rechazado",
                  cls: "bg-red-50 text-red-700 border-red-200",
                };

          return (
            <div
              key={compra.compra_paquete_id}
              className="bg-surface border border-border rounded p-6 mb-4"
            >
             <div className="flex items-start justify-between mb-3">
                <h2 className="font-display text-xl text-ink">
                  {compra.paquete.nombre}
                </h2>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>

              <p className="text-sm text-ink-muted">
                Comprado el {compra.fecha_compra}
              </p>

              <p className="mt-3 font-semibold">
                {restantes} de {total} sesiones restantes
              </p>

              <div className="mt-4 flex gap-2">
                {estadoPago === "pendiente" && (
                  <button
                    onClick={() =>
                      navigate(
                        `/client/compra-package/${compra.compra_paquete_id}/pay`
                      )
                    }
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
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
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reintentar pago
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

