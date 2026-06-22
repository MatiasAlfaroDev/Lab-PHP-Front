import { useEffect, useRef, useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";
import "leaflet/dist/leaflet.css";
const API_BASE  = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
  latitud?: number;
  longitud?: number;
  activo?: boolean;
  reservas_count?: number;
};

type FormState = {
  nombre: string;
  descripcion: string;
  modalidad: string;
  tipo: string;
  tipoPersonalizado: string;
  precio: string;
  duracion: string;
  pausa: string;
  min_cancelacion: string;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
};

const EMPTY_FORM: FormState = {
  nombre: "",
  descripcion: "",
  modalidad: "presencial",
  tipo: "",
  tipoPersonalizado: "",
  precio: "",
  duracion: "",
  pausa: "",
  min_cancelacion: "",
  ubicacion: "",
  latitud: null,
  longitud: null,
};

const MODALIDAD_CLS: Record<string, string> = {
  presencial: "bg-emerald-100 text-emerald-800",
  virtual:    "bg-orange-100  text-orange-700",
  hibrido:    "bg-amber-100   text-amber-800",
};

const TIPOS_SERVICIO = [
  "Psicología",
  "Nutrición",
  "Tarot",
  "Astrología",
  "Entrenamiento Personal",
  "Yoga",
  "Pilates",
  "Fisioterapia",
  "Masoterapia",
  "Clases Particulares",
  "Idiomas",
  "Música",
  "Consultoría",
  "Asesoría Legal",
  "Belleza y Estética",
  "Fotografía",
  "Otro",
];

const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink";
const labelCls = "block text-sm font-semibold text-ink mb-1.5";

