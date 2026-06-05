import { useGlobalNotifications } from "~/context/NotificationContext";
import { useEffect } from "react";

export default function NotificationsPage() {
  const { notifications, markAsRead } = useGlobalNotifications();

  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Notificaciones</h1>


      <div className="space-y-2 mt-4">
        {notifications.map((n) => (
          <div key={n.id} className="p-3 bg-white rounded shadow">
            {n.message}
          </div>
        ))}
      </div>
    </div>
  );
}