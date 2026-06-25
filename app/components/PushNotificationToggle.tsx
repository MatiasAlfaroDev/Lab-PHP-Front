import { Bell } from "lucide-react";
import { useGlobalNotifications } from "~/context/NotificationContext";

export function PushNotificationToggle() {
  const { pushSupported, pushEnabled, enablePush } = useGlobalNotifications();

  if (!pushSupported || pushEnabled) return null;

  return (
    <button
      onClick={() => enablePush().catch((err) => console.error("Error activando notificaciones push", err))}
      className="self-start sm:self-auto flex items-center gap-1.5 text-sm font-semibold border border-border px-4 py-2 rounded-full bg-surface hover:bg-bg transition-colors cursor-pointer"
    >
      <Bell className="w-4 h-4" />
      Activar notificaciones push
    </button>
  );
}
