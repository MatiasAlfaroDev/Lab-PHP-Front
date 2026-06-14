import { useState, useEffect, useRef } from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────
interface Servicio {
  servicio_id: number;
  nombre: string;
  tipo: string;
  duracion: number;
  pausa: number;
  modalidad: "presencial" | "virtual" | "hibrido";
  min_aviso?: number;
  min_cancelacion?: number;
  max_anticipacion_dias?: number;
}

interface Block {
  start: number; // decimal hours e.g. 9.5 = 09:30
  end:   number;
  modalidad?: "presencial" | "virtual";
}

interface DaySlot {
  active: boolean;
  blocks: Block[];
}

type WeekSlots = Record<string, DaySlot>;

interface DragState {
  day:           string;
  blockIdx:      number;
  mode:          "move" | "resize-top" | "resize-bottom";
  startY:        number;
  originalStart: number;
  originalEnd:   number;
  snap:          number;
  minDuration:   number;
}

interface Rules {
  aviso:       string;
  reservas:    string;
  cancelacion: string;
}


// ── Constants ──────────────────────────────────────────────────────────────
const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const KEY_TO_DIA: Record<string, string> = {
  LUN: "lunes", MAR: "martes", MIÉ: "miercoles",
  JUE: "jueves", VIE: "viernes", SÁB: "sabado", DOM: "domingo",
};

const DIA_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_TO_DIA).map(([k, v]) => [v, k])
);

const GRID_START = 8;
const GRID_END   = 22;
const HOUR_PX    = 40;
const SNAP       = 0.5; // 30-min snap for windows

const HOURS = Array.from(
  { length: GRID_END - GRID_START },
  (_, i) => `${String(i + GRID_START).padStart(2, "0")}:00`
);

const DEFAULT_SLOTS: WeekSlots = Object.fromEntries(
  DAYS.map((d) => [d, { active: false, blocks: [] }])
);

