import { useNotifications } from "../../lib/useNotifications";
import { useAuth } from "~/context/AuthContext";


export default function NotificationsPage() {
  const { user } = useAuth();

  const notifications = useNotifications(user?.id);

  return (
    <div>
      <h1>Notificaciones</h1>

      {notifications.map((n, i) => (
        <div key={i}>
          {n.message}
        </div>
      ))}
    </div>
  );
}


/*import { useState } from "react";

const notifications = [
  {
    id: 1,
    icon: "✓",
    title: "Tu reserva fue confirmada",
    body: "María Ortiz confirmó tu sesión del vie 22 may a las 15:00.",
    time: "hace 12 min",
    unread: true,
    actions: ["Ver detalle", "Agregar a calendario"],
    category: "reservas",
  },
  {
    id: 2,
    icon: "💬",
    title: "Nuevo mensaje de María Ortiz",
    body: '"Antes de la sesión, completá el formulario que te envié por mail. ¡Nos vemos!"',
    time: "hace 1 h",
    unread: true,
    actions: ["Responder"],
    category: "mensajes",
  },
  {
    id: 3,
    icon: "🔔",
    title: "Recordatorio: sesión en 24h",
    body: "Sesión con María Ortiz mañana 16:30 · Virtual. El enlace estará disponible 15 min antes.",
    time: "hace 2 h",
    unread: true,
    actions: ["Reprogramar"],
    category: "reservas",
  },
  {
    id: 4,
    icon: "$",
    title: "Pago confirmado",
    body: "Pago de €48 procesado para tu sesión del 22 may. Comprobante enviado.",
    time: "ayer",
    unread: false,
    actions: [],
    category: "pagos",
  },
  {
    id: 5,
    icon: "📦",
    title: "Tu paquete bajó a 5 sesiones",
    body: "Te quedan 5 de 8 sesiones · vence el 12 ago 2026.",
    time: "lunes",
    unread: false,
    actions: [],
    category: "sistema",
  },
  {
    id: 6,
    icon: "✕",
    title: "Sesión reprogramada",
    body: "Andrés Calleja propuso mover la sesión del 24 may a las 11:00 (antes 09:00).",
    time: "lunes",
    unread: false,
    actions: [],
    category: "reservas",
  },
];

const TABS = ["Todas · 24", "Reservas · 9", "Pagos · 4", "Mensajes · 7", "Sistema · 4"];

const channels = ["Email", "Push (móvil)", "WhatsApp", "SMS"];
const channelSubs = ["lucia@gmail.com", "iPhone · Chrome", "+54 11 5······", "Solo recordatorios"];
const channelEnabled = [true, true, false, false];

const topicToggles = [
  { label: "Confirmaciones de reserva", enabled: true },
  { label: "Recordatorios 24h y 1h", enabled: true },
  { label: "Mensajes nuevos", enabled: true },
  { label: "Cambios y cancelaciones", enabled: true },
  { label: "Promos y novedades", enabled: false },
];

const Toggle = ({ checked }: { checked: boolean }) => (
  <div className={`relative w-10 h-5 rounded-full cursor-pointer ${checked ? "bg-ink" : "bg-border"}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`} />
  </div>
);

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("Todas · 24");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Notificaciones</h1>
          <p className="text-ink-muted mt-1">14 nuevas · 3 sin leer</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm font-semibold text-ink border border-border px-4 py-2 rounded bg-surface hover:bg-bg transition-colors">
            ✓ Marcar todo como leído
          </button>
          <button className="p-2 border border-border rounded bg-surface hover:bg-bg">
            ⚙
          </button>
        </div>
      </div>

      { Category tabs }
      <div className="flex gap-2 mb-6 border-b border-border pb-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-semibold px-4 py-2 rounded whitespace-nowrap transition-colors ${
              activeTab === tab ? "bg-ink text-white" : "text-ink-muted hover:text-ink hover:bg-bg"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Feed }
        <div className="col-span-2 space-y-3">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">HOY</p>
          {notifications.slice(0, 3).map((n) => (
            <div
              key={n.id}
              className={`bg-surface border rounded p-4 ${n.unread ? "border-ink/20" : "border-border"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center text-sm shrink-0 ${n.unread ? "bg-accent text-ink" : "bg-bg text-ink-muted"}`}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-ink flex items-center gap-2">
                      {n.title}
                      {n.unread && <span className="w-2 h-2 rounded-full bg-accent inline-block" />}
                    </p>
                    <span className="text-xs text-ink-muted whitespace-nowrap ml-2">{n.time}</span>
                  </div>
                  <p className="text-xs text-ink-muted mb-2">{n.body}</p>
                  {n.actions.length > 0 && (
                    <div className="flex gap-2">
                      {n.actions.map((a) => (
                        <button key={a} className="text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded hover:bg-primary transition-colors">
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest pt-2">ESTA SEMANA</p>
          {notifications.slice(3).map((n) => (
            <div key={n.id} className="bg-surface border border-border rounded p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-bg text-ink-muted flex items-center justify-center text-sm shrink-0">{n.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <span className="text-xs text-ink-muted whitespace-nowrap ml-2">{n.time}</span>
                  </div>
                  <p className="text-xs text-ink-muted">{n.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Channels + preview }
        <div className="space-y-5">
          <div className="bg-surface border border-border rounded p-5">
            <h3 className="text-sm font-semibold text-ink mb-1">Canales</h3>
            <p className="text-xs text-ink-muted mb-4">Cómo querés enterarte</p>
            <div className="space-y-3">
              {channels.map((ch, i) => (
                <div key={ch} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{ch}</p>
                    <p className="text-xs text-ink-muted">{channelSubs[i]}</p>
                  </div>
                  <Toggle checked={channelEnabled[i]} />
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4">
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">Avisame sobre</p>
              <div className="space-y-3">
                {topicToggles.map((t) => (
                  <div key={t.label} className="flex items-center justify-between">
                    <span className="text-sm text-ink">{t.label}</span>
                    <Toggle checked={t.enabled} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dropdown preview }
          <div className="bg-surface border border-border rounded p-4">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">VISTA PREVIA · DROPDOWN</p>
            <div className="border border-border rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg">
                <span className="text-sm font-semibold text-ink">Notificaciones</span>
                <span className="badge badge-en-curso">3 SIN LEER</span>
              </div>
              {[
                { icon: "✓", title: "Reserva confirmada", sub: "María Ortiz · vie 22 may", time: "12m" },
                { icon: "💬", title: "Nuevo mensaje", sub: 'María: "Antes de la sesión…"', time: "1h" },
                { icon: "🔔", title: "Recordatorio en 24h", sub: "Sesión virtual con María", time: "2h" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg cursor-pointer">
                  <span className="w-6 h-6 rounded bg-accent/30 flex items-center justify-center text-xs shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{item.title}</p>
                    <p className="text-xs text-ink-muted truncate">{item.sub}</p>
                  </div>
                  <span className="text-xs text-ink-muted whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
*/