function MapPicker({
  lat,
  lng,
  onDragEnd,
}: {
  lat: number | null;
  lng: number | null;
  onDragEnd: (lat: number, lng: number, address: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let L: any;

    (async () => {
      if (!containerRef.current) return;

      L = await import("leaflet");
      const icon = L.icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      delete L.Icon.Default.prototype._getIconUrl;

      if (mapRef.current) return;

      const center: [number, number] = [
        lat ?? -34.9011,
        lng ?? -56.1645,
      ];

      const map = L.map(containerRef.current).setView(center, 15);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        crossOrigin: true,
      }).addTo(map);

      const marker = L.marker(center, {
        draggable: true,
        icon,
      }).addTo(map);

      marker.on("dragend", async () => {
        const pos = marker.getLatLng();

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`
          );

          const json = await res.json();

          onDragEnd(
            pos.lat,
            pos.lng,
            json?.display_name || "Ubicación personalizada"
          );
        } catch {
          onDragEnd(pos.lat, pos.lng, "Ubicación personalizada");
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // update sin recrear mapa
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (lat == null || lng == null) return;

    const pos: [number, number] = [lat, lng];

    markerRef.current.setLatLng(pos);
    mapRef.current.setView(pos);
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="w-full h-56 rounded border border-border"
    />
  );
}
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
  const [search,     setSearch]     = useState("");
  const [armedId,    setArmedId]    = useState<number | null>(null);
  const [dragId,     setDragId]     = useState<number | null>(null);
  const [overId,     setOverId]     = useState<number | null>(null);

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
      nombre:            s.nombre,
      descripcion:       s.descripcion,
      modalidad:         s.modalidad,
      tipo:              TIPOS_SERVICIO.includes(s.tipo) ? s.tipo : "Otro",
      tipoPersonalizado: TIPOS_SERVICIO.includes(s.tipo) ? "" : s.tipo,
      precio:            String(s.precio),
      duracion:          String(s.duracion),
      pausa:             String(s.pausa),
      min_cancelacion:   String(s.min_cancelacion),
      ubicacion:         s.ubicacion ?? "",
      latitud:           s.latitud  ?? null,
      longitud:          s.longitud ?? null,
    });
    setEditingId(id);
  };

  const closeAll = () => {
    setEditingId(null);
    setDeletingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const setF = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const needsLocation = ["presencial", "hibrido"].includes(form.modalidad.trim().toLowerCase());

  // ── Save / Delete ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    const tipoFinal =
      form.tipo === "Otro"
        ? form.tipoPersonalizado.trim()
        : form.tipo;
    if (!form.nombre.trim()) return showToast("El nombre es requerido", false);
    if (!tipoFinal.trim())   return showToast("El tipo es requerido", false);
    if (!form.precio)        return showToast("El precio es requerido", false);
    if (!form.duracion)      return showToast("La duración es requerida", false);
    if (needsLocation && (form.latitud === null || form.longitud === null)) {
      return showToast("Confirmá la ubicación en el mapa", false);
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nombre:          form.nombre,
        descripcion:     form.descripcion,
        modalidad:       form.modalidad.toLowerCase(),
        tipo:            tipoFinal,
        precio:          Number(form.precio),
        duracion:        Number(form.duracion),
        pausa:           Number(form.pausa),
        min_cancelacion: Number(form.min_cancelacion),
      };
      if (needsLocation) {
        body.direccion = form.ubicacion.trim();
        body.latitud   = form.latitud;
        body.longitud  = form.longitud;
      }

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

  const filteredServices = services.filter((s) =>
    s.nombre.toLowerCase().includes(search.trim().toLowerCase())
  );

  // ── Reorder (visual/local only — no backend persistence) ──────────────────
  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) { setDragId(null); setOverId(null); return; }
    setServices((prev) => {
      const from = prev.findIndex((s) => s.servicio_id === dragId);
      const to   = prev.findIndex((s) => s.servicio_id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
    setOverId(null);
  };

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
            placeholder="Buscar servicios"
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
          {editingId === "new" ? "Cancelar" : <><PlusIcon /> Agregar servicio</>}
        </button>
      </div>

      {/* Drawer de creación/edición */}
      {editingId !== null && (
        <ServiceDrawer
          form={form} setF={setF}
          saving={saving} isEdit={typeof editingId === "number"}
          onSave={handleSave} onCancel={closeAll}
          needsLocation={needsLocation}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          <div
            className="grid px-5 py-2 border-b border-border bg-surface"
            style={{ gridTemplateColumns: "minmax(180px, 3fr) 90px 110px 120px 110px 72px"}}
          >
            {["Nombre", "Precio", "Duración", "Modalidad", "Reservas", ""].map((h) => (
              <div key={h} className="text-sm text-ink-muted">{h}</div>
            ))}
          </div>
          <div className="px-5 py-2 border-b border-border bg-sidebar">
            <div className="h-3.5 w-20 rounded bg-border animate-pulse" />
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className={`grid px-5 py-4 items-center ${row > 0 ? "border-t border-border" : ""}`}
              style={{ gridTemplateColumns: "minmax(180px, 3fr) 90px 110px 120px 110px 72px" }}
            >
              <div className="h-3.5 w-40 rounded bg-border animate-pulse" />
              <div className="h-3.5 w-12 rounded bg-border animate-pulse" />
              <div className="h-3.5 w-16 rounded bg-border animate-pulse" />
              <div className="h-5 w-16 rounded bg-border animate-pulse" />
              <div className="h-3.5 w-14 rounded bg-border animate-pulse" />
              <div className="flex justify-end gap-3">
                <div className="h-3.5 w-3.5 rounded bg-border animate-pulse" />
                <div className="h-3.5 w-3.5 rounded bg-border animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && services.length === 0 && editingId !== "new" && (
        <div className="m-4 bg-surface border border-border rounded p-12 text-center">
          <p className="font-display text-xl text-ink mb-1">Sin servicios aún</p>
          <p className="text-ink-muted text-sm mb-5">
            Creá tu primer servicio para que los clientes puedan reservar
          </p>
          <button
            onClick={openCreate}
            className="bg-accent text-white px-4 py-2 rounded-full hover:bg-accent-hover text-sm font-semibold transition-colors cursor-pointer"
          >
            + Agregar servicio
          </button>
        </div>
      )}

      {/* Sin resultados de búsqueda */}
      {!loading && services.length > 0 && filteredServices.length === 0 && editingId !== "new" && (
        <div className="m-4 bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm">
          No se encontraron servicios para "{search}"
        </div>
      )}

      {/* Tabla */}
      {!loading && filteredServices.length > 0 && (
        <div className="bg-surface border-t border-border w-full overflow-x-auto">
          <div className="min-w-max">
          {/* Cabecera */}
          <div
            className="grid px-5 py-2 border-b border-border bg-surface"
            style={{ gridTemplateColumns: "minmax(180px, 3fr) 90px 110px 120px 110px 72px" }}
          >
            {["Nombre", "Precio", "Duración", "Modalidad", "Reservas", ""].map((h) => (
              <div key={h} className="text-sm text-ink-muted">{h}</div>
            ))}
          </div>

          {/* Sección */}
          <div className="px-5 py-2 border-b border-border bg-sidebar">
            <span className="text-sm font-bold text-ink">Servicios</span>
          </div>
          {filteredServices.map((s, idx) => {
            const activo     = s.activo ?? true;
            const isEditing  = editingId === s.servicio_id;
            const isDeleting = deletingId === s.servicio_id;
            const modalidad  = s.modalidad?.toLowerCase();

            return (
              <div
                key={s.servicio_id}
                draggable={armedId === s.servicio_id}
                onDragStart={() => setDragId(s.servicio_id)}
                onDragEnter={() => dragId !== null && setOverId(s.servicio_id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(s.servicio_id)}
                onDragEnd={() => { setDragId(null); setOverId(null); setArmedId(null); }}
                className={`${idx > 0 ? "border-t border-border" : ""} ${dragId === s.servicio_id ? "opacity-40" : ""} ${overId === s.servicio_id && dragId !== s.servicio_id ? "border-t-2 border-accent" : ""}`}
              >
                {/* Fila */}
                <div
                  className={`grid px-5 py-4 items-center ${
                    isEditing || isDeleting ? "bg-accent/10" : ""
                  }`}
                  style={{ gridTemplateColumns: "minmax(180px, 3fr) 90px 110px 120px 110px 72px" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-ink-muted/50 shrink-0 cursor-grab active:cursor-grabbing"
                      onMouseDown={() => setArmedId(s.servicio_id)}
                      onMouseUp={() => setArmedId(null)}
                    >
                      <GripIcon />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${activo ? "text-ink" : "text-ink-muted"}`}>
                        {s.nombre}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-ink">${s.precio}</div>

                  <div className="text-sm text-ink">{s.duracion} minutos</div>

                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${MODALIDAD_CLS[modalidad] ?? "bg-gray-100 text-gray-700"}`}>
                      {s.modalidad}
                    </span>
                  </div>

                  <div className="text-sm text-ink-muted">
                    {s.reservas_count != null ? `${s.reservas_count} totales` : "—"}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => { setDeletingId(null); openEdit(s); }}
                      title="Editar"
                      className={`transition-colors cursor-pointer ${
                        isEditing ? "text-ink" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setDeletingId(isDeleting ? null : s.servicio_id); }}
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
                      ¿Eliminar <span className="font-semibold">"{s.nombre}"</span>? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 rounded border border-border bg-surface text-sm text-ink font-medium hover:bg-bg transition-colors cursor-pointer"
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
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drawer de creación/edición ────────────────────────────────────────────────

function ServiceDrawer({
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
  const locationConfirmed = form.latitud !== null && form.longitud !== null;
  const canSave = !saving && (!needsLocation || locationConfirmed);

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface shadow-xl rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="font-display text-2xl text-ink">
            {isEdit ? "Editar servicio" : "Agregar nuevo servicio"}
          </h2>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink transition-colors cursor-pointer">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <ServiceFormFields form={form} setF={setF} needsLocation={needsLocation} />
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onSave}
            disabled={!canSave}
            title={needsLocation && !locationConfirmed ? "Confirmá la ubicación en el mapa" : undefined}
            className="w-full flex items-center justify-center gap-2 bg-accent text-ink-fixed px-4 py-2.5 rounded-xl hover:bg-accent-hover text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : <>Guardar <ArrowRightIcon /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceFormFields({
  form, setF, needsLocation,
}: {
  form: FormState;
  setF: (p: Partial<FormState>) => void;
  needsLocation: boolean;
}) {
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [geocoding,      setGeocoding]      = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleAddressInput = (value: string) => {
    setF({ ubicacion: value, latitud: null, longitud: null });
    setGeocodingError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 8) return;

    debounceRef.current = setTimeout(async () => {
      setGeocoding(true);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1`
        );

        const json = await res.json();

        if (json.length > 0) {
          setF({
            latitud: parseFloat(json[0].lat),
            longitud: parseFloat(json[0].lon),
          });
          setGeocodingError(null);
        }
      } catch {
        // fallback silencioso
      } finally {
        setGeocoding(false);
      }
    }, 600);
  };

  const handleMapDragEnd = (lat: number, lng: number, address: string) => {
    setF({ latitud: lat, longitud: lng, ubicacion: address });
    setGeocodingError(null);
  };

  const locationConfirmed = form.latitud !== null && form.longitud !== null;

  return (
    <>
      {/* Nombre */}
      <div>
        <label className={labelCls}>Nombre del Servicio</label>
        <input className={inputCls} placeholder="Ej. Corte de pelo"
          value={form.nombre} onChange={(e) => setF({ nombre: e.target.value })} />
      </div>

      {/* Categoría */}
      <div>
        <label className={labelCls}>Categoría</label>
        <select
          className={inputCls}
          value={form.tipo}
          onChange={(e) =>
            setF({
              tipo: e.target.value,
              tipoPersonalizado: "",
            })
          }
        >
          <option value="">Seleccionar categoría</option>

          {TIPOS_SERVICIO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        {form.tipo === "Otro" && (
          <input
            className={`${inputCls} mt-2`}
            placeholder="Especifique la categoría"
            value={form.tipoPersonalizado}
            onChange={(e) => setF({ tipoPersonalizado: e.target.value })}
          />
        )}
      </div>

      {/* Modalidad */}
      <div>
        <label className={labelCls}>Modalidad</label>
        <div className="flex items-center gap-6">
          {[
            { value: "presencial", label: "Presencial" },
            { value: "virtual",    label: "Virtual" },
            { value: "hibrido",    label: "Híbrido" },
          ].map((opt) => {
            const checked = form.modalidad.trim().toLowerCase() === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setF({ modalidad: opt.value })}
                className="flex items-center gap-2 text-sm text-ink cursor-pointer"
              >
                <span className={`relative w-4 h-4 rounded-full border-2 shrink-0 ${
                  checked ? "border-accent-hover" : "border-border"
                }`}>
                  {checked && (
                    <span className="absolute inset-0.5 rounded-full bg-accent-hover" />
                  )}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Precio / Duración */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Precio ($)</label>
          <input type="number" min={0} className={inputCls} placeholder="0"
            value={form.precio} onChange={(e) => setF({ precio: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Duración (min)</label>
          <input type="number" min={1} className={inputCls} placeholder="30"
            value={form.duracion} onChange={(e) => setF({ duracion: e.target.value })} />
        </div>
      </div>

      {/* Ubicación + Mapa — solo para presencial / híbrido */}
      {needsLocation && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Dirección / Ubicación</label>
            <div className="relative">
              <input
                className={inputCls}
                placeholder="Ej. Av. 18 de Julio 1290, Montevideo"
                value={form.ubicacion}
                onChange={(e) => handleAddressInput(e.target.value)}
              />
              {geocoding && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted pointer-events-none">
                  Buscando...
                </span>
              )}
            </div>
            {geocodingError ? (
              <p className="text-xs text-red-500 mt-1">{geocodingError}</p>
            ) : locationConfirmed ? (
              <p className="text-xs text-accent-hover mt-1">✓ Ubicación confirmada en el mapa</p>
            ) : (
              <p className="text-xs text-ink-muted mt-1">
                Escribí la dirección para ubicarla en el mapa, o arrastrá el pin
              </p>
            )}
          </div>
          <MapPicker
            lat={form.latitud}
            lng={form.longitud}
            onDragEnd={handleMapDragEnd}
          />
        </div>
      )}

      {/* Divisor */}
      <hr className="border-t border-dashed border-border" />

      {/* Pausa / Cancelación */}
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

      {/* Descripción */}
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea rows={5} className={`${inputCls} resize-none`} placeholder="Describe el servicio..."
          value={form.descripcion} onChange={(e) => setF({ descripcion: e.target.value })} />
      </div>
    </>
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

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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
