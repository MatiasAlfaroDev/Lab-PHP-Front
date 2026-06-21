import { useEffect } from "react";
import { useGlobalNotifications } from "~/context/NotificationContext";
import { Check } from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useGlobalNotifications();

  useEffect(() => {
    loadNotifications().catch((err) => console.error("Error cargando notificaciones", err));
  }, [loadNotifications]);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Notificaciones</h1>
          <p className="text-ink-muted mt-1">
            {notifications.length} notificaciones · {unreadCount} sin leer
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="self-start sm:self-auto flex items-center gap-1.5 text-sm font-semibold border border-border px-4 py-2 rounded-full bg-surface hover:bg-bg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          Marcar todas como leídas
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 flex flex-col items-center text-center gap-2">
          <ion-icon name="notifications-outline" style={{ fontSize: "32px", color: "var(--color-ink-muted)" }} />
          <p className="text-ink-muted">No hay notificaciones todavía</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {notifications.map((n, idx) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${idx > 0 ? "border-t border-border" : ""} ${
                n.read_at ? "opacity-60" : ""
              }`}
            >
              <ion-icon
                name="notifications-outline"
                style={{ fontSize: "16px", color: "var(--color-ink-muted)", marginTop: "2px" }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-ink">{n.data?.type ?? "Notificación"}</p>

                  {!n.read_at && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="shrink-0 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
                    >
                      Marcar leída
                    </button>
                  )}
                </div>

                <p className="text-sm text-ink-muted mt-0.5">{n.data?.message ?? ""}</p>

                {n.data?.reserva_id && (
                  <p className="text-xs text-ink-muted mt-1.5">Reserva #{n.data.reserva_id}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
