import { useNavigate } from "react-router";
import { useGlobalNotifications } from "~/context/NotificationContext";

interface NotificationButtonProps {
  notificationsPath: string;
}

export function NotificationButton({
  notificationsPath,
}: NotificationButtonProps) {
  const navigate = useNavigate();
  const { unreadCount } = useGlobalNotifications();

  return (
    <button
      onClick={() => navigate(notificationsPath)}
      title="Notificaciones"
      className="relative text-sidebar-muted hover:text-sidebar-text transition-colors cursor-pointer"
    >
      <BellIcon className="w-5 h-5" />

      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none px-1 py-0.5 rounded-full">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 1-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
    </svg>
  );
}