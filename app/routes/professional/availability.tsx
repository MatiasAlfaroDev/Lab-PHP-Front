import { useState, useEffect } from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": React.HTMLAttributes<HTMLElement> & { name?: string };
    }
  }
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Servicio {
  servicio_id: number;
  nombre: string;
  tipo: string;
  duracion: number;
  pausa: number;
}

interface Block {
  start: number; // decimal hours e.g. 9.75 = 09:45
  end:   number;
}

interface DaySlot {
  active: boolean;
  blocks: Block[];
}

type WeekSlots = Record<string, DaySlot>;

interface DragState {
  day:           string;
  blockIdx:      number;
  startY:        number;
  originalStart: number;
  originalEnd:   number;
  snap:          number;
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

const GRID_START   = 8;
const GRID_END     = 22;
const HOUR_PX      = 40;
const DEFAULT_SNAP = 0.5;

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

// Each individual turn = one draggable block of exactly `duracion` minutes.
// Pauses are visible as gaps between consecutive blocks.
function generateTurns(servicio: Servicio | undefined | null): Block[] {
  const durH   = servicio ? servicio.duracion / 60 : 1;
  const pauseH = servicio ? servicio.pausa    / 60 : 0;
  const step   = durH + pauseH;
  const turns: Block[] = [];
  let cursor = 9;
  while (cursor + durH <= 18) {
    turns.push({ start: cursor, end: cursor + durH });
    cursor = Math.round((cursor + step) * 10000) / 10000;
  }
  return turns;
}

// When loading from backend: decompose availability windows into individual turns.
function dispsToSlots(
  data: { dia_semana: string; hora_inicio: string; hora_fin: string }[],
  servicio?: Servicio | null
): WeekSlots {
  const slots: WeekSlots = structuredClone(DEFAULT_SLOTS);
  for (const d of data) {
    const key = DIA_TO_KEY[d.dia_semana];
    if (!key) continue;
    if (servicio) {
      const durH   = servicio.duracion / 60;
      const pauseH = servicio.pausa    / 60;
      const step   = durH + pauseH;
      let cursor   = timeToHour(d.hora_inicio);
      const winEnd = timeToHour(d.hora_fin);
      while (cursor + durH <= winEnd + 0.0001) {
        slots[key].active = true;
        slots[key].blocks.push({ start: cursor, end: cursor + durH });
        cursor = Math.round((cursor + step) * 10000) / 10000;
      }
    } else {
      slots[key].active = true;
      slots[key].blocks.push({ start: timeToHour(d.hora_inicio), end: timeToHour(d.hora_fin) });
    }
  }
  return slots;
}

// Each block = one turn record in the backend (hora_inicio = turn start, hora_fin = turn end)
function slotsToDisps(slots: WeekSlots) {
  return Object.entries(slots)
    .filter(([, day]) => day.active && day.blocks.length > 0)
    .flatMap(([key, day]) =>
      day.blocks.map((b) => ({
        dia_semana:  KEY_TO_DIA[key],
        hora_inicio: hourToTime(b.start),
        hora_fin:    hourToTime(b.end),
      }))
    );
}

// Returns the nearest valid start position that doesn't overlap other blocks.
function resolveCollision(
  proposed: number,
  duration: number,
  others: Block[],
  step: number,
  originalStart: number
): number {
  const sorted = [...others].sort((a, b) => a.start - b.start);

  // Build free intervals (gaps in the grid not occupied by other blocks)
  const free: [number, number][] = [];
  let cursor = GRID_START;
  for (const o of sorted) {
    if (o.start > cursor) free.push([cursor, o.start]);
    cursor = Math.max(cursor, o.end);
  }
  if (cursor < GRID_END) free.push([cursor, GRID_END]);

  // Check if proposed position already fits
  for (const [fs, fe] of free) {
    if (proposed >= fs && proposed + duration <= fe) return proposed;
  }

  // Find closest valid position across all free intervals
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
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
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
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-surface border border-border rounded overflow-hidden">
          <div className="grid grid-cols-8 h-14 border-b border-border">
            <div className="border-r border-border" />
            {DAYS.map((d) => <div key={d} className="border-r border-border last:border-r-0" />)}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 border-b border-border/30">
              <div className="h-10 border-r border-border/40" />
              {DAYS.map((d) => <div key={d} className="h-10 border-r border-border/20 last:border-r-0" />)}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded h-56" />
          <div className="bg-surface border border-border rounded h-44" />
          <div className="bg-accent/20 rounded h-20" />
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
  const [rules,            setRules]            = useState<Rules>({ aviso: "24", reservas: "60", cancelacion: "24" });

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
    const svc = servicios.find((s) => s.servicio_id === selectedId);
    api
      .get<{ success: boolean; data: any[] }>(`/servicios/${selectedId}/disponibilidad`)
      .then((res) => {
        setSlots(res.success && res.data.length > 0
          ? dispsToSlots(res.data, svc)
          : structuredClone(DEFAULT_SLOTS)
        );
      })
      .catch(() => setSlots(structuredClone(DEFAULT_SLOTS)))
      .finally(() => setLoadingDisp(false));
  }, [selectedId, servicios]);

  // ── Global drag handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!drag) return;

    const onMove = (e: MouseEvent) => {
      const deltaY = e.clientY - drag.startY;
      setSlots((prev) => {
        const allBlocks = prev[drag.day].blocks;
        const others    = allBlocks.filter((_, i) => i !== drag.blockIdx);
        const blocks    = allBlocks.map((b, i) => {
          if (i !== drag.blockIdx) return b;
          const duration = drag.originalEnd - drag.originalStart;
          const rawStart = drag.originalStart + deltaY / HOUR_PX;
          const clamped  = Math.max(GRID_START, Math.min(GRID_END - duration, rawStart));
          const snapped  = snapTo(clamped, drag.snap);
          const start    = resolveCollision(snapped, duration, others, drag.snap, drag.originalStart);
          return { start, end: start + duration };
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
        : { active: true, blocks: generateTurns(selectedServicio) },
    }));
  };

  const addTurn = (day: string) => {
    const durH   = selectedServicio ? selectedServicio.duracion / 60 : 1;
    const pauseH = selectedServicio ? selectedServicio.pausa    / 60 : 0;
    setSlots((prev) => {
      const daySlot  = prev[day];
      const last     = daySlot.blocks[daySlot.blocks.length - 1];
      const newStart = last
        ? Math.round((last.end + pauseH) * 10000) / 10000
        : 9;
      const newEnd   = newStart + durH;
      if (newEnd > GRID_END) return prev;
      return { ...prev, [day]: { ...daySlot, blocks: [...daySlot.blocks, { start: newStart, end: newEnd }] } };
    });
  };

  const removeTurn = (day: string) => {
    setSlots((prev) => {
      const blocks = prev[day].blocks.slice(0, -1);
      return { ...prev, [day]: { ...prev[day], blocks, active: blocks.length > 0 } };
    });
  };

  const startDrag = (e: React.MouseEvent, day: string, blockIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const block    = slots[day].blocks[blockIdx];
    const snapStep = selectedServicio
      ? (selectedServicio.duracion + selectedServicio.pausa) / 60
      : DEFAULT_SNAP;
    setDrag({ day, blockIdx, startY: e.clientY, originalStart: block.start, originalEnd: block.end, snap: snapStep });
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<{ success: boolean; message?: string }>(
        `/servicios/${selectedId}/disponibilidad`,
        { disponibilidades: slotsToDisps(slots) },
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

  const isDragging    = drag !== null;
  const blockHeightPx = selectedServicio
    ? (selectedServicio.duracion / 60) * HOUR_PX
    : DEFAULT_SNAP * HOUR_PX;

  if (loadingServicios) return <AvailabilitySkeleton />;

  return (
    <div
      className={`p-8 max-w-6xl mx-auto ${isDragging ? "select-none" : ""}`}
      style={{ cursor: isDragging ? "grabbing" : undefined }}
    >
      {/* Header */}
      <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Configuración</nav>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Disponibilidad</h1>
          <p className="text-ink-muted mt-1">Definí cuándo aceptás reservas y tus reglas de agenda.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {servicios.length > 0 && (
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none"
            >
              {servicios.map((s) => (
                <option key={s.servicio_id} value={s.servicio_id}>{s.nombre}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !selectedId}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all ${
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

      {/* Service context bar */}
      {selectedServicio && (
        <div className="mb-5 flex items-center gap-4 px-4 py-3 bg-surface border border-border rounded-xl text-sm flex-wrap">
          <span className="font-semibold text-ink">{selectedServicio.nombre}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1 text-ink-muted">
            <ion-icon name="time-outline" style={{ fontSize: "14px" }} />
            Duración <strong className="text-ink ml-1">{selectedServicio.duracion} min</strong>
          </span>
          <span className="text-border">·</span>
          <span className="text-ink-muted">
            Pausa <strong className="text-ink ml-1">{selectedServicio.pausa} min</strong>
          </span>
          <span className="text-border">·</span>
          <span className="text-ink-muted">
            Snap de grilla <strong className="text-ink ml-1">{selectedServicio.duracion + selectedServicio.pausa} min</strong>
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* ── Weekly visual grid ─────────────────────────────────────── */}
        <div className="col-span-2 bg-surface border border-border rounded overflow-hidden">
          {loadingDisp ? (
            <div className="flex items-center justify-center h-64">
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Day headers — centered */}
              <div className="grid grid-cols-8 border-b border-border">
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
              <div className="grid grid-cols-8">
                {/* Hours column — labels centered in cell */}
                <div className="border-r border-border">
                  {HOURS.map((h) => (
                    <div key={h} className="h-10 border-b border-border/50 flex items-center justify-center">
                      <span className="text-xs text-ink-muted">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {DAYS.map((day) => (
                  <div key={day} className="relative border-r border-border last:border-r-0 overflow-hidden">
                    {/* Background rows */}
                    {HOURS.map((_, i) => (
                      <div key={i} className="h-10 border-b border-border/30 relative">
                        <div className="absolute inset-x-0 border-b border-border/15" style={{ top: "50%" }} />
                      </div>
                    ))}

                    {/* Individual turn blocks — each = one turn, gap = pause */}
                    {slots[day].active &&
                      slots[day].blocks.map((block, bi) => {
                        const top        = (block.start - GRID_START) * HOUR_PX;
                        const isThisDrag = isDragging && drag?.day === day && drag?.blockIdx === bi;

                        return (
                          <div
                            key={bi}
                            className="absolute left-1 right-1 bg-accent/40 border border-accent rounded flex items-center justify-center overflow-hidden"
                            style={{
                              top,
                              height: blockHeightPx,
                              cursor: isThisDrag ? "grabbing" : "grab",
                              zIndex: isThisDrag ? 10 : 1,
                            }}
                            onMouseDown={(e) => startDrag(e, day, bi)}
                          >
                            {blockHeightPx >= 18 && (
                              <span className="text-xs font-bold text-ink pointer-events-none leading-none">
                                {hourToTime(block.start)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Rules */}
          <div className="bg-surface border border-border rounded p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Reglas de la agenda</h3>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Aviso mínimo</p>
                  <p className="text-xs text-ink-muted">Anticipación para reservar</p>
                </div>
                <select
                  value={rules.aviso}
                  onChange={(e) => setRules((r) => ({ ...r, aviso: e.target.value }))}
                  className="text-xs border border-border rounded px-2 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0"
                >
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="48">48 horas</option>
                </select>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Buffer entre sesiones</p>
                  <p className="text-xs text-ink-muted">Duración + pausa del servicio</p>
                </div>
                <span className="text-xs border border-border rounded px-2 py-1.5 bg-bg text-ink-muted font-semibold shrink-0">
                  Automático
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Reservas anticipadas</p>
                  <p className="text-xs text-ink-muted">Máximo hacia el futuro</p>
                </div>
                <select
                  value={rules.reservas}
                  onChange={(e) => setRules((r) => ({ ...r, reservas: e.target.value }))}
                  className="text-xs border border-border rounded px-2 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0"
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="30">30 días</option>
                  <option value="60">60 días</option>
                </select>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Cancelación sin cargo</p>
                  <p className="text-xs text-ink-muted">Tiempo mínimo</p>
                </div>
                <select
                  value={rules.cancelacion}
                  onChange={(e) => setRules((r) => ({ ...r, cancelacion: e.target.value }))}
                  className="text-xs border border-border rounded px-2 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0"
                >
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="48">48 horas</option>
                  <option value="72">72 horas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Turnos por día — editable */}
          {selectedServicio && (
            <div className="bg-surface border border-border rounded p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Turnos por día</h3>
              <div className="space-y-2">
                {DAYS.filter((d) => slots[d].active).length === 0 ? (
                  <p className="text-xs text-ink-muted">Activá días en la grilla para ver el resumen.</p>
                ) : (
                  DAYS.filter((d) => slots[d].active).map((day) => {
                    const count = slots[day].blocks.length;
                    return (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="text-ink-muted w-20 shrink-0">
                          {KEY_TO_DIA[day].charAt(0).toUpperCase() + KEY_TO_DIA[day].slice(1)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => removeTurn(day)}
                            disabled={count <= 0}
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg disabled:opacity-30 text-sm leading-none"
                          >
                            −
                          </button>
                          <span className="font-semibold text-ink w-20 text-center text-xs">
                            {count} turno{count !== 1 ? "s" : ""}
                          </span>
                          <button
                            onClick={() => addTurn(day)}
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg text-sm leading-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="bg-accent border border-accent/50 rounded p-4">
            <p className="text-sm font-bold text-ink mb-1">Bloques individuales por turno</p>
            <p className="text-xs text-ink">
              {selectedServicio
                ? `Cada bloque = ${selectedServicio.duracion} min. Los espacios entre bloques son las pausas de ${selectedServicio.pausa} min.`
                : "Seleccioná un servicio para ver el detalle."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
