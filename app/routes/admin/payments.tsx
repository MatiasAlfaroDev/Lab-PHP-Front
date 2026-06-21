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
          <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Admin</nav>
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
            ${summary?.total ?? 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded p-5">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">
            PAGADO
          </p>
          <p className="font-display text-2xl text-ink font-bold text-green-600">
            ${summary?.pagado ?? 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded p-5">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">
            PENDIENTE
          </p>
          <p className="font-display text-2xl text-ink font-bold text-yellow-600">
            ${summary?.pendiente ?? 0}
          </p>
        </div>

      </div>

      {/* TABLE */}
      <div className="border border-border rounded overflow-x-auto">
        <div style={{ minWidth: "640px" }}>
          {/* HEADER */}
          <div
            className="grid px-5 py-3 border-b border-border bg-bg text-xs font-bold text-ink-muted uppercase tracking-widest items-center"
            style={{ gridTemplateColumns: "96px 1.4fr 1.4fr 2fr 90px 100px 110px" }}
          >
            <div>FECHA</div>
            <div>DE</div>
            <div>PARA</div>
            <div>SERVICIO</div>
            <div>TOTAL</div>
            <div className="text-center">MÉTODO</div>
            <div className="text-center">ESTADO</div>
          </div>

          {/* ROWS */}
          {transactions.map((t, i) => (
            <div
              key={i}
              className="grid px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors text-sm bg-surface"
              style={{ gridTemplateColumns: "96px 1.4fr 1.4fr 2fr 90px 100px 110px" }}
            >
              <div className="text-ink-muted">{t.fecha}</div>
              <div className="text-ink font-semibold truncate pr-2">{t.de}</div>
              <div className="text-ink font-semibold truncate pr-2">{t.para}</div>
              <div className="text-ink-muted truncate pr-2">{t.servicio}</div>
              <div className="font-bold text-ink">${t.total}</div>
              <div className="text-center text-ink-muted uppercase text-xs">{t.metodo}</div>
              <div className="text-center">
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