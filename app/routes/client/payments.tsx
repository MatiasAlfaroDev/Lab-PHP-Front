import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

interface Reserva {
  reserva_id: number;
  fecha: string;
  hora: string;
  estado: string;

  servicio: {
    nombre: string;
    precio: number;
    profesional_nombre: string;
  };

  pago?: {
    pago_id?: number;
    estado: "pendiente" | "aprobado" | "rechazado" | "fallido";
  } | null;
}

const badgeCls: Record<string, string> = {
  pendiente: "badge badge-pendiente",
  aprobado: "badge badge-pagada",
  rechazado: "badge badge-cancelada",
  fallido: "badge badge-cancelada",
};

export default function ClientPayments() {
  const { token } = useAuth();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Reserva | null>(null);
  const [method, setMethod] = useState<"paypal" | "presencial">("paypal");
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    if (!token) return;

    api
      .get<{ success: boolean; data: Reserva[] }>("/mis-reservas", token)
      .then((res) => {
        if (res.success) setReservas(res.data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // SOLO reservas con pago creado
  const conPago = reservas.filter((r) => r.pago);

  // pendientes
  const pendientes = conPago.filter(
    (r) => r.pago?.estado === "pendiente"
  );

  // pagadas
  const pagadas = conPago.filter(
    (r) => r.pago?.estado === "aprobado"
  );

  const iniciarPago = async () => {
    if (!selected) return;

    setLoadingPay(true);

    try {
      const endpoint =
        method === "paypal"
          ? `/pagos/reserva/${selected.reserva_id}/paypal`
          : `/pagos/reserva/${selected.reserva_id}/presencial`;

      const res: any = await api.post(endpoint, {}, token);

      // PayPal redirect
      if (method === "paypal" && res.approval_url) {
        window.location.href = res.approval_url;
        return;
      }

      // presencial → marcar como aprobado localmente
      setReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === selected.reserva_id
            ? {
                ...r,
                pago: {
                  ...r.pago!,
                  estado: "aprobado",
                },
              }
            : r
        )
      );

      setSelected(null);
    } catch (e) {
      alert("Error procesando pago");
    } finally {
      setLoadingPay(false);
    }
  };

  if (loading) return <p className="p-8">Cargando...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-6">Pagos</h1>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-border rounded p-5">
          <p className="text-xs font-bold text-ink-muted uppercase">
            PENDIENTE
          </p>
          <p className="text-3xl font-bold text-ink">
            €
            {pendientes.reduce(
              (acc, r) => acc + Number(r.servicio.precio),
              0
            )}
          </p>
        </div>

        <div className="bg-surface border border-border rounded p-5">
          <p className="text-xs font-bold text-ink-muted uppercase">
            PAGADAS
          </p>
          <p className="text-3xl font-bold text-ink">{pagadas.length}</p>
        </div>
      </div>

      {/* PENDIENTES */}
      <h2 className="text-lg font-semibold mb-3">Pendientes de pago</h2>

      <div className="space-y-3 mb-10">
        {pendientes.length === 0 && (
          <p className="text-sm text-ink-muted">
            No hay pagos pendientes 🎉
          </p>
        )}

        {pendientes.map((r) => (
          <div
            key={r.reserva_id}
            className="flex justify-between items-center border border-border rounded p-4 bg-surface"
          >
            <div>
              <p className="font-semibold text-ink">
                {r.servicio.nombre}
              </p>

              <p className="text-xs text-ink-muted">
                {r.servicio.profesional_nombre} · {r.fecha} {r.hora}
              </p>

              <p className="text-sm font-bold text-ink">
                €{r.servicio.precio}
              </p>
            </div>

            <button
              onClick={() => {
                setSelected(r);
                setMethod("paypal");
              }}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover"
            >
              Pagar
            </button>
          </div>
        ))}
      </div>

      {/* HISTORIAL */}
      <h2 className="text-lg font-semibold mb-3">Historial</h2>

      <div className="bg-surface border border-border rounded overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b text-xs font-bold text-ink-muted uppercase">
          <div className="col-span-2">FECHA</div>
          <div className="col-span-4">SERVICIO</div>
          <div className="col-span-3">PROFESIONAL</div>
          <div className="col-span-2">MONTO</div>
          <div className="col-span-1">ESTADO</div>
        </div>

        {conPago.map((r) => (
          <div
            key={r.reserva_id}
            className="grid grid-cols-12 px-5 py-4 border-b items-center"
          >
            <div className="col-span-2 text-sm text-ink-muted">
              {r.fecha}
            </div>

            <div className="col-span-4 text-sm text-ink">
              {r.servicio.nombre}
            </div>

            <div className="col-span-3 text-sm text-ink-muted">
              {r.servicio.profesional_nombre}
            </div>

            <div className="col-span-2 font-bold text-ink">
              €{r.servicio.precio}
            </div>

            <div className="col-span-1">
              <span
                className={badgeCls[r.pago?.estado ?? "pendiente"]}
              >
                {(r.pago?.estado ?? "pendiente").toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PRO (BOOKING STYLE) */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-[520px] space-y-5">

            <h2 className="text-lg font-semibold text-ink">
              Método de pago
            </h2>

            {/* PayPal */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer ${
                method === "paypal"
                  ? "border-primary bg-primary-soft/20"
                  : "border-border bg-surface hover:bg-bg"
              }`}
            >
              <input
                type="radio"
                checked={method === "paypal"}
                onChange={() => setMethod("paypal")}
              />
              <span>🅿️ PayPal</span>
              <div>
                <p className="text-sm text-ink">Pago online seguro</p>
                <p className="text-xs text-ink-muted">
                  Redirección automática
                </p>
              </div>
            </label>

            {/* Presencial */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer ${
                method === "presencial"
                  ? "border-primary bg-primary-soft/20"
                  : "border-border bg-surface hover:bg-bg"
              }`}
            >
              <input
                type="radio"
                checked={method === "presencial"}
                onChange={() => setMethod("presencial")}
              />
              <span>💵</span>
              <div>
                <p className="text-sm text-ink">Pago presencial</p>
                <p className="text-xs text-ink-muted">
                  El profesional lo confirma
                </p>
              </div>
            </label>

            {/* resumen */}
            <div className="border-t border-border pt-4 text-sm">
              <p className="text-ink-muted">Total</p>
              <p className="text-2xl font-display text-ink">
                €{selected.servicio.precio}
              </p>
            </div>

            {/* actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-border rounded-xl py-2"
              >
                Cancelar
              </button>

              <button
                onClick={iniciarPago}
                disabled={loadingPay}
                className="flex-1 bg-primary text-white rounded-xl py-2"
              >
                {loadingPay ? "Procesando..." : "Confirmar pago"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}