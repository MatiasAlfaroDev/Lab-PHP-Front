// Mapeos compartidos de estado de reserva — una sola fuente de verdad para
// que el color de un estado sea siempre el mismo en agenda, calendario y badges.
export const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  pagada: "Pagada",
  en_curso: "En curso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
  no_asistida: "No asistida",
};

// Para badges de texto (.badge-* definidas en app.css).
export const ESTADO_BADGE_CLASS: Record<string, string> = {
  pendiente: "badge badge-pendiente",
  confirmada: "badge badge-confirmada",
  pagada: "badge badge-pagada",
  en_curso: "badge badge-en-curso",
  finalizada: "badge badge-finalizada",
  cancelada: "badge badge-cancelada",
  no_asistida: "badge badge-no-asistida",
};

// Para bloques de calendario (fondo + borde izquierdo) — mismos tonos que ESTADO_BADGE_CLASS.
export const ESTADO_CALENDAR_CLASS: Record<string, string> = {
  pendiente: "bg-amber-100 border-l-4 border-amber-400",
  confirmada: "bg-green-100 border-l-4 border-green-400",
  pagada: "bg-blue-100 border-l-4 border-blue-400",
  en_curso: "bg-violet-100 border-l-4 border-violet-500",
  finalizada: "bg-surface border-l-4 border-border",
  cancelada: "bg-red-100 border-l-4 border-red-400",
};
