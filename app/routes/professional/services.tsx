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
  ubicacion?: string;
  activo?: boolean;
  reservas_count?: number;
};

type FormState = {
  nombre: string;
  descripcion: string;
  modalidad: string;
  tipo: string;
  precio: string;
  duracion: string;
  pausa: string;
  min_cancelacion: string;
  ubicacion: string;
};

const EMPTY_FORM: FormState = {
  nombre: "",
  descripcion: "",
  modalidad: "presencial",
  tipo: "",
  precio: "",
  duracion: "",
  pausa: "",
  min_cancelacion: "",
  ubicacion: "",
};

const MODALIDAD_CLS: Record<string, string> = {
  presencial: "bg-emerald-100 text-emerald-800",
  virtual:    "bg-orange-100  text-orange-700",
  hibrido:    "bg-amber-100   text-amber-800",
};

const inputCls = "w-full border border-border rounded px-3 py-2 text-sm bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink";
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

  const [services,   setServices]   = useState<Servicio[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [editingId,  setEditingId]  = useState<number | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form,       setForm]       = useState<FormState>({ ...EMPTY_FORM });
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

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

  // ── Helpers ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setDeletingId(null);
    setForm({ ...EMPTY_FORM });
    setEditingId(editingId === "new" ? null : "new");
  };

  const openEdit = (s: Servicio) => {
    setDeletingId(null);
    const id = s.servicio_id;
    if (editingId === id) { setEditingId(null); return; }
    setForm({
      nombre:          s.nombre,
      descripcion:     s.descripcion,
      modalidad:       s.modalidad,
      tipo:            s.tipo,
      precio:          String(s.precio),
      duracion:        String(s.duracion),
      pausa:           String(s.pausa),
      min_cancelacion: String(s.min_cancelacion),
      ubicacion:       s.ubicacion ?? "",
    });
    setEditingId(id);
  };

  const closeAll = () => {
    setEditingId(null);
    setDeletingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const setF = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const needsLocation = ["presencial", "hibrido"].includes(form.modalidad.toLowerCase());

  // ── Save / Delete ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.nombre.trim())   return showToast("El nombre es requerido", false);
    if (!form.tipo.trim())     return showToast("El tipo es requerido", false);
    if (!form.precio)          return showToast("El precio es requerido", false);
    if (!form.duracion)        return showToast("La duración es requerida", false);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nombre:          form.nombre,
        descripcion:     form.descripcion,
        modalidad:       form.modalidad.toLowerCase(),
        tipo:            form.tipo,
        precio:          Number(form.precio),
        duracion:        Number(form.duracion),
        pausa:           Number(form.pausa),
        min_cancelacion: Number(form.min_cancelacion),
      };
      if (needsLocation && form.ubicacion.trim()) body.ubicacion = form.ubicacion.trim();

      if (editingId === "new") {
        await api.post("/servicios", body, token);
        showToast("Servicio creado");
      } else if (typeof editingId === "number") {
        await api.put(`/servicios/${editingId}`, body, token);
        showToast("Servicio actualizado");
      }
      closeAll();
      fetchServicios();
    } catch (err: any) {
      showToast(err.message ?? "Error al guardar", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      await api.delete(`/servicios/${id}`, token);
      showToast("Servicio eliminado");
      setDeletingId(null);
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded border text-sm font-semibold shadow-lg ${
          toast.ok ? "bg-accent text-ink border-ink/20" : "bg-red-100 text-red-800 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Servicios</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {loading ? "Cargando..." : `${services.length} servicio${services.length !== 1 ? "s" : ""} registrado${services.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${
            editingId === "new"
              ? "bg-border text-ink-muted"
              : "bg-ink text-white hover:bg-primary"
          }`}
        >
          {editingId === "new" ? "Cancelar" : <b>+ Nuevo servicio</b>}
        </button>
      </div>

      {/* Form de creación (antes de la tabla) */}
      {editingId === "new" && (
        <ServiceForm
          form={form} setF={setF}
          saving={saving} isEdit={false}
          onSave={handleSave} onCancel={closeAll}
          needsLocation={needsLocation}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm">
          Cargando servicios...
        </div>
      )}

      {/* Empty */}
      {!loading && services.length === 0 && editingId !== "new" && (
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
      )}

      {/* Tabla */}
      {!loading && services.length > 0 && (
        <div className="border border-border rounded overflow-x-auto">
          <div className="bg-surface" style={{ minWidth: "640px" }}>
          {/* Cabecera */}
          <div
            className="grid px-5 py-2 border-b border-border bg-bg"
            style={{ gridTemplateColumns: "2fr 90px 130px 80px 130px 72px" }}
          >
            {["Servicio", "Duración", "Modalidad", "Precio", "Reservas", ""].map((h) => (
              <div key={h} className="text-xs font-bold text-ink-muted uppercase tracking-widest">{h}</div>
            ))}
          </div>

          {services.map((s, idx) => {
            const activo     = s.activo ?? true;
            const isEditing  = editingId === s.servicio_id;
            const isDeleting = deletingId === s.servicio_id;
            const isDimmed   = typeof editingId === "number" && !isEditing;
            const modalidad  = s.modalidad?.toLowerCase();

            return (
              <div key={s.servicio_id} className={`${idx > 0 ? "border-t border-border" : ""} ${isDimmed ? "opacity-40 pointer-events-none" : "transition-opacity"}`}>
                {/* Fila */}
                <div
                  className={`grid px-5 py-4 items-center ${
                    isEditing || isDeleting ? "bg-accent/10" : ""
                  }`}
                  style={{ gridTemplateColumns: "2fr 90px 130px 80px 130px 72px" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${activo ? "text-ink" : "text-ink-muted"}`}>
                        {s.nombre}
                      </p>
                      {s.ubicacion && (
                        <p className="text-xs text-ink-muted truncate flex items-center gap-1 mt-0.5">
                          <PinIcon /> {s.ubicacion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-ink">{s.duracion} min</div>

                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${MODALIDAD_CLS[modalidad] ?? "bg-gray-100 text-gray-700"}`}>
                      {s.modalidad}
                    </span>
                  </div>

                  <div className="font-display text-sm font-bold text-ink">${s.precio}</div>

                  <div className="text-sm text-ink-muted">
                    {s.reservas_count != null ? `${s.reservas_count} totales` : "—"}
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setDeletingId(null); openEdit(s); }}
                      title="Editar"
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isEditing ? "bg-ink text-white" : "hover:bg-border/40 text-ink-muted hover:text-ink"
                      }`}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setDeletingId(isDeleting ? null : s.servicio_id); }}
                      title="Eliminar"
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isDeleting ? "bg-red-500 text-white" : "hover:bg-border/40 text-ink-muted hover:text-red-500"
                      }`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {/* Confirmar eliminación inline */}
                {isDeleting && (
                  <div className="px-5 py-4 border-t border-border bg-red-50 flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700">
                      ¿Eliminar <span className="font-semibold">"{s.nombre}"</span>? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 rounded border border-border bg-white text-sm text-ink font-medium hover:bg-bg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(s.servicio_id)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {saving ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulario de edición inline */}
                {isEditing && (
                  <div className="border-t border-border">
                    <ServiceForm
                      form={form} setF={setF}
                      saving={saving} isEdit={true}
                      onSave={handleSave} onCancel={closeAll}
                      needsLocation={needsLocation}
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline form ──────────────────────────────────────────────────────────────

function ServiceForm({
  form, setF, saving, isEdit, onSave, onCancel, needsLocation,
}: {
  form: FormState;
  setF: (p: Partial<FormState>) => void;
  saving: boolean;
  isEdit: boolean;
  onSave: () => void;
  onCancel: () => void;
  needsLocation: boolean;
}) {
  return (
    <div className="bg-white border border-border rounded p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
          {isEdit ? "Editar servicio" : "Nuevo servicio"}
        </p>
        <button onClick={onCancel} className="text-ink-muted hover:text-ink transition-colors cursor-pointer">
          <CloseIcon />
        </button>
      </div>

      {/* Fila 1: nombre + tipo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nombre</label>
          <input className={inputCls} placeholder="Ej. Sesión individual"
            value={form.nombre} onChange={(e) => setF({ nombre: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Tipo</label>
          <input className={inputCls} placeholder="Ej. Consulta, Terapia..."
            value={form.tipo} onChange={(e) => setF({ tipo: e.target.value })} />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Describe el servicio..."
          value={form.descripcion} onChange={(e) => setF({ descripcion: e.target.value })} />
      </div>

      {/* Fila 2: modalidad + precio + duración */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Modalidad</label>
          <select className={inputCls} value={form.modalidad}
            onChange={(e) => setF({ modalidad: e.target.value })}>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Precio ($)</label>
          <input type="number" min={0} className={inputCls} placeholder="0"
            value={form.precio} onChange={(e) => setF({ precio: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Duración (min)</label>
          <input type="number" min={1} className={inputCls} placeholder="50"
            value={form.duracion} onChange={(e) => setF({ duracion: e.target.value })} />
        </div>
      </div>

      {/* Ubicación — solo para presencial / híbrido */}
      {needsLocation && (
        <div>
          <label className={labelCls}>Dirección / Ubicación</label>
          <input className={inputCls} placeholder="Ej. Av. Corrientes 1234, CABA"
            value={form.ubicacion} onChange={(e) => setF({ ubicacion: e.target.value })} />
          <p className="text-xs text-ink-muted mt-1">Visible para el cliente al confirmar la reserva</p>
        </div>
      )}

      {/* Fila 3: pausa + cancelación */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Pausa entre turnos (min)</label>
          <input type="number" min={0} className={inputCls} placeholder="10"
            value={form.pausa} onChange={(e) => setF({ pausa: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Cancelación mínima (hs)</label>
          <input type="number" min={0} className={inputCls} placeholder="24"
            value={form.min_cancelacion} onChange={(e) => setF({ min_cancelacion: e.target.value })} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel}
          className="border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors cursor-pointer">
          Cancelar
        </button>
        <button onClick={onSave} disabled={saving}
          className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer">
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear servicio"}
        </button>
      </div>
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

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
