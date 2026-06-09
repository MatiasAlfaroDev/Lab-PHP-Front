const transactions = [
  { date: "22 may", client: "Lucía Pérez", service: "Sesión individual · paquete", amount: 40, status: "liquidado" },
  { date: "21 may", client: "Carlos Ruiz", service: "Primera consulta", amount: 55, status: "pendiente" },
  { date: "20 may", client: "Marta López", service: "Sesión de pareja", amount: 78, status: "liquidado" },
  { date: "19 may", client: "Joaquín Vega", service: "Sesión individual", amount: 48, status: "liquidado" },
  { date: "18 may", client: "Sol Méndez", service: "Seguimiento breve", amount: 28, status: "pendiente" },
];

const badgeCls: Record<string, string> = {
  liquidado: "badge badge-confirmada",
  pendiente: "badge badge-pendiente",
};

export default function Payments() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Cobros</h1>
          <p className="text-ink-muted mt-1">Historial de pagos y liquidaciones</p>
        </div>
        <button className="border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink">
          Exportar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "INGRESOS DEL MES", value: "€2.840", sub: "38 sesiones" },
          { label: "PENDIENTE LIQUIDACIÓN", value: "€890", sub: "Se acreditan el viernes" },
          { label: "PRÓXIMA LIQUIDACIÓN", value: "24 may", sub: "€420 estimados" },
        ].map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded p-5">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">{c.label}</p>
            <p className="font-display text-3xl text-ink font-bold">{c.value}</p>
            <p className="text-xs text-ink-muted mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="border border-border rounded overflow-x-auto">
        <div style={{ minWidth: "520px" }}>
          <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
            {["FECHA", "CLIENTE", "SERVICIO", "MONTO", "ESTADO"].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${
                  i === 0 ? "col-span-1" : i === 1 ? "col-span-3" : i === 2 ? "col-span-4" : i === 3 ? "col-span-2" : "col-span-2"
                }`}
              >
                {h}
              </div>
            ))}
          </div>
          {transactions.map((t, i) => (
            <div key={i} className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors bg-surface">
              <div className="col-span-1"><span className="text-sm text-ink-muted">{t.date}</span></div>
              <div className="col-span-3"><span className="text-sm font-semibold text-ink">{t.client}</span></div>
              <div className="col-span-4"><span className="text-sm text-ink-muted">{t.service}</span></div>
              <div className="col-span-2"><span className="font-display text-lg font-bold text-ink">€{t.amount}</span></div>
              <div className="col-span-2"><span className={badgeCls[t.status]}>{t.status.toUpperCase()}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
