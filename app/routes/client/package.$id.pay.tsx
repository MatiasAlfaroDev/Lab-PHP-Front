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

function PayPalLogo() {
  return (
    <span className="flex items-center gap-0 leading-none select-none" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fontStyle: "italic", fontSize: "17px" }}>
      <span style={{ color: "#003087" }}>Pay</span>
      <span style={{ color: "#009cde" }}>Pal</span>
    </span>
  );
}

export default function PackagePay() {
  const { id } = useParams();
  const { token } = useAuth();
  const [paquete, setPaquete] = useState<any>(null);
  const [loadingPaquete, setLoadingPaquete] = useState(true);
  const navigate = useNavigate();
  const [method, setMethod] = useState<PayMethod>("card");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const compra: any = await api.post(
        "/compra-paquetes",
        {
          paquete_id: Number(id),
        },
        token
      );

      const pago: any = await api.post(
        `/pagos/paquete/${compra.compra_paquete_id}/paypal`,
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
      .get(`/paquetes/${id}`, token)
      .then((res) => {
        setPaquete(res);
      })
      .catch((err) => {
        console.error("ERROR PAQUETE:", err);
      })
      .finally(() => {
        setLoadingPaquete(false);
      });
  }, [id, token]);

  if (loadingPaquete) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!paquete) {
    return (
      <div className="flex flex-col items-center py-20 text-center gap-3">
        <ion-icon name="cube-outline" style={{ fontSize: "40px", color: "var(--color-ink-muted)" }} />
        <p className="text-ink font-medium">Paquete no encontrado</p>
        <Link to="/client/discover" className="text-sm text-primary hover:underline">
          Volver a explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-muted mb-6 flex items-center gap-2">
        <Link to="/client/discover" className="hover:text-ink">Descubrir</Link>
        <span>·</span>
        <span>Paquetes</span>
        <span>·</span>
        <span>Compra</span>
      </nav>

      <h1 className="font-display text-3xl text-ink mb-6">Confirmá tu compra</h1>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  i < 1
                    ? "bg-primary border-primary text-white"
                    : i === 1
                    ? "border-primary text-primary bg-surface"
                    : "border-border text-ink-muted bg-surface"
                }`}
              >
                {i < 1 ? <ion-icon name="checkmark-outline" style={{ fontSize: "14px" }} /> : i + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  i === 1 ? "text-ink" : i < 1 ? "text-primary" : "text-ink-muted"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 ${i < 1 ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl">
        {/* Payment form */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold text-ink">Método de pago</h2>

          {/* Methods */}
          <div className="space-y-3">
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
              <PayPalLogo />
              <div>
                <p className="text-sm font-medium text-ink">Pago online seguro</p>
                <p className="text-xs text-ink-muted">Redirección automática a PayPal</p>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link
              to="/client/discover"
              className="flex items-center gap-2 border border-border px-5 py-3 rounded-full text-sm font-medium text-ink hover:bg-bg transition-colors"
            >
              <ion-icon name="arrow-back-outline" style={{ fontSize: "16px" }} />
              Volver
            </Link>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-full transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Procesando..." : (
                <>
                  Confirmar compra
                  <ion-icon name="arrow-forward-outline" style={{ fontSize: "16px" }} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-4">Resumen</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center shrink-0">
                <ion-icon name="cube-outline" style={{ fontSize: "20px" }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{paquete?.nombre}</p>
                <p className="text-xs text-ink-muted truncate">{paquete?.descripcion}</p>
              </div>
            </div>

            {paquete?.servicios?.length > 0 && (
              <div className="space-y-2 text-sm border-t border-border pt-4">
                {paquete.servicios.map((s: any) => (
                  <div key={s.servicio_id} className="flex justify-between">
                    <span className="text-ink-muted">{s.nombre}</span>
                    <span className="text-ink font-medium">
                      {s.pivot?.cantidad_sesiones ?? s.cantidad_sesiones} sesiones
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border mt-4 pt-4">
              <div className="flex justify-between text-base font-semibold">
                <span className="text-ink">Total</span>
                <span className="font-display text-2xl text-ink">${Number(paquete?.precio_total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <ion-icon name="notifications-outline" style={{ fontSize: "18px", color: "var(--color-ink-muted)", marginTop: "1px" }} />
              <div>
                <p className="text-sm font-medium text-ink">Recordatorios automáticos</p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Te enviaremos un mail 24h y 1h antes de cada sesión que reserves con este paquete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
