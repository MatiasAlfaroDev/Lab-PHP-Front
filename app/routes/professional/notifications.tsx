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