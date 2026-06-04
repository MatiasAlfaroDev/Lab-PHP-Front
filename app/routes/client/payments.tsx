import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router";

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
  aprobado:  "badge badge-pagada",
  rechazado: "badge badge-cancelada",
  fallido:   "badge badge-cancelada",
};

function PayPalLogo() {
  return (
    <span className="flex items-center gap-0 leading-none select-none" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fontStyle: "italic", fontSize: "15px" }}>
      <span style={{ color: "#003087" }}>Pay</span>
      <span style={{ color: "#009cde" }}>Pal</span>
    </span>
  );
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-ink">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>
  );
}

export default function ClientPayments() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reservas, setReservas]   = useState<Reserva[]>([]);
  const [comprasPaquetes, setComprasPaquetes] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Reserva | null>(null);
  const [method, setMethod]       = useState<"paypal" | "presencial">("presencial");
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get<{ success: boolean; data: Reserva[] }>("/mis-reservas", token),
      api.get<any[]>("/mis-compras-paquetes", token),
    ])
      .then(([reservasRes, paquetesRes]) => {
        if (reservasRes.success) {
          setReservas(reservasRes.data);
        }

        setComprasPaquetes(paquetesRes);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const conPago   = reservas.filter((r) => r.pago);
  const pendientes = conPago.filter((r) => r.pago?.estado === "pendiente");
  const pagadas    = conPago.filter((r) => r.pago?.estado === "aprobado");
  const paquetesPendientes = comprasPaquetes.filter((p) => p.pago?.estado === "pendiente");
  const paquetesPagados = comprasPaquetes.filter((p) => p.pago?.estado === "aprobado");

  const iniciarPago = async () => {
    if (!selected) return;
    setLoadingPay(true);
    try {
      const endpoint =
        method === "paypal"
          ? `/pagos/reserva/${selected.reserva_id}/paypal`
          : `/pagos/reserva/${selected.reserva_id}/presencial`;

      const res: any = await api.post(endpoint, {}, token);

      if (method === "paypal" && res.approval_url) {
        window.location.href = res.approval_url;
        return;
      }

      setReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === selected.reserva_id
            ? { ...r, pago: { ...r.pago!, estado: "aprobado" } }
            : r
        )
      );
      setSelected(null);
      toast.success("Pago registrado correctamente");
    } catch (e: any) {
      toast.error(e.message ?? "Error al procesar el pago");
    } finally {
      setLoadingPay(false);
    }
  };

  const openModal = (r: Reserva) => {
    setSelected(r);
    setMethod("presencial");
  };

  const totalPendienteReservas =
    pendientes.reduce(
      (acc, r) => acc + Number(r.servicio.precio),
      0
    );

  const totalPendientePaquetes =
    paquetesPendientes.reduce(
      (acc, p) => acc + Number(p.paquete.precio_total),
      0
    );

  if (loading) return <p className="p-8 text-ink-muted">Cargando...</p>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} closeOnClick pauseOnHover />

      <div className="p-8 max-w-4xl mx-auto">
        <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Cliente</nav>
        <h1 className="font-display text-3xl text-ink mb-6">Pagos</h1>

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-xs font-bold text-ink-muted uppercase mb-1">Pendiente</p>
            <p className="text-3xl font-bold text-ink">
              ${totalPendienteReservas + totalPendientePaquetes}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-xs font-bold text-ink-muted uppercase mb-1">Pagadas</p>
            <p className="text-3xl font-bold text-ink">{pagadas.length+paquetesPagados.length}</p>
          </div>
        </div>

        {/* Pendientes */}
        <h2 className="text-lg font-semibold text-ink mb-3">Reservas pendientes de pago</h2>
        
        <div className="space-y-3 mb-10">
          {pendientes.length === 0 ? (
            <p className="text-sm text-ink-muted">No hay pagos pendientes</p>
          ) : (
            pendientes.map((r) => (
              <div
                key={r.reserva_id}
                className="flex justify-between items-center border border-border rounded-2xl p-4 bg-surface"
              >
                <div>
                  <p className="font-semibold text-ink">{r.servicio.nombre}</p>
                  <p className="text-xs text-ink-muted">
                    {r.servicio.profesional_nombre} · {r.fecha} {r.hora.slice(0, 5)}
                  </p>
                  <p className="text-sm font-bold text-ink mt-1">${r.servicio.precio}</p>
                </div>
                <button
                  onClick={() => openModal(r)}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer text-sm font-medium"
                >
                  Pagar
                </button>
              </div>
            ))
          )}
          <h2 className="text-lg font-semibold text-ink mb-3 mt-8">Paquetes pendientes de pago</h2>
          {paquetesPendientes.map((compra) => (
            <div
              key={compra.compra_paquete_id}
              className="flex justify-between items-center border border-border rounded-2xl p-4 bg-surface"
            >
              <div>
                <p className="font-semibold text-ink">
                  {compra.paquete.nombre}
                </p>

                <p className="text-xs text-ink-muted">
                  Compra #{compra.compra_paquete_id}
                </p>

                <p className="text-sm font-bold text-ink mt-1">
                  ${compra.paquete.precio_total}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/client/compra-package/${compra.compra_paquete_id}/pay`
                  )
                }
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
              >
                Completar pago
              </button>
            </div>
          ))}
        </div>

        {/* Historial */}
        <h2 className="text-lg font-semibold text-ink mb-3">Historial de reservas</h2>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-border text-xs font-bold text-ink-muted uppercase">
            <div className="col-span-2">Fecha</div>
            <div className="col-span-4">Servicio</div>
            <div className="col-span-3">Profesional</div>
            <div className="col-span-2">Monto</div>
            <div className="col-span-1">Estado</div>
          </div>
          {conPago.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-muted">Sin registros</p>
          ) : (
            conPago.map((r) => (
              <div key={r.reserva_id} className="grid grid-cols-12 px-5 py-4 border-b border-border items-center last:border-0">
                <div className="col-span-2 text-sm text-ink-muted">{r.fecha}</div>
                <div className="col-span-4 text-sm text-ink">{r.servicio.nombre}</div>
                <div className="col-span-3 text-sm text-ink-muted">{r.servicio.profesional_nombre}</div>
                <div className="col-span-2 font-bold text-ink">${r.servicio.precio}</div>
                <div className="col-span-1">
                  <span className={badgeCls[r.pago?.estado ?? "pendiente"]}>
                    {(r.pago?.estado ?? "pendiente").toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      
      <h2 className="text-lg font-semibold text-ink mb-3 mt-8">Historial de paquetes</h2>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-border text-xs font-bold text-ink-muted uppercase">
          <div className="col-span-3">Fecha</div>
          <div className="col-span-5">Paquete</div>
          <div className="col-span-2">Monto</div>
          <div className="col-span-2">Estado</div>
        </div>

        {comprasPaquetes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-muted">
            Sin registros
          </p>
        ) : (
          comprasPaquetes.map((compra) => (
            <div
              key={compra.compra_paquete_id}
              className="grid grid-cols-12 px-5 py-4 border-b border-border items-center last:border-0"
            >
              <div className="col-span-3 text-sm text-ink-muted">
                {compra.fecha_compra}
              </div>

              <div className="col-span-5 text-sm text-ink">
                {compra.paquete.nombre}
              </div>

              <div className="col-span-2 font-bold text-ink">
                ${compra.paquete.precio_total}
              </div>

              <div className="col-span-2">
                <span
                  className={
                    badgeCls[
                      compra.pago?.estado ?? "pendiente"
                    ]
                  }
                >
                  {(compra.pago?.estado ?? "pendiente").toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 w-[480px] mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink">Método de pago</h2>

            {/* PayPal */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                method === "paypal"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface hover:bg-bg"
              }`}
            >
              <input
                type="radio"
                checked={method === "paypal"}
                onChange={() => setMethod("paypal")}
                className="cursor-pointer"
              />
              <PayPalLogo />
              <div>
                <p className="text-sm font-medium text-ink">Pago online seguro</p>
                <p className="text-xs text-ink-muted">Redirección automática a PayPal</p>
              </div>
            </label>

            {/* Presencial */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                method === "presencial"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface hover:bg-bg"
              }`}
            >
              <input
                type="radio"
                checked={method === "presencial"}
                onChange={() => setMethod("presencial")}
                className="cursor-pointer"
              />
              <CashIcon />
              <div>
                <p className="text-sm font-medium text-ink">Pago presencial</p>
                <p className="text-xs text-ink-muted">El profesional confirma el pago</p>
              </div>
            </label>

            {/* Resumen */}
            <div className="border-t border-border pt-4 flex items-end justify-between">
              <p className="text-sm text-ink-muted">Total a pagar</p>
              <p className="text-2xl font-display text-ink">${selected.servicio.precio}</p>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-border rounded-xl py-2 text-sm font-medium text-ink hover:bg-bg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={iniciarPago}
                disabled={loadingPay}
                className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingPay ? "Procesando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