// ── Helpers ────────────────────────────────────────────────────────────────
function hourToTime(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function timeToHour(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function snapTo(raw: number, step: number): number {
  return Math.round(raw / step) * step;
}

function getPeriod(start: number): string {
  if (start < 13) return "Mañana";
  if (start < 20) return "Tarde";
  return "Noche";
}

function generateDefaultBlocks(): Block[] {
  return [{ start: 9, end: 13 }];
}

function dispsToSlots(
  data: { dia_semana: string; hora_inicio: string; hora_fin: string; modalidad?: "presencial" | "virtual" }[]
): WeekSlots {
  const slots: WeekSlots = structuredClone(DEFAULT_SLOTS);
  for (const d of data) {
    const key = DIA_TO_KEY[d.dia_semana];
    if (!key) continue;
    slots[key].active = true;
    slots[key].blocks.push({ start: timeToHour(d.hora_inicio), end: timeToHour(d.hora_fin), modalidad: d.modalidad });
  }
  return slots;
}

function slotsToDisps(slots: WeekSlots) {
  return Object.entries(slots)
    .filter(([, day]) => day.active && day.blocks.length > 0)
    .flatMap(([key, day]) =>
      day.blocks.map((b) => ({
        dia_semana:  KEY_TO_DIA[key],
        hora_inicio: hourToTime(b.start),
        hora_fin:    hourToTime(b.end),
         modalidad: b.modalidad,
      }))
    );
}

function calcTurnos(block: Block, duracion: number, pausa: number): number {
  return Math.floor(((block.end - block.start) * 60) / (duracion + pausa));
}

// Clamps proposed position to the nearest free interval.
function resolveCollision(
  proposed: number,
  duration: number,
  others: Block[],
  step: number,
  originalStart: number
): number {
  const sorted = [...others].sort((a, b) => a.start - b.start);
  const free: [number, number][] = [];
  let cursor = GRID_START;
  for (const o of sorted) {
    if (o.start > cursor) free.push([cursor, o.start]);
    cursor = Math.max(cursor, o.end);
  }
  if (cursor < GRID_END) free.push([cursor, GRID_END]);

  for (const [fs, fe] of free) {
    if (proposed >= fs && proposed + duration <= fe) return proposed;
  }

  let best = originalStart;
  let bestDist = Infinity;
  for (const [fs, fe] of free) {
    if (fe - fs < duration) continue;
    const clamped = Math.max(fs, Math.min(fe - duration, proposed));
    const snapped = snapTo(clamped, step);
    const final   = Math.max(fs, Math.min(fe - duration, snapped));
    const dist    = Math.abs(final - proposed);
    if (dist < bestDist) { bestDist = dist; best = final; }
  }
  return best;
}

// ── Toggle ─────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onMouseDown={(e) => e.stopPropagation()}
    onClick={(e) => { e.stopPropagation(); onChange(); }}
    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-ink" : "bg-border"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
        checked ? "translate-x-5" : ""
      }`}
    />
  </button>
);

// ── Skeleton ───────────────────────────────────────────────────────────────
function AvailabilitySkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-3 w-24 bg-border/50 rounded mb-4" />
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-border/50 rounded" />
          <div className="h-4 w-72 bg-border/30 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-44 bg-border/30 rounded-lg" />
          <div className="h-9 w-36 bg-border/50 rounded" />
        </div>
      </div>
      <div className="h-12 bg-surface border border-border rounded-xl mb-5" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl overflow-x-auto">
          <div style={{ minWidth: "520px" }}>
            <div className="grid h-16 border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div className="border-r border-border" />
              {DAYS.map((d) => <div key={d} className="border-r border-border last:border-r-0" />)}
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid border-b border-border/30" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                <div className="h-10 border-r border-border/40" />
                {DAYS.map((d) => <div key={d} className="h-10 border-r border-border/20 last:border-r-0" />)}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl h-96" />
          <div className="bg-surface border border-border rounded-2xl h-24" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Availability() {
  const { token } = useAuth();
  const [servicios,        setServicios]        = useState<Servicio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [selectedId,       setSelectedId]       = useState<number | null>(null);
  const [slots,            setSlots]            = useState<WeekSlots>(structuredClone(DEFAULT_SLOTS));
  const [loadingDisp,      setLoadingDisp]      = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [drag,             setDrag]             = useState<DragState | null>(null);
  const [selectedBlock,    setSelectedBlock]    = useState<{ day: string; bi: number } | null>(null);
  const dragMoved = useRef(false);
  const [rules,            setRules]            = useState<Rules>({
    aviso: "24", reservas: "60", cancelacion: "24",
  });
 
  const [showExcepciones, setShowExcepciones] = useState(false);
  const [showNuevaExcepcion, setShowNuevaExcepcion] = useState(false);
  const [nuevaExcepcion, setNuevaExcepcion] = useState({
  fecha_inicio: "",
  fecha_fin: "",
  diaCompleto: true,
  hora_inicio: "",
  hora_fin: "",
  motivo: "",
});
  const [excepciones, setExcepciones] = useState([]);

  // ── Load services ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingServicios(true);
    api
      .get<{ success: boolean; data: Servicio[] }>("/mis-servicios", token)
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setServicios(res.data);
          setSelectedId(res.data[0].servicio_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingServicios(false));
  }, [token]);

  // ── Load disponibilidades ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || servicios.length === 0) return;
    setLoadingDisp(true);
    setError(null);
    api
      .get<{ success: boolean; data: any[] }>(`/servicios/${selectedId}/disponibilidad`)
      .then((res) => {
        setSlots(res.success && res.data.length > 0
          ? dispsToSlots(res.data)
          : structuredClone(DEFAULT_SLOTS)
        );
      })
      .catch(() => setSlots(structuredClone(DEFAULT_SLOTS)))
      .finally(() => setLoadingDisp(false));
  }, [selectedId, servicios]);

    
  useEffect(() => {
    const servicio = servicios.find(
      (s) => s.servicio_id === selectedId
    );

    if (!servicio) return;

    setRules({
      aviso: String(servicio.min_aviso ?? 24),
      reservas: String(servicio.max_anticipacion_dias ?? 60),
      cancelacion: String(servicio.min_cancelacion ?? 24),
    });
  }, [selectedId, servicios]);



  useEffect(() => {
    if (!showExcepciones) return;

    api
      .get<{ success: boolean; data: any[] }>("/excepciones", token)
      .then((res:any) => {
        if (res.success) {
          setExcepciones(res.data);
        }
      })
      .catch(console.error);
  }, [showExcepciones, token]);

  // ── Global drag handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!drag) return;

    const onMove = (e: MouseEvent) => {
      const deltaY = e.clientY - drag.startY;
      if (Math.abs(deltaY) > 4) dragMoved.current = true;
      setSlots((prev) => {
        const allBlocks = prev[drag.day].blocks;
        const others    = allBlocks.filter((_, i) => i !== drag.blockIdx);
        const blocks    = allBlocks.map((b, i) => {
          if (i !== drag.blockIdx) return b;
          const duration = drag.originalEnd - drag.originalStart;

          if (drag.mode === "move") {
            const rawStart = drag.originalStart + deltaY / HOUR_PX;
            const clamped  = Math.max(GRID_START, Math.min(GRID_END - duration, rawStart));
            const start    = resolveCollision(snapTo(clamped, drag.snap), duration, others, drag.snap, drag.originalStart);
            return { start, end: start + duration };
          } else if (drag.mode === "resize-bottom") {
            const rawEnd  = drag.originalEnd + deltaY / HOUR_PX;
            const clamped = Math.max(drag.originalStart + drag.minDuration, Math.min(GRID_END, rawEnd));
            const end     = snapTo(clamped, drag.snap);
            const maxEnd  = others
              .filter((o) => o.start >= drag.originalEnd - 0.01)
              .reduce((m, o) => Math.min(m, o.start), GRID_END);
            return { ...b, end: Math.min(end, maxEnd) };
          } else {
            const rawStart = drag.originalStart + deltaY / HOUR_PX;
            const clamped  = Math.max(GRID_START, Math.min(drag.originalEnd - drag.minDuration, rawStart));
            const start    = snapTo(clamped, drag.snap);
            const minStart = others
              .filter((o) => o.end <= drag.originalStart + 0.01)
              .reduce((m, o) => Math.max(m, o.end), GRID_START);
            return { ...b, start: Math.max(start, minStart) };
          }
        });
        return { ...prev, [drag.day]: { ...prev[drag.day], blocks } };
      });
    };

    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",  onUp);
    };
  }, [drag]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const selectedServicio = servicios.find((s) => s.servicio_id === selectedId);

  const toggleDay = (day: string) => {
    setSlots((prev) => ({
      ...prev,
      [day]: prev[day].active
        ? { active: false, blocks: [] }
        : { active: true, blocks: generateDefaultBlocks() },
    }));
  };

  const addBlock = (day: string) => {
    const daySlot  = slots[day];
    const last     = daySlot.blocks[daySlot.blocks.length - 1];
    const newStart = last ? Math.min(last.end + 1, GRID_END - 2) : 9;
    const interval = selectedServicio ? (selectedServicio.duracion + selectedServicio.pausa) / 60 : 1;
    const newEnd   = Math.min(newStart + Math.max(interval * 2, 1), GRID_END);
    if (newEnd > GRID_END || newStart >= GRID_END - 0.5) return;
    const newBi = daySlot.blocks.length;
    setSlots((prev) => ({
      ...prev,
      [day]: { active: true, blocks: [...prev[day].blocks, { start: newStart, end: newEnd, modalidad:
      selectedServicio?.modalidad === "hibrido"
        ? "presencial"
        : undefined }] },
    }));
    setSelectedBlock({ day, bi: newBi });
  };

  const removeBlock = (day: string, blockIdx: number) => {
    setSlots((prev) => {
      const daySlot = prev[day];
      const blocks  = daySlot.blocks.filter((_, i) => i !== blockIdx);
      return { ...prev, [day]: { ...daySlot, blocks } };
    });
    setSelectedBlock(null);
  };

  const updateBlockTime = (day: string, blockIdx: number, field: "start" | "end", timeStr: string) => {
    const h = timeToHour(timeStr);
    if (isNaN(h)) return;
    const interval = selectedServicio ? (selectedServicio.duracion + selectedServicio.pausa) / 60 : SNAP;
    setSlots((prev) => {
      const blocks = prev[day].blocks.map((b, i) => {
        if (i !== blockIdx) return b;
        if (field === "start") {
          const clamped = Math.max(GRID_START, Math.min(b.end - interval, h));
          return { ...b, start: clamped };
        } else {
          const clamped = Math.min(GRID_END, Math.max(b.start + interval, h));
          return { ...b, end: clamped };
        }
      });
      return { ...prev, [day]: { ...prev[day], blocks } };
    });
  };

  const addTurn = (day: string, blockIdx: number) => {
    if (!selectedServicio) return;
    const interval = (selectedServicio.duracion + selectedServicio.pausa) / 60;
    setSlots((prev) => {
      const daySlot = prev[day];
      const blocks  = daySlot.blocks.map((b, i) => {
        if (i !== blockIdx) return b;
        const newEnd = b.end + interval;
        if (newEnd > GRID_END) return b;
        const nextBlock = daySlot.blocks.find((ob, oi) => oi !== blockIdx && ob.start >= b.end - 0.01);
        if (nextBlock && newEnd > nextBlock.start) return b;
        return { ...b, end: newEnd };
      });
      return { ...prev, [day]: { ...daySlot, blocks } };
    });
  };

  const removeTurn = (day: string, blockIdx: number) => {
    if (!selectedServicio) return;
    const interval = (selectedServicio.duracion + selectedServicio.pausa) / 60;
    setSlots((prev) => {
      const daySlot = prev[day];
      const blocks  = daySlot.blocks.map((b, i) => {
        if (i !== blockIdx) return b;
        const current = calcTurnos(b, selectedServicio.duracion, selectedServicio.pausa);
        if (current <= 1) return b;
        return { ...b, end: b.start + (current - 1) * interval };
      });
      return { ...prev, [day]: { ...daySlot, blocks } };
    });
  };

  const startDrag = (
    e: React.MouseEvent,
    day: string,
    blockIdx: number,
    mode: DragState["mode"]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dragMoved.current = false;
    const block       = slots[day].blocks[blockIdx];
    const minDuration = selectedServicio
      ? (selectedServicio.duracion + selectedServicio.pausa) / 60
      : SNAP;
    setDrag({
      day, blockIdx, mode,
      startY:        e.clientY,
      originalStart: block.start,
      originalEnd:   block.end,
      snap:          SNAP,
      minDuration,
    });
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<{ success: boolean; message?: string }>(
        `/servicios/${selectedId}/disponibilidad`,
        { disponibilidades: slotsToDisps(slots),
          min_aviso: Number(rules.aviso),
          min_cancelacion: Number(rules.cancelacion),
          max_anticipacion_dias: Number(rules.reservas),
         },
        token
      );
      if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(res.message ?? "Error al guardar");
    } catch (e: any) {
      setError(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCrearExcepcion = async () => {
  if (
    !nuevaExcepcion.fecha_inicio ||
    !nuevaExcepcion.fecha_fin
  ) {
    return;
  }

  try {
   await api.post("/excepciones", {
  fecha_desde: nuevaExcepcion.fecha_inicio,
  fecha_hasta: nuevaExcepcion.fecha_fin,
  hora_inicio: nuevaExcepcion.diaCompleto ? null : nuevaExcepcion.hora_inicio,
  hora_fin: nuevaExcepcion.diaCompleto ? null : nuevaExcepcion.hora_fin,
  motivo: nuevaExcepcion.motivo,
}, token);
      setShowNuevaExcepcion(false);
      // Recargar excepciones
      const res:any = await api.get<{ success: boolean; data: any[] }>("/excepciones", token);
      if (res.success) setExcepciones(res.data);
    } catch (e) {
      alert("Error al crear excepción");
    }
  };

  const handleDeleteExcepcion = async (id: number) => {
    try {
      await api.delete(`/excepciones/${id}`, token);

      setExcepciones((prev) =>
        prev.filter((e: any) => e.excepcion_id !== id)
      );
    } catch (error) {
      alert("Error al eliminar excepción");
    }
  };

  const isDragging = drag !== null;

  if (loadingServicios) return <AvailabilitySkeleton />;
  

  return (
    <div
      className={`p-4 md:p-8 max-w-6xl mx-auto ${isDragging ? "select-none" : ""}`}
      style={{ cursor: isDragging ? (drag.mode === "move" ? "grabbing" : "ns-resize") : undefined }}
    >
      {/* Header */}
      <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Configuración</nav>
      <div className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="font-display text-3xl text-ink">
            Disponibilidad
          </h1>

          <button
            onClick={() => setShowExcepciones(true)}
            className="self-start sm:self-auto px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Excepciones
          </button>
        </div>

        <p className="text-ink-muted mt-1">
          Definí cuándo aceptás reservas y tus reglas de agenda.
        </p>
      </div>
      {showExcepciones && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Excepciones
              </h2>

              <button
                onClick={() => setShowExcepciones(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowNuevaExcepcion(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                + Nueva excepción
              </button>
            </div>

            {excepciones.length === 0 ? (
              <p className="text-ink-muted">
                No hay excepciones configuradas.
              </p>
            ) : (
              <div className="space-y-3">
                {excepciones.map((e: any) => (
                  <div
                    key={e.excepcion_id}
                    className="border rounded-xl p-4"
                  >
                    <div className="font-medium">
                    {e.fecha_desde}
                    {e.fecha_desde !== e.fecha_hasta &&
                      ` al ${e.fecha_hasta}`}
                  </div>

                    <div className="text-sm text-ink-muted">
                      {e.hora_inicio && e.hora_fin
                        ? `${e.hora_inicio.slice(0, 5)} - ${e.hora_fin.slice(0, 5)}`
                        : "Día completo"}
                    </div>

                    {e.motivo && (
                      <div className="text-sm mt-1">
                        {e.motivo}
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleDeleteExcepcion(e.excepcion_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showNuevaExcepcion && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Nueva excepción
        </h2>

        <button
          onClick={() => setShowNuevaExcepcion(false)}
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">

        <div>
  <label className="block text-sm font-medium mb-1">
    Desde
  </label>

  <input
    type="date"
    value={nuevaExcepcion.fecha_inicio}
    onChange={(e) =>
      setNuevaExcepcion({
        ...nuevaExcepcion,
        fecha_inicio: e.target.value,
      })
    }
    className="w-full border rounded-lg px-3 py-2"
  />
</div>

<div>
  <label className="block text-sm font-medium mb-1">
    Hasta
  </label>

  <input
    type="date"
    value={nuevaExcepcion.fecha_fin}
    onChange={(e) =>
      setNuevaExcepcion({
        ...nuevaExcepcion,
        fecha_fin: e.target.value,
      })
    }
    className="w-full border rounded-lg px-3 py-2"
  />
</div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={nuevaExcepcion.diaCompleto}
            onChange={(e) =>
              setNuevaExcepcion({
                ...nuevaExcepcion,
                diaCompleto: e.target.checked,
              })
            }
          />

          <span>Día completo</span>
        </div>

        {!nuevaExcepcion.diaCompleto && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Hora inicio
              </label>

              <input
                type="time"
                value={nuevaExcepcion.hora_inicio}
                onChange={(e) =>
                  setNuevaExcepcion({
                    ...nuevaExcepcion,
                    hora_inicio: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Hora fin
              </label>

              <input
                type="time"
                value={nuevaExcepcion.hora_fin}
                onChange={(e) =>
                  setNuevaExcepcion({
                    ...nuevaExcepcion,
                    hora_fin: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Motivo
          </label>

          <textarea
            value={nuevaExcepcion.motivo}
            onChange={(e) =>
              setNuevaExcepcion({
                ...nuevaExcepcion,
                motivo: e.target.value,
              })
            }
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setShowNuevaExcepcion(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={handleCrearExcepcion}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  </div>
)}

      {/* Service context bar — doubles as selector */}
      {servicios.length > 0 && (
        <div className="mb-5 flex items-center gap-4 px-4 py-3 bg-surface border border-border rounded-xl text-sm flex-wrap">
          <div className="relative flex items-center">
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="appearance-none font-semibold text-ink bg-transparent pr-5 focus:outline-none cursor-pointer"
            >
              {servicios.map((s) => (
                <option key={s.servicio_id} value={s.servicio_id}>{s.nombre}</option>
              ))}
            </select>
            <ion-icon
              name="chevron-down-outline"
              style={{ fontSize: "13px", position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
          </div>
          {selectedServicio && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 text-ink-muted">
                <ion-icon name="time-outline" style={{ fontSize: "14px" }} />
                {selectedServicio.duracion} min
              </span>
              <span className="text-border">·</span>
              <span className="text-ink-muted">Pausa <strong className="text-ink ml-1">{selectedServicio.pausa} min</strong></span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Weekly visual grid ─────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl overflow-x-auto">
          {loadingDisp ? (
            <div className="flex items-center justify-center h-64" style={{ minWidth: "520px" }}>
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div style={{ minWidth: "520px" }}><>
              {/* Day headers */}
              <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                <div className="border-r border-border" />
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-3 px-1 border-r border-border last:border-r-0 flex flex-col items-center gap-1"
                  >
                    <p className="text-xs font-bold text-ink-muted uppercase tracking-wide">{day}</p>
                    <Toggle checked={slots[day].active} onChange={() => toggleDay(day)} />
                    <p className="text-xs text-ink-muted">{slots[day].active ? "Activo" : "Off"}</p>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                {/* Hours column */}
                <div className="border-r border-border">
                  {HOURS.map((h) => (
                    <div key={h} className="h-10 border-b border-border/50 flex items-center justify-center px-2">
                      <span className="text-xs text-ink-muted">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {DAYS.map((day) => (
                  <div key={day} className="relative border-r border-border last:border-r-0 overflow-hidden">
                    {HOURS.map((_, i) => (
                      <div key={i} className="h-10 border-b border-border/30 relative">
                        <div className="absolute inset-x-0 border-b border-border/15" style={{ top: "50%" }} />
                      </div>
                    ))}

                    {/* Window blocks */}
                    {slots[day].active &&
                      slots[day].blocks.map((block, bi) => {
                        const top      = (block.start - GRID_START) * HOUR_PX;
                        const height   = (block.end - block.start) * HOUR_PX;
                        const isThis   = isDragging && drag?.day === day && drag?.blockIdx === bi;
                        const isSel    = selectedBlock?.day === day && selectedBlock?.bi === bi;
                        const turnos   = selectedServicio
                          ? calcTurnos(block, selectedServicio.duracion, selectedServicio.pausa)
                          : null;

                        return (
                          <div
                            key={bi}
                            className={`absolute left-1 right-1 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-shadow ${
                              isSel
                                ? "bg-accent/30 border-2 border-accent shadow-md"
                                : "bg-accent/20 border border-accent/60"
                            }`}
                            style={{
                              top,
                              height,
                              cursor: isThis && drag.mode === "move" ? "grabbing" : "grab",
                              zIndex: isThis || isSel ? 10 : 1,
                            }}
                            onMouseDown={(e) => startDrag(e, day, bi, "move")}
                            onClick={() => { if (!dragMoved.current) setSelectedBlock({ day, bi }); }}
                          >
                            {/* Resize top */}
                            <div
                              className="absolute top-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-accent/30 transition-colors rounded-t-xl"
                              onMouseDown={(e) => startDrag(e, day, bi, "resize-top")}
                            />

                            {height >= 28 && (
                              <span className="text-xs font-bold text-ink pointer-events-none leading-tight text-center px-2">
                                {hourToTime(block.start)} — {hourToTime(block.end)}
                              </span>
                            )}
                            {height >= 48 && (
                              <span className="text-xs text-ink-muted pointer-events-none mt-0.5">
                                {getPeriod(block.start)}
                              </span>
                            )}
                            {height >= 64 && turnos !== null && (
                              <span className="text-xs text-ink-muted/70 pointer-events-none mt-0.5">
                                {turnos} turno{turnos !== 1 ? "s" : ""}
                              </span>
                            )}

                            {/* Resize bottom */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-accent/30 transition-colors rounded-b-xl"
                              onMouseDown={(e) => startDrag(e, day, bi, "resize-bottom")}
                            />
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </></div>
          )}
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Block editor */}
          {(() => {
            if (!selectedBlock) return (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Agregar Turnos</p>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => addBlock(d)}
                      className="text-xs py-2 rounded-lg border border-border hover:bg-accent/10 hover:border-accent/50 text-ink font-semibold transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-ink-muted text-center mt-2">o hacé clic en un turno para editarlo</p>
              </div>
            );
            const { day, bi } = selectedBlock;
            const block = slots[day]?.blocks[bi];
            const esHibrido = selectedServicio?.modalidad === "hibrido";
            if (!block) return null;
            const turnos   = selectedServicio ? calcTurnos(block, selectedServicio.duracion, selectedServicio.pausa) : null;
            const interval = selectedServicio ? (selectedServicio.duracion + selectedServicio.pausa) / 60 : SNAP;
            const canAdd   = block.end + interval <= GRID_END;
            const canRemove = turnos !== null && turnos > 1;
            return (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-ink-muted uppercase tracking-wide font-semibold mb-0.5">
                      {day} · {getPeriod(block.start)}
                    </p>
                    <p className="text-base font-bold text-ink">
                      {hourToTime(block.start)} — {hourToTime(block.end)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBlock(null)}
                    className="w-6 h-6 rounded-full bg-bg hover:bg-border/50 flex items-center justify-center text-ink-muted transition-colors"
                  >
                    <ion-icon name="close-outline" style={{ fontSize: "13px" }} />
                  </button>
                </div>

                {/* Time pickers */}
                <div className="flex items-center gap-2 mb-5">
                  <input
                    type="time"
                    value={hourToTime(block.start)}
                    onChange={(e) => updateBlockTime(day, bi, "start", e.target.value)}
                    className="flex-1 text-sm border border-border rounded-lg px-2 py-1.5 bg-bg text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                  <span className="text-ink-muted text-sm shrink-0">—</span>
                  <input
                    type="time"
                    value={hourToTime(block.end)}
                    onChange={(e) => updateBlockTime(day, bi, "end", e.target.value)}
                    className="flex-1 text-sm border border-border rounded-lg px-2 py-1.5 bg-bg text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>

                {selectedServicio?.modalidad === "hibrido" && (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-ink mb-2">
                      Modalidad
                    </label>

                    <select
                      value={block.modalidad || "presencial"}
                      onChange={(e) => {
                        const modalidad = e.target.value as "presencial" | "virtual";

                        setSlots((prev) => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            blocks: prev[day].blocks.map((b, i) =>
                              i === bi ? { ...b, modalidad } : b
                            ),
                          },
                        }));
                      }}
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-bg text-ink"
                    >
                      <option value="presencial">Presencial</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                )}

                {/* Turns */}
                {turnos !== null && (
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-semibold text-ink">Turnos</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeTurn(day, bi)}
                        disabled={!canRemove}
                        className="w-8 h-8 rounded-lg bg-bg border border-border hover:bg-border/40 disabled:opacity-30 flex items-center justify-center text-ink text-lg font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold w-20 text-center">
                        {turnos} turno{turnos !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => addTurn(day, bi)}
                        disabled={!canAdd}
                        className="w-8 h-8 rounded-lg bg-bg border border-border hover:bg-border/40 disabled:opacity-30 flex items-center justify-center text-ink text-lg font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button
                  onClick={() => removeBlock(day, bi)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
                >
                  <ion-icon name="trash-outline" style={{ fontSize: "14px" }} />
                  Eliminar bloque
                </button>
              </div>
            );
          })()}

          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-ink mb-4">Reglas de la agenda</h3>

            <div className="space-y-4">
              {/* Aviso mínimo */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Duración mínima de aviso</p>
                  <p className="text-xs text-ink-muted mt-0.5">¿Cuánta anticipación al reservar?</p>
                </div>
                <select
                  value={rules.aviso}
                  onChange={(e) => setRules((r) => ({ ...r, aviso: e.target.value }))}
                  className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0"
                >
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="48">48 horas</option>
                </select>
              </div>

              {/* Reservas anticipadas */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Reservas Anticipadas</p>
                  <p className="text-xs text-ink-muted mt-0.5">Máximo de días a futuro</p>
                </div>
                <select
                  value={rules.reservas}
                  onChange={(e) => setRules((r) => ({ ...r, reservas: e.target.value }))}
                  className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0"
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="30">30 días</option>
                  <option value="60">60 días</option>
                </select>
              </div>

              <div className="border-t border-border/30" />

              {/* Política de cancelación */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Política de Cancelación</p>
                  <p className="text-xs text-ink-muted mt-0.5">Tiempo mínimo sin cargo</p>
                </div>
                <select
                  value={rules.cancelacion}
                  onChange={(e) => setRules((r) => ({ ...r, cancelacion: e.target.value }))}
                  className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0"
                >
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="48">48 horas</option>
                  <option value="72">72 horas</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
           
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !selectedId}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              saved ? "bg-green-500 text-white" : "bg-ink text-white hover:bg-primary disabled:opacity-50"
            }`}
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
