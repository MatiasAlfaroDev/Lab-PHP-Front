import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useSearchParams } from "react-router";

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

const TIPO_BADGE: Record<"reserva" | "paquete", string> = {
  reserva: "text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800",
  paquete: "text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [reservas, setReservas]   = useState<Reserva[]>([]);
  const [comprasPaquetes, setComprasPaquetes] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Reserva | null>(null);
  const [method, setMethod]       = useState<"paypal" | "presencial">("presencial");
  const [loadingPay, setLoadingPay] = useState(false);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    const pago = searchParams.get("pago");
    if (!pago) return;

    if (pago === "success") toast.success("Pago realizado correctamente");
    else if (pago === "cancelled") toast.info("Pago cancelado");

    const next = new URLSearchParams(searchParams);
    next.delete("pago");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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

  const q = search.trim().toLowerCase();
  const matchesReserva = (r: Reserva) =>
    !q || r.servicio.nombre.toLowerCase().includes(q) || r.servicio.profesional_nombre.toLowerCase().includes(q);
  const matchesPaquete = (p: any) => !q || p.paquete.nombre.toLowerCase().includes(q);

  const conPago   = reservas.filter((r) => r.pago).filter(matchesReserva);
  const pendientes = conPago.filter((r) => r.pago?.estado === "pendiente");
  const comprasFiltradas = comprasPaquetes.filter(matchesPaquete);
  const paquetesPendientes = comprasFiltradas.filter((p) => p.pago?.estado === "pendiente");

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

  if (loading) return <p className="p-8 text-ink-muted">Cargando...</p>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} closeOnClick pauseOnHover />

      <div className="w-full">
        {/* Toolbar — búsqueda, coherente con /professional/services */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pagos"
              className="w-full pl-8 pr-3 py-1.5 text-sm text-ink placeholder-ink-muted bg-transparent focus:outline-none"
            />
          </div>
        </div>

      <div className="p-4 md:p-6">

        {/* Pendientes */}
        <h2 className="text-lg font-semibold text-ink mb-3">Pendientes de pago</h2>

        <div className="border border-border rounded-2xl overflow-hidden mb-10 bg-surface">
          {pendientes.length === 0 && paquetesPendientes.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-muted">No hay pagos pendientes</p>
          ) : (
            <>
              {pendientes.map((r, i) => (
                <div
                  key={`reserva-${r.reserva_id}`}
                  className={`flex justify-between items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ink truncate">{r.servicio.nombre}</p>
                    <p className="text-xs text-ink-muted">
                      {r.servicio.profesional_nombre} · {r.fecha} {r.hora.slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={TIPO_BADGE.reserva}>Reserva</span>
                    <span className="text-sm font-bold text-ink">${r.servicio.precio}</span>
                    <button
                      onClick={() => openModal(r)}
                      className="bg-ink-fixed text-white px-4 py-1.5 rounded-full hover:bg-primary transition-colors cursor-pointer text-xs font-semibold"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
              {paquetesPendientes.map((compra, i) => (
                <div
                  key={`paquete-${compra.compra_paquete_id}`}
                  className={`flex justify-between items-center gap-4 px-5 py-4 ${(pendientes.length > 0 || i > 0) ? "border-t border-border" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ink truncate">{compra.paquete.nombre}</p>
                    <p className="text-xs text-ink-muted">Compra #{compra.compra_paquete_id}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={TIPO_BADGE.paquete}>Paquete</span>
                    <span className="text-sm font-bold text-ink">${compra.paquete.precio_total}</span>
                    <button
                      onClick={() => navigate(`/client/compra-package/${compra.compra_paquete_id}/pay`)}
                      className="bg-ink-fixed text-white px-4 py-1.5 rounded-full hover:bg-primary transition-colors cursor-pointer text-xs font-semibold"
                    >
                      Completar pago
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Historial de reservas — coherente con /professional/services */}
        <h2 className="text-lg font-semibold text-ink mb-3">Historial de reservas</h2>
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          <div style={{ minWidth: "520px" }}>
            <div className="grid px-0 py-2 border-b border-border" style={{ gridTemplateColumns: "2fr 110px 100px 110px" }}>
              {["Servicio", "Fecha", "Monto", "Estado"].map((h) => (
                <div key={h} className="text-sm text-ink-muted">{h}</div>
              ))}
            </div>
            <div className="px-0 py-2 border-b border-border bg-sidebar">
              <span className="text-sm font-bold text-ink">Historial de reservas</span>
            </div>
            {conPago.length === 0 ? (
              <div className="px-5 py-6 text-sm text-ink-muted">Sin registros</div>
            ) : (
              conPago.map((r, idx) => (
                <div
                  key={r.reserva_id}
                  className={`grid px-5 py-4 items-center ${idx > 0 ? "border-t border-border" : ""}`}
                  style={{ gridTemplateColumns: "2fr 110px 100px 110px" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{r.servicio.nombre}</p>
                    <p className="text-xs text-ink-muted truncate mt-0.5">{r.servicio.profesional_nombre}</p>
                  </div>
                  <div className="text-sm text-ink-muted">{r.fecha}</div>
                  <div className="text-sm font-bold text-ink">${r.servicio.precio}</div>
                  <div>
                    <span className={badgeCls[r.pago?.estado ?? "pendiente"]}>
                      {(r.pago?.estado ?? "pendiente").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Historial de paquetes — mismo patrón */}
        <h2 className="text-lg font-semibold text-ink mb-3 mt-8">Historial de paquetes</h2>
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          <div style={{ minWidth: "400px" }}>
            <div className="grid px-0 py-2 border-b border-border" style={{ gridTemplateColumns: "2fr 110px 100px 110px" }}>
              {["Paquete", "Fecha", "Monto", "Estado"].map((h) => (
                <div key={h} className="text-sm text-ink-muted">{h}</div>
              ))}
            </div>
            <div className="px-0 py-2 border-b border-border bg-sidebar">
              <span className="text-sm font-bold text-ink">Historial de paquetes</span>
            </div>
            {comprasFiltradas.length === 0 ? (
              <div className="px-5 py-6 text-sm text-ink-muted">Sin registros</div>
            ) : (
              comprasFiltradas.map((compra, idx) => (
                <div
                  key={compra.compra_paquete_id}
                  className={`grid px-5 py-4 items-center ${idx > 0 ? "border-t border-border" : ""}`}
                  style={{ gridTemplateColumns: "2fr 110px 100px 110px" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{compra.paquete.nombre}</p>
                    <p className="text-xs text-ink-muted truncate mt-0.5">Compra #{compra.compra_paquete_id}</p>
                  </div>
                  <div className="text-sm text-ink-muted">{compra.fecha_compra}</div>
                  <div className="text-sm font-bold text-ink">${compra.paquete.precio_total}</div>
                  <div>
                    <span className={badgeCls[compra.pago?.estado ?? "pendiente"]}>
                      {(compra.pago?.estado ?? "pendiente").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-[480px] mx-4 space-y-4"
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

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
