import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

const STEPS = ["Servicio", "Fecha y hora", "Modalidad", "Pago", "Confirmación"];

type PayMethod = "card" | "mercadopago" | "package";

export default function BookingPay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PayMethod>("card");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    navigate(`/session/1/rating`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-muted mb-6 flex items-center gap-2">
        <Link to="/client/discover" className="hover:text-ink">Descubrir</Link>
        <span>·</span>
        <Link to={`/client/professional/${id}`} className="hover:text-ink">María Ortiz</Link>
        <span>·</span>
        <span>Reserva</span>
      </nav>

      <h1 className="font-display italic text-3xl text-ink mb-6">Confirmá tu reserva</h1>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  i < 3
                    ? "bg-primary border-primary text-white"
                    : i === 3
                    ? "border-primary text-primary bg-surface"
                    : "border-border text-ink-muted bg-surface"
                }`}
              >
                {i < 3 ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  i === 3 ? "text-ink" : i < 3 ? "text-primary" : "text-ink-muted"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 ${i < 3 ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Payment form */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold text-ink">Método de pago</h2>
          <p className="text-sm text-ink-muted">Elegí cómo abonar tu sesión. El cobro se realiza al confirmar.</p>

          {/* Methods */}
          <div className="space-y-3">
            {/* Card */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                method === "card" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"
              }`}
            >
              <input
                type="radio"
                name="method"
                value="card"
                checked={method === "card"}
                onChange={() => setMethod("card")}
                className="accent-primary"
              />
              <span className="text-lg">💳</span>
              <div>
                <p className="text-sm font-medium text-ink">Tarjeta de crédito o débito</p>
                <p className="text-xs text-ink-muted">Visa, Mastercard, Amex</p>
              </div>
            </label>

            {/* MercadoPago */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                method === "mercadopago" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"
              }`}
            >
              <input
                type="radio"
                name="method"
                value="mercadopago"
                checked={method === "mercadopago"}
                onChange={() => setMethod("mercadopago")}
                className="accent-primary"
              />
              <span className="text-lg">$</span>
              <div>
                <p className="text-sm font-medium text-ink">Mercado Pago</p>
                <p className="text-xs text-ink-muted">Saldo, tarjetas y transferencia</p>
              </div>
            </label>

            {/* Package */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                method === "package" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"
              }`}
            >
              <input
                type="radio"
                name="method"
                value="package"
                checked={method === "package"}
                onChange={() => setMethod("package")}
                className="accent-primary"
              />
              <span className="text-lg">📦</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">Usar paquete activo</p>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Recomendado</span>
                </div>
                <p className="text-xs text-ink-muted">3 sesiones restantes · vence 12 ago</p>
              </div>
            </label>
          </div>

          {/* Card form */}
          {method === "card" && (
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-ink">Datos de la tarjeta</h3>
              <div>
                <label className="block text-xs text-ink-muted mb-1">Número</label>
                <input
                  defaultValue="4242 4242 4242 4242"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Vencimiento</label>
                  <input
                    defaultValue="08/27"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1">CVV</label>
                  <input
                    defaultValue="•••"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Titular</label>
                  <input
                    defaultValue="Lucía Pérez"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Link
              to={`/client/professional/${id}`}
              className="flex items-center gap-2 border border-border px-5 py-3 rounded-xl text-sm font-medium text-ink hover:bg-bg transition-colors"
            >
              ← Volver
            </Link>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "Procesando..." : "Confirmar y pagar €48 →"}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-4">Resumen</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-400 flex items-center justify-center text-white text-sm font-semibold">
                MO
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">María Ortiz</p>
                <p className="text-xs text-ink-muted">Psicología clínica</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-4">
              {[
                ["Servicio", "Sesión individual"],
                ["Duración", "50 min"],
                ["Fecha", "Vie 22 may · 15:00"],
                ["Modalidad", "Virtual"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-ink-muted">{label}</span>
                  <span className="text-ink font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Subtotal</span>
                <span className="text-ink">€48.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Comisión plataforma</span>
                <span className="text-ink">incluida</span>
              </div>
              <div className="flex justify-between text-base font-semibold mt-2">
                <span className="text-ink">Total</span>
                <span className="font-display italic text-2xl text-ink">€48.00</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-ink-muted">
              <span>○</span>
              <span>Pago seguro · cifrado SSL</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">🔔</span>
              <div>
                <p className="text-sm font-medium text-ink">Recordatorios automáticos</p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Te enviaremos un mail 24h y 1h antes con el enlace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
