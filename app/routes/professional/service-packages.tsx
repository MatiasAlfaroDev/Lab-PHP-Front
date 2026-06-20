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

const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink";
const labelCls = "block text-sm font-semibold text-ink mb-1.5";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicePackages() {
  const { token } = useAuth();

  const [servicios,   setServicios]   = useState<Servicio[]>([]);
  const [paquetes,    setPaquetes]    = useState<Paquete[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [editingId,   setEditingId]   = useState<number | "new" | null>(null);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [form,        setForm]        = useState<FormState>({ ...EMPTY_FORM });
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [search,      setSearch]      = useState("");
  const [armedId,     setArmedId]     = useState<number | null>(null);
  const [dragId,      setDragId]      = useState<number | null>(null);
  const [overId,      setOverId]      = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Reorder (visual/local only — no backend persistence) ───────────────────
  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) { setDragId(null); setOverId(null); return; }
    setPaquetes((prev) => {
      const from = prev.findIndex((p) => p.paquete_id === dragId);
      const to   = prev.findIndex((p) => p.paquete_id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
    setOverId(null);
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
    setDeletingId(null);
    setForm({ ...EMPTY_FORM });
    setEditingId(editingId === "new" ? null : "new");
  };

  const openEdit = (pkg: Paquete) => {
    setDeletingId(null);
    if (editingId === pkg.paquete_id) { setEditingId(null); return; }
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
    setEditingId(pkg.paquete_id);
  };

  const closeAll = () => {
    setEditingId(null);
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
      if (typeof editingId === "number") {
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

  const filteredPaquetes = paquetes.filter((p) =>
    p.nombre.toLowerCase().includes(search.trim().toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded border text-sm font-semibold shadow-lg ${
          toast.ok ? "bg-accent text-ink-fixed border-ink-fixed/20" : "bg-red-100 text-red-800 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paquetes"
            className="w-full pl-8 pr-3 py-1.5 text-sm text-ink placeholder-ink-muted bg-transparent focus:outline-none"
          />
        </div>
        <button
          onClick={openCreate}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            editingId === "new"
              ? "bg-border text-ink-muted"
              : "bg-accent text-white hover:bg-accent-hover"
          }`}
        >
          {editingId === "new" ? "Cancelar" : <><PlusIcon /> Nuevo paquete</>}
        </button>
      </div>

      {/* Drawer de creación/edición */}
      {editingId !== null && (
        <PackageDrawer
          form={form} setForm={setForm}
          servicios={servicios} subtotal={subtotal}
          saving={saving} isEdit={typeof editingId === "number"}
          onSave={handleSave} onCancel={closeAll}
          addItem={addItem} removeItem={removeItem} updateItem={updateItem}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          <div
            className="grid px-5 py-2 border-b border-border bg-surface"
            style={{ gridTemplateColumns: "2fr 130px 100px 72px" }}
          >
            {["Nombre", "Servicios", "Precio", ""].map((h) => (
              <div key={h} className="text-sm text-ink-muted">{h}</div>
            ))}
          </div>
          <div className="px-5 py-2 border-b border-border bg-sidebar">
            <div className="h-3.5 w-20 rounded bg-border animate-pulse" />
          </div>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className={`grid px-5 py-4 items-center ${row > 0 ? "border-t border-border" : ""}`}
              style={{ gridTemplateColumns: "2fr 130px 100px 72px" }}
            >
              <div className="h-3.5 w-32 rounded bg-border animate-pulse" />
              <div className="h-5 w-48 rounded bg-border animate-pulse" />
              <div className="h-3.5 w-12 rounded bg-border animate-pulse" />
              <div className="flex justify-end gap-3">
                <div className="h-3.5 w-3.5 rounded bg-border animate-pulse" />
                <div className="h-3.5 w-3.5 rounded bg-border animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && paquetes.length === 0 && editingId !== "new" && (
        <div className="m-4 bg-surface border border-border rounded p-12 text-center">
          <p className="font-display text-xl text-ink mb-1">Sin paquetes aún</p>
          <p className="text-ink-muted text-sm mb-5">
            Creá tu primer paquete de servicios
          </p>
          <button
            onClick={openCreate}
            className="bg-accent text-white px-4 py-2 rounded-full hover:bg-accent-hover text-sm font-semibold transition-colors cursor-pointer"
          >
            + Nuevo paquete
          </button>
        </div>
      )}

      {/* Sin resultados de búsqueda */}
      {!loading && paquetes.length > 0 && filteredPaquetes.length === 0 && editingId !== "new" && (
        <div className="m-4 bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm">
          No se encontraron paquetes para "{search}"
        </div>
      )}

      {/* Tabla */}
      {!loading && filteredPaquetes.length > 0 && (
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          {/* Cabecera */}
          <div
            className="grid px-5 py-2 border-b border-border bg-surface"
            style={{ gridTemplateColumns: "2fr 130px 100px 72px" }}
          >
            {["Nombre", "Servicios", "Precio", ""].map((h) => (
              <div key={h} className="text-sm text-ink-muted">{h}</div>
            ))}
          </div>

          {/* Sección */}
          <div className="px-5 py-2 border-b border-border bg-sidebar">
            <span className="text-sm font-bold text-ink">Paquetes</span>
          </div>

          {filteredPaquetes.map((pkg, idx) => {
            const isEditing  = editingId === pkg.paquete_id;
            const isDeleting = deletingId === pkg.paquete_id;
            const totalSesiones = pkg.servicios?.reduce(
              (acc, s) => acc + (s.pivot?.cantidad_sesiones ?? s.cantidad_sesiones ?? 1), 0
            ) ?? 0;

            const totalServicios = pkg.servicios?.length ?? 0;

            return (
              <div
                key={pkg.paquete_id}
                draggable={armedId === pkg.paquete_id}
                onDragStart={() => setDragId(pkg.paquete_id)}
                onDragEnter={() => dragId !== null && setOverId(pkg.paquete_id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(pkg.paquete_id)}
                onDragEnd={() => { setDragId(null); setOverId(null); setArmedId(null); }}
                className={`${idx > 0 ? "border-t border-border" : ""} ${dragId === pkg.paquete_id ? "opacity-40" : ""} ${overId === pkg.paquete_id && dragId !== pkg.paquete_id ? "border-t-2 border-accent" : ""}`}
              >
                {/* Fila */}
                <div
                  className={`grid px-5 py-4 items-center ${
                    isEditing || isDeleting ? "bg-accent/10" : ""
                  }`}
                  style={{ gridTemplateColumns: "2fr 130px 100px 72px" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-ink-muted/50 shrink-0 cursor-grab active:cursor-grabbing"
                      onMouseDown={() => setArmedId(pkg.paquete_id)}
                      onMouseUp={() => setArmedId(null)}
                    >
                      <GripIcon />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{pkg.nombre}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {totalSesiones} sesión{totalSesiones !== 1 ? "es" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-ink-muted">
                    {totalServicios} servicio{totalServicios !== 1 ? "s" : ""}
                  </div>

                  <div className="text-sm text-ink">${Number(pkg.precio_total).toFixed(0)}</div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => openEdit(pkg)}
                      title="Editar"
                      className={`transition-colors cursor-pointer ${
                        isEditing ? "text-ink" : "text-accent-hover hover:text-ink"
                      }`}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setDeletingId(isDeleting ? null : pkg.paquete_id); }}
                      title="Eliminar"
                      className={`transition-colors cursor-pointer ${
                        isDeleting ? "text-red-700" : "text-red-500 hover:text-red-700"
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
                      ¿Eliminar <span className="font-semibold">"{pkg.nombre}"</span>? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 rounded border border-border bg-surface text-sm text-ink font-medium hover:bg-bg transition-colors cursor-pointer"
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Drawer de creación/edición ────────────────────────────────────────────────

function PackageDrawer({
  form, setForm, servicios, subtotal, saving, isEdit, onSave, onCancel, addItem, removeItem, updateItem,
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
  const canSave = !saving && form.nombre.trim() !== "" && form.items.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-surface shadow-xl rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="font-display text-2xl text-ink">
            {isEdit ? "Editar paquete" : "Nuevo paquete"}
          </h2>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink transition-colors cursor-pointer">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className={labelCls}>Nombre del paquete</label>
            <input
              className={inputCls}
              placeholder="Ej. Pack mensual de bienestar"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Descripción visible para el cliente"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          {/* Precio */}
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

          <hr className="border-t border-dashed border-border" />

          {/* Servicios seleccionados */}
          {form.items.length > 0 && (
            <div>
              <label className={labelCls}>Servicios incluidos</label>
              <div className="space-y-3">
                {form.items.map((item) => {
                  const svc = servicios.find((s) => s.servicio_id === item.servicio_id);
                  if (!svc) return null;
                  const isPresencial = svc.modalidad?.toLowerCase().includes("presencial");
                  return (
                    <div key={item.servicio_id} className="border border-border rounded-lg bg-surface p-4 space-y-3">
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
                            className="w-16 border border-border rounded-lg px-2 py-1 text-sm bg-surface text-ink text-center focus:outline-none focus:ring-2 focus:ring-ink"
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

                      {isPresencial && (
                        <div>
                          <label className={labelCls}>Dirección / Ubicación</label>
                          <input
                            className={inputCls}
                            placeholder="Ej. Av. 18 de Julio 1290, Montevideo"
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
              <label className={labelCls}>Agregar servicio</label>
              <div className="space-y-2">
                {available.map((svc) => (
                  <div key={svc.servicio_id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3 bg-surface hover:bg-bg transition-colors cursor-pointer" onClick={() => addItem(svc)}>
                    <div>
                      <p className="text-sm font-semibold text-ink">{svc.nombre}</p>
                      <p className="text-xs text-ink-muted">${svc.precio} · {svc.duracion} min · {svc.modalidad}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); addItem(svc); }}
                      className="text-xs font-semibold bg-accent text-white px-3 py-1.5 rounded-full hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
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

          {form.items.length > 0 && (
            <p className="text-sm text-ink-muted">
              {form.items.reduce((a, i) => a + i.cantidad_sesiones, 0)} sesiones ·{" "}
              <span className="font-semibold text-ink">Subtotal ${subtotal}</span>
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onSave}
            disabled={!canSave}
            className="w-full flex items-center justify-center gap-2 bg-accent text-ink-fixed px-4 py-2.5 rounded-xl hover:bg-accent-hover text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : <>{isEdit ? "Guardar cambios" : "Crear paquete"} <ArrowRightIcon /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="1.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="6" r="1.5" /><circle cx="16" cy="12" r="1.5" /><circle cx="16" cy="18" r="1.5" />
    </svg>
  );
}

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
