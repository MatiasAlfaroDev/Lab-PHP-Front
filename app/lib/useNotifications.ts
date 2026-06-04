import { useEffect, useState } from "react";
import { getEcho } from "../lib/echo";

export function useNotifications(userId?: number, token?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const echo = getEcho(token ?? undefined);
    if (!echo) return;

    const channelName = `user.${userId}`;

    console.log("Suscribiendo a:", channelName);

    const channel = echo.private(`user.${userId}`)

      channel.listen(".Illuminate\\Notifications\\Events\\BroadcastNotificationCreated", (e: any) => {
    console.log("RAW EVENT:", e);
  });

    channel.notification((notification: any) => {
      console.log("NOTIFICACION RECIBIDA", notification);

      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      echo.leave(channelName);
    };
  }, [userId, token]);

  return notifications;
}