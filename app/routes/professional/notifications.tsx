import { useGlobalNotifications } from "~/context/NotificationContext";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead } =
    useGlobalNotifications();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">
            Notificaciones
          </h1>

          <p className="text-ink-muted mt-1">
            {notifications.length} notificaciones · {unreadCount} sin leer
          </p>
        </div>

        <button
          onClick={markAsRead}
          className="flex items-center gap-2 text-sm font-semibold text-ink border border-border px-4 py-2 rounded bg-surface hover:bg-bg transition-colors"
        >
          ✓ Marcar todo como leído
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* FEED */}
        <div className="col-span-2 space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-surface border border-border rounded p-6 text-center">
              <p className="text-ink-muted">
                No hay notificaciones todavía
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="bg-surface border border-border rounded p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                    🔔
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-ink">
                        Nueva notificación
                      </p>
                    </div>

                    <p className="text-sm text-ink-muted">
                      {n.message}
                    </p>

                    {n.reserva_id && (
                      <p className="text-xs text-ink-muted mt-2">
                        Reserva #{n.reserva_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PANEL LATERAL */}
        <div className="space-y-5">
          <div className="bg-surface border border-border rounded p-5">
            <h3 className="text-sm font-semibold text-ink mb-2">
              Resumen
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink">
                  Total
                </span>

                <span className="font-semibold">
                  {notifications.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-ink">
                  Sin leer
                </span>

                <span className="font-semibold text-red-500">
                  {unreadCount}
                </span>
              </div>
            </div>
          </div>

          {/* Vista previa */}
          <div className="bg-surface border border-border rounded p-4">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">
              ÚLTIMAS NOTIFICACIONES
            </p>

            <div className="border border-border rounded overflow-hidden">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg"
                >
                  <span className="w-6 h-6 rounded bg-accent/30 flex items-center justify-center text-xs shrink-0">
                    🔔
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">
                      Notificación
                    </p>

                    <p className="text-xs text-ink-muted truncate">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}