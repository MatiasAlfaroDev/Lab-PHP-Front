import { useNotifications } from "../../lib/useNotifications";
import { useAuth } from "~/context/AuthContext";

export default function NotificationsPage() {
 const { user, token } = useAuth();

  console.log("USER", user);
  console.log("USER ID", user?.id);

  const notifications = useNotifications(user?.id, token?? undefined);

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
