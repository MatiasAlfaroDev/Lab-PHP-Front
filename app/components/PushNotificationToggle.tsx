import { useGlobalNotifications } from "~/context/NotificationContext";

export function PushNotificationToggle() {
  const { pushSupported, pushEnabled, enablePush, disablePush } = useGlobalNotifications();

  if (!pushSupported) return null;

  const toggle = () => {
    if (pushEnabled) {
      disablePush().catch(console.error);
    } else {
      enablePush().catch(console.error);
    }
  };

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={pushEnabled}
      className="flex items-center gap-2.5 text-sm text-ink-muted cursor-pointer"
    >
      <span className="text-sm font-medium text-ink">Notificaciones push</span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          pushEnabled ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
            pushEnabled ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
