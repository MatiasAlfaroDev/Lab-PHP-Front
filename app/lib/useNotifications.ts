import { useEffect, useState } from "react";
import { getEcho } from "../lib/echo";

export function useNotifications(userId?: number) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const echo = getEcho();
    if (!echo) return;

    const channelName = `user.${userId}`;
    const channel = echo.private(channelName);

    channel.notification((notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      echo.leave(channelName); // 👈 mismo nombre
    };
  }, [userId]);

  return notifications;
}