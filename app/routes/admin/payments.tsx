const transactions = [
  { date: "22 may", from: "Lucía Pérez", to: "María Ortiz", service: "Sesión individual", amount: 48, fee: 4.8, net: 43.2, status: "liquidado" },
  { date: "21 may", from: "Carlos Ruiz", to: "Andrés Calleja", service: "Entrenamiento", amount: 35, fee: 3.5, net: 31.5, status: "pendiente" },
  { date: "20 may", from: "Lucía Pérez", to: "Liana Souza", service: "Paquete 8 sesiones", amount: 320, fee: 32, net: 288, status: "liquidado" },
];

const badgeCls: Record<string, string> = {
  liquidado: "badge badge-confirmada",
  pendiente: "badge badge-pendiente",
};

export default function AdminPayments() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Pagos</h1>
          <p className="text-ink-muted mt-1">Todas las transacciones de la plataforma</p>
        </div>
        <button className="border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink">Exportar CSV</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "GMV DEL MES", value: "€1.84M" },
          { label: "COMISIONES", value: "€184K" },
          { label: "LIQUIDACIONES PENDIENTES", value: "€890" },
          { label: "DISPUTAS ABIERTAS", value: "3" },
        ].map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded p-5">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">{c.label}</p>
            <p className="font-display text-2xl text-ink font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
          {["FECHA", "DE", "PARA", "SERVICIO", "TOTAL", "COMISIÓN", "NETO", "ESTADO"].map((h, i) => (
            <div key={i} className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-1" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : "col-span-1"}`}>{h}</div>
          ))}
        </div>
        {transactions.map((t, i) => (
          <div key={i} className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors text-sm">
            <div className="col-span-1 text-ink-muted">{t.date}</div>
            <div className="col-span-2 text-ink font-semibold">{t.from}</div>
            <div className="col-span-2 text-ink font-semibold">{t.to}</div>
            <div className="col-span-2 text-ink-muted">{t.service}</div>
            <div className="col-span-1 font-bold text-ink">€{t.amount}</div>
            <div className="col-span-1 text-ink-muted">€{t.fee}</div>
            <div className="col-span-1 font-bold text-ink">€{t.net}</div>
            <div className="col-span-1"><span className={badgeCls[t.status]}>{t.status.toUpperCase()}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
