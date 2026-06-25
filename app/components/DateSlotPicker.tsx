import { useEffect, useMemo, useState } from "react";
import { api } from "~/lib/api";

export type Slot = { hora: string; modalidad: string };

export function normalizeModality(m: string): string {
  const map: Record<string, string> = {
    presencial: "Presencial", virtual: "Virtual",
    hibrida: "Híbrida",      híbrida: "Híbrida",
  };
  return map[m.toLowerCase()] ?? m;
}

// Returns the Spanish day-of-week key for a Date
const DOW_MAP = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Runs `fn` over `items` with at most `limit` requests in flight at once,
// stopping early if `signal` is aborted (e.g. the month/service changed).
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  signal: AbortSignal
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      if (signal.aborted) return;
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAY_NAMES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// ── Mini Calendar ──────────────────────────────────────────────────────────
function MiniCalendar({
  year, month, availableDays, fullyBookedDates, selectedDate, onSelect, onPrev, onNext,
}: {
  year: number; month: number;
  availableDays: Set<string>;   // set of "lunes"|"martes"...
  fullyBookedDates: Set<string>; // dates (YYYY-MM-DD) que matchean el patrón pero ya no tienen turnos
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onPrev: () => void; onNext: () => void;
}) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrev}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg text-sm cursor-pointer"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-ink">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNext}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg text-sm cursor-pointer"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-ink-muted py-1 font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(year, month, day);
          const dateStr = toDateStr(year, month, day);
          const isPast = date < today;
          const dow = DOW_MAP[date.getDay()];
          const matchesPattern = availableDays.has(dow) && !isPast;
          const isFullyBooked = matchesPattern && fullyBookedDates.has(dateStr);
          const isAvailable = matchesPattern && !isFullyBooked;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={i}
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(dateStr)}
              className={`cursor-pointer relative text-xs py-1.5 rounded-lg transition-colors font-medium
                ${isSelected
                  ? "bg-primary text-white"
                  : isAvailable
                  ? "hover:bg-primary/10 text-ink"
                  : "text-ink-muted/40 cursor-default"}`}
            >
              {day}
              {isAvailable && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Date + slot picker ──────────────────────────────────────────────────────
// Self-contained: given a servicioId, fetches its weekly availability pattern,
// probes which visible-month days are fully booked, and lists time slots for
// the selected date. Selection state (date/slot) is controlled by the parent.
export function DateSlotPicker({
  servicioId, modalidad, selectedDate, selectedSlot, onSelectDate, onSelectSlot,
}: {
  servicioId: number;
  modalidad: string;
  selectedDate: string | null;
  selectedSlot: Slot | null;
  onSelectDate: (date: string | null) => void;
  onSelectSlot: (slot: Slot | null) => void;
}) {
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loadingDays, setLoadingDays] = useState(false);
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [loadingFullyBooked, setLoadingFullyBooked] = useState(false);
  const [fullyBookedError, setFullyBookedError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Load weekly availability pattern when the service changes
  useEffect(() => {
    setLoadingDays(true);
    onSelectDate(null);
    onSelectSlot(null);
    setSlots([]);

    api
      .get<{ success: boolean; data: string[] }>(`/servicios/${servicioId}/dias-disponibles`)
      .then((res) => {
        if (res.success) setAvailableDays(new Set(res.data));
      })
      .catch(() => setAvailableDays(new Set()))
      .finally(() => setLoadingDays(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId]);

  // Check, day by day, which dates of the visible month actually have open slots —
  // availableDays only encodes the weekly pattern, not whether a specific day is full.
  useEffect(() => {
    if (availableDays.size === 0) { setFullyBookedDates(new Set()); return; }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { year, month } = calMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const candidates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date < today) continue;
      if (!availableDays.has(DOW_MAP[date.getDay()])) continue;
      candidates.push(toDateStr(year, month, day));
    }
    if (candidates.length === 0) return;

    const controller = new AbortController();
    setLoadingFullyBooked(true);
    setFullyBookedError(null);

    mapWithConcurrency(
      candidates,
      4,
      (fecha) =>
        api
          .get<{ success: boolean; data: Slot[] }>(
            `/servicios/${servicioId}/slots?fecha=${fecha}`,
            undefined,
            controller.signal
          )
          .then((res) => ({ fecha, ok: true, full: res.success && res.data.length === 0 }))
          .catch((e) => ({ fecha, ok: e?.name === "AbortError" ? "aborted" : false, full: false })),
      controller.signal
    ).then((results) => {
      if (controller.signal.aborted) return;
      const failed = results.some((r) => r.ok === false);
      setFullyBookedError(failed ? "No se pudo verificar la disponibilidad de algunos días." : null);
      setFullyBookedDates(new Set(results.filter((r) => r.full).map((r) => r.fecha)));
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingFullyBooked(false);
    });

    return () => controller.abort();
  }, [servicioId, calMonth, availableDays]);

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    setSlots([]);
    onSelectSlot(null);
    setSlotsError(null);

    api
      .get<{ success: boolean; data: Slot[] }>(`/servicios/${servicioId}/slots?fecha=${selectedDate}`)
      .then((res) => {
        if (res.success) setSlots(res.data);
      })
      .catch((e: any) => setSlotsError(e.message ?? "Error al cargar horarios"))
      .finally(() => setLoadingSlots(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, servicioId]);

  // Live refresh when another part of the app reports a reserva changed
  // (e.g. a websocket notification), so slot availability stays current.
  useEffect(() => {
    if (!selectedDate) return;

    const handler = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Slot[] }>(
          `/servicios/${servicioId}/slots?fecha=${selectedDate}`
        );
        if (res.success) setSlots(res.data);
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener("reserva-updated", handler);
    return () => window.removeEventListener("reserva-updated", handler);
  }, [selectedDate, servicioId]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
          Seleccioná una fecha
        </p>
        {loadingDays ? (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : availableDays.size === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-ink-muted">
            <ion-icon name="calendar-outline" style={{ fontSize: "16px" }} />
            Este servicio no tiene horarios configurados aún.
          </div>
        ) : (
          <>
            <MiniCalendar
              year={calMonth.year}
              month={calMonth.month}
              availableDays={availableDays}
              fullyBookedDates={fullyBookedDates}
              selectedDate={selectedDate}
              onSelect={onSelectDate}
              onPrev={() =>
                setCalMonth(({ year, month }) =>
                  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
                )
              }
              onNext={() =>
                setCalMonth(({ year, month }) =>
                  month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
                )
              }
            />
            {loadingFullyBooked && (
              <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted">
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Verificando disponibilidad...
              </div>
            )}
            {fullyBookedError && !loadingFullyBooked && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                <ion-icon name="alert-circle-outline" style={{ fontSize: "14px" }} />
                {fullyBookedError}
              </div>
            )}
          </>
        )}
      </div>

      {selectedDate && (
        <>
          <hr className="border-border" />
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Horarios disponibles
            </p>
            {loadingSlots ? (
              <div className="flex justify-center py-4">
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slotsError ? (
              <p className="text-sm text-red-500">{slotsError}</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No hay turnos disponibles para este día.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {slots.map((slot) => (
                  <button
                    key={slot.hora}
                    onClick={() =>
                      onSelectSlot(selectedSlot?.hora === slot.hora ? null : slot)
                    }
                    className={`cursor-pointer text-sm py-2 rounded-xl border transition-colors flex flex-col items-center ${
                      selectedSlot?.hora === slot.hora
                        ? "bg-primary text-white border-primary"
                        : "border-border text-ink hover:bg-bg"
                    }`}
                  >
                    <span>{slot.hora}</span>
                    {modalidad === "hibrido" && (
                      <span className="text-[10px] opacity-70">
                        {normalizeModality(slot.modalidad)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
