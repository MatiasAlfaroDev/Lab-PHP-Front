import { useEffect } from "react";
import { useGlobalNotifications } from "~/context/NotificationContext";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useGlobalNotifications();

  // 📌 cargar desde backend al entrar
  useEffect(() => {
    const init = async () => {
      try {
        await loadNotifications();
      } catch (err) {
        console.error("Error cargando notificaciones", err);
      }
    };

    init();
  }, [loadNotifications]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">
            Notificaciones
          </h1>

          <p className="text-ink-muted mt-1">
            {notifications.length} notificaciones · {unreadCount} sin leer
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="self-start sm:self-auto text-sm font-semibold border px-4 py-2 rounded bg-surface hover:bg-bg transition"
        >
          ✓ Marcar todas como leídas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* FEED */}
        <div className="lg:col-span-2 space-y-3">
          {notifications.length === 0 ? (
            <div className="border rounded p-6 text-center">
              <p className="text-ink-muted">
                No hay notificaciones todavía
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`border rounded p-4 transition ${
                  n.read_at ? "opacity-60" : "bg-surface"
                }`}
              >
                <div className="flex gap-3">

                  <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-ink" />
                  </div>

                  <div className="flex-1">

                    <div className="flex justify-between">
                      <p className="font-semibold text-sm">
                        {n.data?.type ?? "Notificación"}
                      </p>

                      {/* marcar individual */}
                      {!n.read_at && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-xs text-blue-500"
                        >
                          Marcar leída
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-ink-muted mt-1">
                      {n.data?.message ?? ""}
                    </p>

                    {n.data?.reserva_id && (
                      <p className="text-xs text-ink-muted mt-2">
                        Reserva #{n.data.reserva_id}
                      </p>
                    )}

                    {n.read_at && (
                      <p className="text-xs text-green-600 mt-2">
                        Leída
                      </p>
                    )}

                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-5">

          <div className="border rounded p-5">
            <h3 className="text-sm font-semibold mb-2">
              Resumen
            </h3>

            <div className="flex justify-between">
              <span>Total</span>
              <span>{notifications.length}</span>
            </div>

            <div className="flex justify-between text-red-500">
              <span>Sin leer</span>
              <span>{unreadCount}</span>
            </div>
          </div>

          <div className="border rounded p-4">
            <p className="text-xs uppercase mb-3">
              Últimas
            </p>

            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="py-2 border-b last:border-0">
                <p className="text-xs font-semibold truncate">
                  {n.data?.message ?? ""}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}