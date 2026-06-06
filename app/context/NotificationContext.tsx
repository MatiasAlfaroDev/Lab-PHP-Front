import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getEcho } from "~/lib/echo";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

type NotificationType = {
  id: string;
  data: {
    message: string;
    reserva_id?: number;
    type?: string;
  };
  read_at: string | null;
};

type NotificationContextType = {
  notifications: NotificationType[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

type NotificationsResponse = {
  data: NotificationType[];
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children, userId }: { children: ReactNode; userId?: number }) {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  // 🔵 LOAD (BACKEND REAL)
  const loadNotifications = async () => {
    try {
      const res = await api.get<NotificationsResponse>(
  "/notificaciones",
  token
);

      if (res?.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("Error cargando notificaciones", err);
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  // 🔵 MARK AS READ
  const markAsRead = async (id: string) => {
    await api.post(`/notificaciones/${id}/leer`, {}, token);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  };

  // 🔵 MARK ALL
  const markAllAsRead = async () => {
    await api.post("/notificaciones/leer-todas", {}, token);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );
  };

  // 🔵 WEBSOCKET
  useEffect(() => {
    if (!userId || !token) return;

    const echo = getEcho(token);
    if (!echo) return;

    const channel = echo.private(`user.${userId}`);

    channel.notification((notification: NotificationType) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      echo.leave(`user.${userId}`);
    };
  }, [userId, token]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useGlobalNotifications() {
  const ctx = useContext(NotificationContext);

  if (!ctx) {
    throw new Error("useGlobalNotifications debe usarse dentro del Provider");
  }

  return ctx;
}