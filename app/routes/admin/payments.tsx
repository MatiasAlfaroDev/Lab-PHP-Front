import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

const badgeCls: Record<string, string> = {
  aprobado: "badge badge-confirmada",
  pendiente: "badge badge-pendiente",
};

const PAYMENTS_COLS = "96px 1.4fr 1.4fr 2fr 90px 100px 110px";

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border/60 ${className}`} />;
}

function PaymentsSkeleton() {
  return (
    <div className="p-4 md:p-8 w-full">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded p-5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-surface border-t border-border w-full overflow-x-auto">
        <div style={{ minWidth: "640px" }}>
          <div className="grid px-5 py-2 border-b border-border" style={{ gridTemplateColumns: PAYMENTS_COLS }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className={`grid px-5 py-4 items-center ${row > 0 ? "border-t border-border" : ""}`}
              style={{ gridTemplateColumns: PAYMENTS_COLS }}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-16" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPayments() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [token]);

  if (loading) return <PaymentsSkeleton />;

  return (
    <div className="p-4 md:p-8 w-full">
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
      <div className="bg-surface border-t border-border w-full overflow-x-auto">
        <div style={{ minWidth: "640px" }}>
          {/* HEADER */}
          <div
            className="grid px-5 py-2 border-b border-border"
            style={{ gridTemplateColumns: PAYMENTS_COLS }}
          >
            <div className="text-sm text-ink-muted">Fecha</div>
            <div className="text-sm text-ink-muted">De</div>
            <div className="text-sm text-ink-muted">Para</div>
            <div className="text-sm text-ink-muted">Servicio</div>
            <div className="text-sm text-ink-muted">Total</div>
            <div className="text-sm text-ink-muted">Método</div>
            <div className="text-sm text-ink-muted">Estado</div>
          </div>

          {/* ROWS */}
          {transactions.map((t, i) => (
            <div
              key={i}
              className={`grid px-5 py-4 items-center hover:bg-bg transition-colors text-sm ${i > 0 ? "border-t border-border" : ""}`}
              style={{ gridTemplateColumns: PAYMENTS_COLS }}
            >
              <div className="text-ink-muted">{t.fecha}</div>
              <div className="text-ink font-semibold truncate pr-2">{t.de}</div>
              <div className="text-ink font-semibold truncate pr-2">{t.para}</div>
              <div className="text-ink-muted truncate pr-2">{t.servicio}</div>
              <div className="font-bold text-ink">${t.total}</div>
              <div className="text-ink-muted uppercase text-xs">{t.metodo}</div>
              <div>
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