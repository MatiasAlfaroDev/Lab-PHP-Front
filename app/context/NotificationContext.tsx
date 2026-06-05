import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import { getEcho } from "~/lib/echo";

type NotificationType = {
  id: string;
  message: string;
  reserva_id?: number;
  type?: string;
};

type NotificationContextType = {
  notifications: NotificationType[];
  unreadCount: number;
  markAsRead: () => void;
};

const NotificationContext =
  createContext<NotificationContextType | null>(null);

type Props = {
  children: ReactNode;
  userId?: number;
  token?: string;
};

export function NotificationProvider({
  children,
  userId,
  token,
}: Props) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId || !token) return;

    const echo = getEcho(token);

    if (!echo) return;

    const channelName = `user.${userId}`;

    console.log("SUSCRIPCION GLOBAL:", channelName);

    const channel = echo.private(channelName);

    channel.notification((notification: NotificationType) => {
      console.log("GLOBAL NOTIFICATION:", notification);

      setNotifications((prev) => [notification, ...prev]);

      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      echo.leave(channelName);
    };
  }, [userId, token]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useGlobalNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useGlobalNotifications debe usarse dentro de NotificationProvider"
    );
  }

  return context;
}