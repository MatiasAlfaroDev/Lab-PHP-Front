import { useEffect, useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

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
};

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  modalidad: "VIRTUAL",
  tipo: "",
  precio: "",
  duracion: "",
  pausa: "",
  min_cancelacion: "",
};

type ModalMode = "create" | "edit" | null;

const modalidadCls: Record<string, string> = {
  virtual: "bg-blue-100 text-blue-800",
  presencial: "bg-emerald-100 text-emerald-800",
  hibrido: "bg-amber-100 text-amber-800",
};

export default function Services() {
  const { token } = useAuth();
  const [services, setServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Servicio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Servicio | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

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

  useEffect(() => {
    fetchServicios();
  }, [token]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditTarget(null);
    setModal("create");
  };

  const openEdit = (s: Servicio) => {
    setEditTarget(s);
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion,
      modalidad: s.modalidad,
      tipo: s.tipo,
      precio: String(s.precio),
      duracion: String(s.duracion),
      pausa: String(s.pausa),
      min_cancelacion: String(s.min_cancelacion),
    });
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const body = {
        ...form,
        modalidad: form.modalidad.toUpperCase(),
        precio: Number(form.precio),
        duracion: Number(form.duracion),
        pausa: Number(form.pausa),
        min_cancelacion: Number(form.min_cancelacion),
      };

      if (modal === "create") {
        await api.post("/servicios", body, token);
        showToast("Servicio creado correctamente");
      } else if (modal === "edit" && editTarget) {
        await api.put(`/servicios/${editTarget.servicio_id}`, body, token);
        showToast("Servicio actualizado correctamente");
      }

      closeModal();
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
      setDeleteTarget(null);
      fetchServicios();
    } catch (err: any) {
      showToast(err.message ?? "Error al eliminar", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded border text-sm font-semibold shadow-lg transition-all ${
            toast.ok
              ? "bg-accent text-ink border-ink/20"
              : "bg-red-100 text-red-800 border-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Servicios</h1>
          <p className="text-ink-muted mt-1">
            {loading ? "Cargando..." : `${services.length} servicios registrados`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors"
        >
          + Nuevo servicio
        </button>
      </div>

      {/* Table */}
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
            className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors"
          >
            + Nuevo servicio
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Table header */}
              <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
                {[
                  { label: "SERVICIO", span: "col-span-4" },
                  { label: "MODALIDAD", span: "col-span-2" },
                  { label: "DURACIÓN", span: "col-span-2" },
                  { label: "PRECIO", span: "col-span-2" },
                  { label: "TIPO", span: "col-span-1" },
                  { label: "", span: "col-span-1" },
                ].map((h) => (
                  <div
                    key={h.label}
                    className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${h.span}`}
                  >
                    {h.label}
                  </div>
                ))}
              </div>

              {/* Table rows */}
              {services.map((s) => (
                <div
                  key={s.servicio_id}
                  className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors"
                >
                  <div className="col-span-4">
                    <p className="text-sm font-semibold text-ink">{s.nombre}</p>
                    {s.descripcion && (
                      <p className="text-xs text-ink-muted mt-0.5 truncate max-w-xs">
                        {s.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                        modalidadCls[s.modalidad] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {s.modalidad}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-sm text-ink">{s.duracion} min</span>
                  </div>

                  <div className="col-span-2">
                    <span className="font-display text-base font-bold text-ink">
                      ${s.precio}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <span className="text-sm text-ink-muted">{s.tipo || "—"}</span>
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 border border-border rounded hover:bg-bg text-ink-muted hover:text-ink transition-colors"
                      title="Editar"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="p-1.5 border border-border rounded hover:bg-red-50 text-ink-muted hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-surface border border-border rounded w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display text-xl text-ink">
                {modal === "create" ? "Nuevo servicio" : "Editar servicio"}
              </h2>
              <button
                onClick={closeModal}
                className="text-ink-muted hover:text-ink transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                  Nombre
                </label>
                <input
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
                  placeholder="Ej. Sesión individual"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink resize-none"
                  placeholder="Describe el servicio..."
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                    Modalidad
                  </label>
                  <select
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                    value={form.modalidad}
                    onChange={(e) =>
                      setForm({ ...form, modalidad: e.target.value })
                    }
                  >
                    <option value="VIRTUAL">Virtual</option>
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="HIBRIDO">Híbrido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                    Tipo
                  </label>
                  <input
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
                    placeholder="Ej. Consulta, Seguimiento"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
                    placeholder="0"
                    value={form.precio}
                    onChange={(e) =>
                      setForm({ ...form, precio: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
                    placeholder="50"
                    value={form.duracion}
                    onChange={(e) =>
                      setForm({ ...form, duracion: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                    Pausa (min)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
                    placeholder="10"
                    value={form.pausa}
                    onChange={(e) =>
                      setForm({ ...form, pausa: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                    Cancelación mínima (hrs)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
                    placeholder="24"
                    value={form.min_cancelacion}
                    onChange={(e) =>
                      setForm({ ...form, min_cancelacion: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={closeModal}
                className="border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : modal === "create"
                  ? "Crear servicio"
                  : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-surface border border-border rounded w-[400px]">
            <div className="px-6 py-5">
              <h2 className="font-display text-xl text-ink mb-2">
                Eliminar servicio
              </h2>
              <p className="text-sm text-ink-muted">
                ¿Estás seguro que querés eliminar{" "}
                <span className="font-semibold text-ink">
                  "{deleteTarget.nombre}"
                </span>
                ? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
