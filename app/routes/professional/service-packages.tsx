import { useEffect, useMemo, useState } from "react";
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
};

type PaqueteServicio = {
  servicio_id: number;
  nombre?: string;
  modalidad?: string;
  precio?: number;
  duracion?: number;
  pivot?: { cantidad_sesiones: number };
  cantidad_sesiones?: number;
  ubicacion?: string;
};

type Paquete = {
  paquete_id: number;
  nombre: string;
  descripcion: string;
  precio_total: number;
  servicios: PaqueteServicio[];
};

type FormItem = {
  servicio_id: number;
  cantidad_sesiones: number;
  ubicacion: string;
};

type FormState = {
  nombre: string;
  descripcion: string;
  precio_total: string;
  items: FormItem[];
};

const EMPTY_FORM: FormState = {
  nombre: "",
  descripcion: "",
  precio_total: "",
  items: [],
};

const inputCls = "w-full border border-border rounded px-3 py-2 text-sm bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink";
const labelCls = "block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5";

const SVC_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100   text-teal-700",
  "bg-rose-100   text-rose-700",
  "bg-amber-100  text-amber-700",
  "bg-sky-100    text-sky-700",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicePackages() {
  const { token } = useAuth();

  const [servicios,   setServicios]   = useState<Servicio[]>([]);
  const [paquetes,    setPaquetes]    = useState<Paquete[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [creating,    setCreating]    = useState(false);
  const [form,        setForm]        = useState<FormState>({ ...EMPTY_FORM });
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [svcRes, pkgRes]: any[] = await Promise.all([
        api.get("/mis-servicios", token),
        api.get("/mis-paquetes", token),
      ]);
      if (svcRes?.success) setServicios(svcRes.data);
      if (Array.isArray(pkgRes)) setPaquetes(pkgRes);
      else if (pkgRes?.success) setPaquetes(pkgRes.data);
    } catch {
      setPaquetes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [token]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setDeletingId(null);
    setForm({ ...EMPTY_FORM });
    setCreating(true);
  };

  const openEdit = (pkg: Paquete) => {
    setCreating(false);
    setDeletingId(null);
    setForm({
      nombre:       pkg.nombre,
      descripcion:  pkg.descripcion,
      precio_total: String(pkg.precio_total),
      items: pkg.servicios.map((s) => ({
        servicio_id:       s.servicio_id,
        cantidad_sesiones: s.pivot?.cantidad_sesiones ?? s.cantidad_sesiones ?? 1,
        ubicacion:         s.ubicacion ?? "",
      })),
    });
    setEditingId(editingId === pkg.paquete_id ? null : pkg.paquete_id);
  };

  const closeAll = () => {
    setEditingId(null);
    setCreating(false);
    setDeletingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const addItem = (svc: Servicio) => {
    if (form.items.some((i) => i.servicio_id === svc.servicio_id)) return;
    setForm((f) => ({ ...f, items: [...f.items, { servicio_id: svc.servicio_id, cantidad_sesiones: 1, ubicacion: "" }] }));
  };

  const removeItem = (id: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.servicio_id !== id) }));

  const updateItem = (id: number, patch: Partial<FormItem>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => (i.servicio_id === id ? { ...i, ...patch } : i)),
    }));

  // ── Totales ────────────────────────────────────────────────────────────────

  const subtotal = useMemo(() =>
    form.items.reduce((acc, item) => {
      const svc = servicios.find((s) => s.servicio_id === item.servicio_id);
      return acc + (svc?.precio ?? 0) * item.cantidad_sesiones;
    }, 0),
    [form.items, servicios]
  );

  // ── Save / Delete ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.nombre.trim()) return showToast("El nombre es requerido", false);
    if (form.items.length === 0) return showToast("Agregá al menos un servicio", false);

    const body = {
      nombre:       form.nombre,
      descripcion:  form.descripcion,
      precio_total: Number(form.precio_total) || subtotal,
      servicios:    form.items.map(({ servicio_id, cantidad_sesiones, ubicacion }) => ({
        servicio_id,
        cantidad_sesiones,
        ...(ubicacion ? { ubicacion } : {}),
      })),
    };

    setSaving(true);
    try {
      if (editingId !== null) {
        await api.put(`/paquetes/${editingId}`, body, token);
        showToast("Paquete actualizado");
      } else {
        await api.post("/paquetes", body, token);
        showToast("Paquete creado");
      }
      closeAll();
      fetchAll();
    } catch (e: any) {
      showToast(e.message ?? "Error al guardar", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      await api.delete(`/paquetes/${id}`, token);
      showToast("Paquete eliminado");
      setDeletingId(null);
      fetchAll();
    } catch (e: any) {
      showToast(e.message ?? "Error al eliminar", false);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded border text-sm font-semibold shadow-lg transition-all ${
          toast.ok ? "bg-accent text-ink border-ink/20" : "bg-red-100 text-red-800 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Paquetes</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {loading ? "Cargando..." : `${paquetes.length} paquete${paquetes.length !== 1 ? "s" : ""} creado${paquetes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => creating ? closeAll() : openCreate()}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${
            creating ? "bg-border text-ink-muted" : "bg-ink text-white hover:bg-primary"
          }`}
        >
          {creating ? "Cancelar" : <b>+ Nuevo paquete</b>}
        </button>
      </div>

      {/* Form de creación inline (arriba de la lista) */}
      {creating && (
        <PackageForm
          form={form}
          setForm={setForm}
          servicios={servicios}
          subtotal={subtotal}
          saving={saving}
          isEdit={false}
          onSave={handleSave}
          onCancel={closeAll}
          addItem={addItem}
          removeItem={removeItem}
          updateItem={updateItem}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm">
          Cargando paquetes...
        </div>
      )}

      {/* Empty */}
      {!loading && paquetes.length === 0 && !creating && (
        <div className="bg-surface border border-border rounded p-12 text-center">
          <p className="font-display text-xl text-ink mb-1">Sin paquetes aún</p>
          <p className="text-ink-muted text-sm mb-5">Creá tu primer paquete de servicios</p>
          <button
            onClick={openCreate}
            className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors cursor-pointer"
          >
            + Nuevo paquete
          </button>
        </div>
      )}

      {/* Lista de paquetes */}
      {!loading && paquetes.length > 0 && (
        <div className="space-y-0 bg-surface border border-border rounded overflow-hidden">
          {paquetes.map((pkg, idx) => {
            const isEditing  = editingId === pkg.paquete_id;
            const isDeleting = deletingId === pkg.paquete_id;
            const totalSesiones = pkg.servicios?.reduce(
              (acc, s) => acc + (s.pivot?.cantidad_sesiones ?? s.cantidad_sesiones ?? 1), 0
            ) ?? 0;

            const isDimmed = editingId !== null && !isEditing;

            return (
              <div key={pkg.paquete_id} className={`${idx > 0 ? "border-t border-border" : ""} ${isDimmed ? "opacity-40 pointer-events-none" : "transition-opacity"}`}>
                {/* Fila del paquete */}
                <div className={`flex items-center px-5 py-4 gap-6 ${isEditing || isDeleting ? "bg-accent/10" : ""}`}>

                  {/* Nombre */}
                  <div className="min-w-0 w-40 shrink-0">
                    <p className="text-sm font-semibold text-ink truncate">{pkg.nombre}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {totalSesiones} sesión{totalSesiones !== 1 ? "es" : ""}
                    </p>
                  </div>

                  {/* Servicios — grilla 2 cols × 3 filas */}
                  <div className="flex-1 grid grid-cols-2 gap-1.5" style={{ maxWidth: 420 }}>
                    {pkg.servicios?.slice(0, 6).map((s, si) => (
                      <span
                        key={s.servicio_id}
                        className={`text-xs px-2.5 py-1 rounded font-medium truncate ${SVC_COLORS[si % SVC_COLORS.length]}`}
                      >
                        {s.nombre ?? `Servicio #${s.servicio_id}`}
                      </span>
                    ))}
                    {(pkg.servicios?.length ?? 0) > 6 && (
                      <span className="text-xs text-ink-muted px-2 py-1">+{pkg.servicios.length - 6} más</span>
                    )}
                  </div>

                  {/* Precio */}
                  <div className="font-display text-sm font-bold text-ink whitespace-nowrap ml-auto">
                    $ {Number(pkg.precio_total).toFixed(0)}
                  </div>

                  {/* Acciones — extremo derecho */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(pkg)}
                      title="Editar"
                      className={`p-1.5 rounded transition-colors cursor-pointer ${isEditing ? "bg-ink text-white" : "hover:bg-border/40 text-ink-muted hover:text-ink"}`}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setDeletingId(isDeleting ? null : pkg.paquete_id)}
                      title="Eliminar"
                      className={`p-1.5 rounded transition-colors cursor-pointer ${isDeleting ? "bg-red-500 text-white" : "hover:bg-border/40 text-ink-muted hover:text-red-500"}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {/* Confirmar eliminación inline */}
                {isDeleting && (
                  <div className="px-5 py-4 border-t border-border bg-red-50 flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700">
                      ¿Eliminar <span className="font-semibold">"{pkg.nombre}"</span>? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 rounded border border-border bg-white text-sm text-ink font-medium hover:bg-bg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.paquete_id)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {saving ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Form de edición inline debajo de la fila */}
                {isEditing && (
                  <div className="border-t border-border">
                    <PackageForm
                      form={form}
                      setForm={setForm}
                      servicios={servicios}
                      subtotal={subtotal}
                      saving={saving}
                      isEdit={true}
                      onSave={handleSave}
                      onCancel={closeAll}
                      addItem={addItem}
                      removeItem={removeItem}
                      updateItem={updateItem}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PackageForm (inline create / edit) ──────────────────────────────────────

function PackageForm({
  form, setForm, servicios, subtotal, saving, isEdit,
  onSave, onCancel, addItem, removeItem, updateItem,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  servicios: Servicio[];
  subtotal: number;
  saving: boolean;
  isEdit: boolean;
  onSave: () => void;
  onCancel: () => void;
  addItem: (s: Servicio) => void;
  removeItem: (id: number) => void;
  updateItem: (id: number, patch: Partial<FormItem>) => void;
}) {
  const available = servicios.filter((s) => !form.items.some((i) => i.servicio_id === s.servicio_id));

  return (
    <div className="bg-white border border-border rounded p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
          {isEdit ? "Editar paquete" : "Nuevo paquete"}
        </p>
        <button onClick={onCancel} className="text-ink-muted hover:text-ink transition-colors cursor-pointer">
          <CloseIcon />
        </button>
      </div>

      {/* Datos generales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Nombre del paquete</label>
          <input
            className={inputCls}
            placeholder="Ej. Pack mensual de bienestar"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Descripción</label>
          <textarea
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Descripción visible para el cliente"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>Precio final ($)</label>
          <input
            type="number"
            min={0}
            className={inputCls}
            placeholder={`Sugerido: $${subtotal}`}
            value={form.precio_total}
            onChange={(e) => setForm((f) => ({ ...f, precio_total: e.target.value }))}
          />
          <p className="text-xs text-ink-muted mt-1">Subtotal por sesiones: ${subtotal}</p>
        </div>
      </div>

      {/* Servicios seleccionados */}
      {form.items.length > 0 && (
        <div>
          <p className={labelCls}>Servicios incluidos</p>
          <div className="space-y-3">
            {form.items.map((item) => {
              const svc = servicios.find((s) => s.servicio_id === item.servicio_id);
              if (!svc) return null;
              const isPresencial = svc.modalidad?.toLowerCase().includes("presencial");
              return (
                <div key={item.servicio_id} className="border border-border rounded bg-surface p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{svc.nombre}</p>
                      <p className="text-xs text-ink-muted">${svc.precio} · {svc.duracion} min · {svc.modalidad}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-ink-muted">Sesiones</label>
                      <input
                        type="number"
                        min={1}
                        className="w-16 border border-border rounded px-2 py-1 text-sm bg-white text-ink text-center focus:outline-none focus:ring-2 focus:ring-ink"
                        value={item.cantidad_sesiones}
                        onChange={(e) => updateItem(item.servicio_id, { cantidad_sesiones: Math.max(1, Number(e.target.value)) })}
                      />
                      <button
                        onClick={() => removeItem(item.servicio_id)}
                        className="text-ink-muted hover:text-red-500 transition-colors cursor-pointer p-1"
                        title="Quitar"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </div>

                  {/* Ubicación para presencial */}
                  {isPresencial && (
                    <div>
                      <label className={labelCls}>Dirección / Ubicación</label>
                      <input
                        className={inputCls}
                        placeholder="Ej. Av. Corrientes 1234, CABA"
                        value={item.ubicacion}
                        onChange={(e) => updateItem(item.servicio_id, { ubicacion: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agregar servicios */}
      {available.length > 0 && (
        <div>
          <p className={labelCls}>Agregar servicio</p>
          <div className="space-y-2">
            {available.map((svc) => (
              <div key={svc.servicio_id} className="flex items-center justify-between border border-border rounded px-4 py-3 bg-surface hover:bg-bg transition-colors">
                <div>
                  <p className="text-sm font-semibold text-ink">{svc.nombre}</p>
                  <p className="text-xs text-ink-muted">${svc.precio} · {svc.duracion} min · {svc.modalidad}</p>
                </div>
                <button
                  onClick={() => addItem(svc)}
                  className="text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded hover:bg-primary transition-colors cursor-pointer"
                >
                  + Agregar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {available.length === 0 && form.items.length === 0 && (
        <p className="text-sm text-ink-muted text-center py-4">
          No tenés servicios creados. Primero creá servicios individuales.
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-ink-muted">
          {form.items.length > 0 && (
            <span>
              {form.items.reduce((a, i) => a + i.cantidad_sesiones, 0)} sesiones ·{" "}
              <span className="font-semibold text-ink">
                Subtotal ${subtotal}
              </span>
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear paquete"}
          </button>
        </div>
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
