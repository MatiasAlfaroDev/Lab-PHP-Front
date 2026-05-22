const transactions = [
  { date: "22 may", pro: "María Ortiz", service: "Sesión individual · paquete", amount: 40, status: "pagada" },
  { date: "15 may", pro: "Andrés Calleja", service: "Entrenamiento personalizado", amount: 35, status: "pagada" },
  { date: "10 may", pro: "María Ortiz", service: "Paquete 8 sesiones", amount: 320, status: "pagada" },
  { date: "5 may", pro: "Liana Souza", service: "Asesoría nutricional", amount: 42, status: "reembolsada" },
];

const badgeCls: Record<string, string> = {
  pagada: "badge badge-pagada",
  reembolsada: "badge badge-cancelada",
};

export default function ClientPayments() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-6">Pagos</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: "TOTAL ESTE MES", value: "€395" },
          { label: "TRANSACCIONES", value: "4" },
        ].map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded p-5">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">{c.label}</p>
            <p className="font-display text-3xl text-ink font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
          {["FECHA", "PROFESIONAL", "SERVICIO", "MONTO", "ESTADO"].map((h, i) => (
            <div key={i} className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-1" : i === 1 ? "col-span-3" : i === 2 ? "col-span-4" : i === 3 ? "col-span-2" : "col-span-2"}`}>{h}</div>
          ))}
        </div>
        {transactions.map((t, i) => (
          <div key={i} className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors">
            <div className="col-span-1"><span className="text-sm text-ink-muted">{t.date}</span></div>
            <div className="col-span-3"><span className="text-sm font-semibold text-ink">{t.pro}</span></div>
            <div className="col-span-4"><span className="text-sm text-ink-muted">{t.service}</span></div>
            <div className="col-span-2"><span className="font-display text-lg font-bold text-ink">€{t.amount}</span></div>
            <div className="col-span-2"><span className={badgeCls[t.status]}>{t.status.toUpperCase()}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
