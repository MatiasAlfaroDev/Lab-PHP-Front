import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

const STEPS = [
  "Paquete",
  "Pago",
  "Confirmación"
];

type PayMethod = "card";

export default function CompraPackagePay() {
const { id } = useParams();
const { token } = useAuth();
const [compra, setCompra] = useState<any>(null);
const [loadingPaquete, setLoadingPaquete] = useState(true);
const navigate = useNavigate();
const [method, setMethod] = useState<PayMethod>("card");
const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
        setLoading(true);

        const pago: any = await api.post(
            `/pagos/paquete/${id}/paypal`,
            {},
            token
        );

        if (pago.approval_url) {
        window.location.href = pago.approval_url;
        return;
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    if (!token || !id) return;

    api
        .get(`/compra-paquetes/${id}`, token)
        .then((res) => {
        console.log("COMPRA:", res);
        setCompra(res);
        })
        .catch((err) => {
        console.error("ERROR COMPRA:", err);
        })
        .finally(() => {
        setLoadingPaquete(false);
        });
    }, [id, token]);

    if (loadingPaquete) {
        return <p className="p-4 md:p-8">Cargando...</p>;
    }

    if (!compra) {
        return <p className="p-4 md:p-8">Compra no encontrada</p>;
    }


  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-muted mb-6 flex items-center gap-2">
        <Link to="/client/discover" className="hover:text-ink">Descubrir</Link>
        <span>·</span>
        <span>Paquetes</span>
        <span>·</span>
        <span>Compra</span>
      </nav>

      <h1 className="font-display italic text-3xl text-ink mb-6">Confirmá tu compra</h1>

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
                <p className="text-sm font-medium text-ink">Paypal</p>
                <p className="text-xs text-ink-muted">Visa, Mastercard</p>
              </div>
            </label>
        </div>
          <div className="flex items-center gap-4 pt-2">
            <Link
              to="/client/discover"
              className="flex items-center gap-2 border border-border px-5 py-3 rounded-xl text-sm font-medium text-ink hover:bg-bg transition-colors"
            >
              ← Volver
            </Link>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "Procesando..." : "Confirmar compra →"}
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
                <p className="text-sm font-semibold text-ink">{compra?.paquete?.nombre}</p>
                <p className="text-xs text-ink-muted">{compra?.paquete?.descripcion}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-4">
              {[
                ["Paquete", compra?.paquete?.nombre],
               // ["Sesiones", compra?.paquete?.sesiones],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-ink-muted">{label}</span>
                  <span className="text-ink font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-base font-semibold mt-2">
                <span className="text-ink">Total</span>
                <span className="font-display italic text-2xl text-ink">{Number(compra?.paquete?.precio_total).toFixed(2)}</span>
              </div>
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
