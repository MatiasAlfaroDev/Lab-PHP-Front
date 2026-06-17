import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

const badgeCls: Record<string, string> = {
  aprobado: "badge badge-confirmada",
  pendiente: "badge badge-pendiente",
};

export default function AdminPayments() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const loadPayments = async () => {
      try {
        const [res, resSummary]: any = await Promise.all([
          api.get("/admin/pagos", token),
          api.get("/admin/pagosTotales", token),
        ]);

        if (res.success) setTransactions(res.data);
        if (resSummary.success) setSummary(resSummary.data);

      } catch (e) {
        console.error("Error loading payments:", e);
      }
    };

    loadPayments();
  }, [token]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Pagos</h1>
          <p className="text-ink-muted mt-1">
            Todas las transacciones de la plataforma
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded p-5">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">
            TOTAL
          </p>
          <p className="font-display text-2xl text-ink font-bold">
            €{summary?.total ?? 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded p-5">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">
            PAGADO
          </p>
          <p className="font-display text-2xl text-ink font-bold text-green-600">
            €{summary?.pagado ?? 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded p-5">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">
            PENDIENTE
          </p>
          <p className="font-display text-2xl text-ink font-bold text-yellow-600">
            €{summary?.pendiente ?? 0}
          </p>
        </div>

      </div>

      {/* TABLE */}
      <div className="border border-border rounded overflow-x-auto">
        <div style={{ minWidth: "640px" }}>
          {/* HEADER */}
          <div className="flex px-5 py-3 border-b border-border bg-bg text-xs font-bold text-ink-muted uppercase tracking-widest items-center">
  
            <div className="w-24">FECHA</div>
            <div className="flex-[2]">DE</div>
            <div className="flex-[2]">PARA</div>
            <div className="flex-[3]">SERVICIO</div>
            <div className="w-20 text-left">TOTAL</div>
            <div className="w-24 text-center">MÉTODO</div>
            <div className="w-28 text-center">ESTADO</div>

          </div>

          {/* ROWS */}
          {transactions.map((t, i) => (
            <div className="flex px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors text-sm bg-surface">

              <div className="w-24 text-ink-muted">
                {t.fecha}
              </div>

              <div className="flex-[2] text-ink font-semibold truncate pr-2">
                {t.de}
              </div>

              <div className="flex-[2] text-ink font-semibold truncate pr-2">
                {t.para}
              </div>

              <div className="flex-[3] text-ink-muted truncate pr-2">
                {t.servicio}
              </div>

              <div className="w-20 text-left font-bold text-ink">
                ${t.total}
              </div>

              <div className="w-24 text-center text-ink-muted uppercase text-xs">
                {t.metodo}
              </div>

              <div className="w-28 text-center">
                <span className={badgeCls[t.estado]}>
                  {t.estado?.toUpperCase()}
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}