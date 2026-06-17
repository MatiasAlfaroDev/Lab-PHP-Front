import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

interface Transaction {
  fecha: string;
  cliente: string;
  servicio: string;
  monto: number;
  estado: string;
}

interface Resumen {
  total_mes: number;
  pagado: number;
  pendiente: number;
}

const badgeCls: Record<string, string> = {
  aprobado: "badge badge-confirmada",
  pendiente: "badge badge-pendiente",
};

export default function Payments() {
  const { token, user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [resumen, setResumen] = useState<Resumen>({
    total_mes: 0,
    pagado: 0,
    pendiente: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;

    Promise.all([
      api.get("/profesional/pagos", token),
      api.get("/profesional/pagos/resumen", token),
    ])
      .then(([pagosRes, resumenRes]: any) => {
        setTransactions(pagosRes.data ?? []);
        setResumen(resumenRes.data ?? {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, user]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Cobros</h1>
          <p className="text-ink-muted mt-1">
            Historial de pagos y liquidaciones
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "INGRESOS DEL MES",
            value: `$${resumen.total_mes}`,
            sub: "Total generado",
          },
          {
            label: "PAGADO",
            value: `$${resumen.pagado}`,
            sub: "Ya acreditado",
          },
          {
            label: "PENDIENTE",
            value: `$${resumen.pendiente}`,
            sub: "Por liquidar",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-surface border border-border rounded p-5"
          >
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">
              {c.label}
            </p>
            <p className="font-display text-3xl text-ink font-bold">
              {c.value}
            </p>
            <p className="text-xs text-ink-muted mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="border border-border rounded overflow-x-auto bg-surface">
        <div className="min-w-[520px] w-full">
          {/* HEADER */}
          <div className="bg-bg border-b border-border w-full">
            <div className="grid grid-cols-12 px-5 py-3 w-full">
            {["FECHA", "CLIENTE", "SERVICIO", "MONTO", "ESTADO"].map(
              (h, i) => (
                <div
                  key={i}
                  className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${
                    i === 0 ? "col-span-2"
                    : i === 1 ? "col-span-3"
                    : i === 2 ? "col-span-4"
                    : i === 3 ? "col-span-2"
                    : "col-span-1 text-center"
                  }`}
                >
                  {h}
                </div>
              )
            )}
          </div>

          {/* ROWS */}
          {transactions.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors bg-surface"
            >
              <div className="col-span-2">
                <span className="text-sm text-ink-muted whitespace-nowrap">{t.fecha}</span>
              </div>

              <div className="col-span-3">
                <span className="text-sm font-semibold text-ink text-center">
                  {t.cliente}
                </span>
              </div>

              <div className="col-span-4">
                <span className="text-sm text-ink-muted">
                  {t.servicio}
                </span>
              </div>

              <div className="col-span-2">
                <span className="font-display text-lg font-bold text-ink">
                  ${t.monto}
                </span>
              </div>

              <div className="col-span-1 text-center">
                <span className={badgeCls[t.estado] ?? "badge"}>
                  {t.estado.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}