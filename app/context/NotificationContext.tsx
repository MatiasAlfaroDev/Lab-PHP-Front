import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getEcho } from "~/lib/echo";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";
import { subscribeToPush } from "~/lib/push";

const pushSupported =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  !!import.meta.env.VITE_VAPID_PUBLIC_KEY;

type NotificationType = {
  id: string;
  data: {
    message: string;
    reserva_id?: number;
    type?: string;
    fecha?: string;
    hora?: string;
  };
  read_at: string | null;
};

type NotificationContextType = {
  notifications: NotificationType[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  pushSupported: boolean;
  pushEnabled: boolean;
  enablePush: () => Promise<boolean>;
  disablePush: () => Promise<boolean>;
};

type NotificationsResponse = {
  data: NotificationType[];
};

const NotificationContext =
  createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: number;
}) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Check for an existing subscription so the toggle stays hidden once already on.
  useEffect(() => {
    if (!pushSupported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushEnabled(!!sub))
      .catch(() => {});
  }, []);

  const enablePush = async () => {
    const sub = await subscribeToPush();
    if (!sub) return false;

    await api.post("/push/subscribe", sub.toJSON(), token);
    setPushEnabled(true);
    return true;
  };

  const disablePush = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await api.post("/push/unsubscribe", {}, token).catch(() => {});
    }
    setPushEnabled(false);
    return true;
  };

  // 🔵 LOAD
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
    }
  };

  // Carga inicial — antes solo se disparaba al entrar a /notifications,
  // dejando el badge/lista vacíos en el resto de la app hasta ese momento.
  useEffect(() => {
    if (!userId || !token) return;
    loadNotifications();
  }, [userId, token]);

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  // 🔵 MARK ONE
  const markAsRead = async (id: string) => {
    await api.post(`/notificaciones/${id}/leer`, {}, token);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    );
  };

  // 🔵 MARK ALL
  const markAllAsRead = async () => {
    await api.post("/notificaciones/leer-todas", {}, token);

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: new Date().toISOString(),
      }))
    );
  };

  // 🔵 WEBSOCKET (CORRECTO)
  useEffect(() => {
    if (!userId || !token) return;

    const echo = getEcho(token);
    if (!echo) return;

    const channelName = `user.${userId}`;
    const channel = echo.private(channelName);

    channel.notification((notification: any) => {
      console.log("WS NOTIFICATION:", notification);

      window.dispatchEvent(
        new CustomEvent("reserva-updated", {
          detail: notification,
        })
      );
 
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) return prev;

        return [
          {
            id: notification.id,
            read_at: null,
            data: notification.data ?? notification,
          },
          ...prev,
        ];
      });
    });

    return () => {
      echo.leave(channelName);
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
        pushSupported,
        pushEnabled,
        enablePush,
        disablePush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useGlobalNotifications() {
  const ctx = useContext(NotificationContext);

  if (!ctx) {
    throw new Error(
      "useGlobalNotifications debe usarse dentro del Provider"
    );
  }

  return ctx;
}