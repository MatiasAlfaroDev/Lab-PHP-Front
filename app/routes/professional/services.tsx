import { useEffect, useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Servicio = {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  modalidad: string;
  tipo: string;
  precio: number;
  duracion: number;
  pausa: number;
  min_cancelacion: number;
  activo?: boolean;
  reservas_count?: number;
};

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  modalidad: "PRESENCIAL",
  tipo: "",
  precio: "",
  duracion: "",
  pausa: "",
  min_cancelacion: "",
};

type PanelMode = "create" | "edit" | "delete" | null;
type Tab       = "servicios" | "paquetes" | "precios";

const MODALIDAD_CLS: Record<string, string> = {
  presencial: "bg-emerald-100 text-emerald-800",
  virtual:    "bg-orange-100  text-orange-700",
  hibrido:    "bg-amber-100   text-amber-800",
};

const inputCls = "w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink";
const labelCls = "block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-[18px]" : "translate-x-0.5"
      }`} />
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Services() {
  const { token } = useAuth();
  const [services,     setServices]     = useState<Servicio[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<Tab>("servicios");
  const [panelMode,    setPanelMode]    = useState<PanelMode>(null);
  const [editTarget,   setEditTarget]   = useState<Servicio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Servicio | null>(null);
  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchServicios = async () => {
    try {
      setLoading(true);
      const data: any = await api.get("/mis-servicios", token);
      if (data.success) setServices(data.data);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServicios(); }, [token]);

  // ── Panel handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditTarget(null);
    setDeleteTarget(null);
    setPanelMode("create");
  };

  const openEdit = (s: Servicio) => {
    setDeleteTarget(null);
    setEditTarget(s);
    setForm({
      nombre:          s.nombre,
      descripcion:     s.descripcion,
      modalidad:       s.modalidad,
      tipo:            s.tipo,
      precio:          String(s.precio),
      duracion:        String(s.duracion),
      pausa:           String(s.pausa),
      min_cancelacion: String(s.min_cancelacion),
    });
    setPanelMode("edit");
  };

  const openDelete = (s: Servicio) => {
    setEditTarget(null);
    setDeleteTarget(s);
    setPanelMode("delete");
  };

  const closePanel = () => {
    setPanelMode(null);
    setEditTarget(null);
    setDeleteTarget(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const body = {
        ...form,
        modalidad:       form.modalidad.toUpperCase(),
        precio:          Number(form.precio),
        duracion:        Number(form.duracion),
        pausa:           Number(form.pausa),
        min_cancelacion: Number(form.min_cancelacion),
      };
      if (panelMode === "create") {
        await api.post("/servicios", body, token);
        showToast("Servicio creado");
      } else if (panelMode === "edit" && editTarget) {
        await api.put(`/servicios/${editTarget.servicio_id}`, body, token);
        showToast("Servicio actualizado");
      }
      closePanel();
      fetchServicios();
    } catch (err: any) {
      showToast(err.message ?? "Error al guardar", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await api.delete(`/servicios/${deleteTarget.servicio_id}`, token);
      showToast("Servicio eliminado");
      closePanel();
      fetchServicios();
    } catch (err: any) {
      showToast(err.message ?? "Error al eliminar", false);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = (s: Servicio) => {
    setServices((prev) =>
      prev.map((x) => x.servicio_id === s.servicio_id ? { ...x, activo: !(x.activo ?? true) } : x)
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded border text-sm font-semibold shadow-lg ${
          toast.ok ? "bg-accent text-ink border-ink/20" : "bg-red-100 text-red-800 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border pb-0">
        {([
          { id: "servicios", label: "Servicios individuales" },
          { id: "paquetes",  label: "Paquetes" },
          { id: "precios",   label: "Precios y promociones" },
        ] as { id: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t transition-colors cursor-pointer -mb-px border-b-2 ${
              activeTab === tab.id
                ? "border-ink text-ink bg-surface"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== "servicios" ? (
        <div className="bg-surface border border-border rounded p-12 text-center">
          <p className="text-sm text-ink-muted">Próximamente</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-ink-muted text-sm">
              {loading ? "Cargando..." : `${services.length} servicios registrados`}
            </p>
            <button
              onClick={openCreate}
              className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors cursor-pointer"
            >
              + Nuevo servicio
            </button>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm">
              Cargando servicios...
            </div>
          ) : services.length === 0 ? (
            <div className="bg-surface border border-border rounded p-12 text-center">
              <p className="font-display text-xl text-ink mb-1">Sin servicios aún</p>
              <p className="text-ink-muted text-sm mb-5">
                Creá tu primer servicio para que los clientes puedan reservar
              </p>
              <button
                onClick={openCreate}
                className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors cursor-pointer"
              >
                + Nuevo servicio
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded overflow-hidden">
              {/* Cabecera */}
              <div className="grid px-5 py-2 border-b border-border bg-bg" style={{ gridTemplateColumns: "2fr 100px 140px 80px 140px 72px" }}>
                {["SERVICIO", "DURACIÓN", "MODALIDAD", "PRECIO", "RESERVAS", ""].map((h) => (
                  <div key={h} className="text-xs font-bold text-ink-muted uppercase tracking-widest">{h}</div>
                ))}
              </div>

              {/* Filas */}
              {services.map((s) => {
                const activo    = s.activo ?? true;
                const isActive  = (panelMode === "edit"   && editTarget?.servicio_id   === s.servicio_id) ||
                                  (panelMode === "delete" && deleteTarget?.servicio_id === s.servicio_id);
                const modalidad = s.modalidad?.toLowerCase();
                return (
                  <div
                    key={s.servicio_id}
                    className={`grid px-5 py-4 border-b border-border last:border-b-0 items-center transition-colors ${
                      isActive ? "bg-accent/10" : "hover:bg-bg"
                    }`}
                    style={{ gridTemplateColumns: "2fr 100px 140px 80px 140px 72px" }}
                  >
                    {/* Servicio */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Toggle checked={activo} onChange={() => toggleActivo(s)} />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${activo ? "text-ink" : "text-ink-muted"}`}>
                          {s.nombre}
                        </p>
                        {s.descripcion && (
                          <p className="text-xs text-ink-muted truncate">{s.descripcion}</p>
                        )}
                      </div>
                    </div>

                    {/* Duración */}
                    <div className="text-sm text-ink">{s.duracion} min</div>

                    {/* Modalidad */}
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${MODALIDAD_CLS[modalidad] ?? "bg-gray-100 text-gray-700"}`}>
                        {s.modalidad}
                      </span>
                    </div>

                    {/* Precio */}
                    <div className="font-display text-sm font-bold text-ink">${s.precio}</div>

                    {/* Reservas */}
                    <div className="text-sm text-ink-muted">
                      {s.reservas_count != null ? `${s.reservas_count} este año` : "—"}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded hover:bg-border/40 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => openDelete(s)}
                        className="p-1.5 rounded hover:bg-border/40 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title="Más opciones"
                      >
                        <DotsIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Drawer de edición / creación / borrado ─────────────────────────── */}
      {panelMode && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={closePanel} />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border shadow-2xl z-50 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg shrink-0">
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
                {panelMode === "create" ? "Nuevo servicio" : panelMode === "edit" ? "Editar servicio" : "Eliminar servicio"}
              </p>
              <button onClick={closePanel} className="text-ink-muted hover:text-ink transition-colors cursor-pointer">
                <CloseIcon />
              </button>
            </div>

            {panelMode === "delete" && deleteTarget ? (
              <>
                <div className="flex-1 px-5 py-6">
                  <p className="text-sm text-ink-muted">
                    ¿Eliminar{" "}
                    <span className="font-semibold text-ink">"{deleteTarget.nombre}"</span>?
                    Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="flex gap-2 px-5 py-4 border-t border-border shrink-0">
                  <button onClick={closePanel}
                    className="flex-1 border border-border px-3 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button onClick={handleDelete} disabled={saving}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer">
                    {saving ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <div>
                    <label className={labelCls}>Nombre</label>
                    <input className={inputCls} placeholder="Ej. Sesión individual" value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                  </div>

                  <div>
                    <label className={labelCls}>Descripción</label>
                    <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Describe el servicio..."
                      value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Modalidad</label>
                      <select className={inputCls} value={form.modalidad}
                        onChange={(e) => setForm({ ...form, modalidad: e.target.value })}>
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="VIRTUAL">Virtual</option>
                        <option value="HIBRIDO">Híbrido</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Tipo</label>
                      <input className={inputCls} placeholder="Consulta..." value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Precio ($)</label>
                      <input type="number" className={inputCls} placeholder="0" value={form.precio}
                        onChange={(e) => setForm({ ...form, precio: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Duración (min)</label>
                      <input type="number" className={inputCls} placeholder="50" value={form.duracion}
                        onChange={(e) => setForm({ ...form, duracion: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Pausa (min)</label>
                      <input type="number" className={inputCls} placeholder="10" value={form.pausa}
                        onChange={(e) => setForm({ ...form, pausa: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Cancelación (hrs)</label>
                      <input type="number" className={inputCls} placeholder="24" value={form.min_cancelacion}
                        onChange={(e) => setForm({ ...form, min_cancelacion: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 px-5 py-4 border-t border-border shrink-0">
                  <button onClick={closePanel}
                    className="flex-1 border border-border px-3 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-ink text-white px-3 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer">
                    {saving ? "Guardando..." : panelMode === "create" ? "Crear" : "Guardar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="5"  cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
