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

const badgeCls: Record<string, string> = {
  aprobado: "badge badge-confirmada",
  pendiente: "badge badge-pendiente",
};

const COLS = "120px minmax(160px, 3fr) minmax(180px, 4fr) 120px 120px";

export default function Payments() {
  const { token, user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!token || !user) return;

    api
      .get("/profesional/pagos", token)
      .then((res: any) => setTransactions(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, user]);

  const filteredTransactions = transactions.filter((t) =>
    `${t.cliente} ${t.servicio}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="w-full">

      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o servicio"
            className="w-full pl-8 pr-3 py-1.5 text-sm text-ink placeholder-ink-muted bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          <div className="min-w-max">
          <div className="grid px-5 py-2 border-b border-border" style={{ gridTemplateColumns: COLS }}>
            {["Fecha", "Cliente", "Servicio", "Monto", "Estado"].map((h) => (
              <div key={h} className="text-sm text-ink-muted">{h}</div>
            ))}
          </div>
          <div className="px-5 py-2 border-b border-border bg-sidebar">
            <div className="h-3.5 w-24 rounded bg-border animate-pulse" />
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className={`grid px-5 py-4 items-center ${row > 0 ? "border-t border-border" : ""}`}
              style={{ gridTemplateColumns: COLS }}
            >
              <div className="h-3.5 w-16 rounded bg-border animate-pulse" />
              <div className="h-3.5 w-32 rounded bg-border animate-pulse" />
              <div className="h-3.5 w-28 rounded bg-border animate-pulse" />
              <div className="h-3.5 w-12 rounded bg-border animate-pulse" />
              <div className="h-5 w-16 rounded bg-border animate-pulse" />
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && transactions.length === 0 && (
        <div className="m-4 bg-surface border border-border rounded p-12 text-center">
          <p className="font-display text-xl text-ink mb-1">Sin transacciones aún</p>
          <p className="text-ink-muted text-sm">
            Los pagos de tus reservas van a aparecer acá
          </p>
        </div>
      )}

      {/* Sin resultados de búsqueda */}
      {!loading && transactions.length > 0 && filteredTransactions.length === 0 && (
        <div className="m-4 bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm">
          No se encontraron pagos para "{search}"
        </div>
      )}

      {/* Tabla */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          <div className="min-w-max">
          {/* Cabecera */}
          <div className="grid px-5 py-2 border-b border-border" style={{ gridTemplateColumns: COLS }}>
            {["Fecha", "Cliente", "Servicio", "Monto", "Estado"].map((h) => (
              <div key={h} className="text-sm text-ink-muted">{h}</div>
            ))}
          </div>

          {/* Sección */}
          <div className="px-5 py-2 border-b border-border bg-sidebar">
            <div className="min-w-max">
              <span className="text-sm font-bold text-ink">Pagos</span>
            </div>
          </div>

          {filteredTransactions.map((t, idx) => (
            <div
              key={idx}
              className={`grid px-5 py-4 items-center hover:bg-bg transition-colors ${idx > 0 ? "border-t border-border" : ""}`}
              style={{ gridTemplateColumns: COLS }}
            >
              <span className="text-sm text-ink-muted whitespace-nowrap">{t.fecha}</span>
              <span className="text-sm text-ink truncate">{t.cliente}</span>
              <span className="text-sm text-ink-muted break-words whitespace-normal">{t.servicio}</span>
              <span className="text-sm text-ink">${t.monto}</span>
              <span>
                <span className={badgeCls[t.estado] ?? "badge"}>{t.estado.toUpperCase()}</span>
              </span>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
