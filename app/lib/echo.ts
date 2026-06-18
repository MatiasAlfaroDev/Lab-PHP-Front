import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { APP_BASE_URL } from "./api";

let echo: Echo<any> | null = null;

export function getEcho(token?: string) {
  if (typeof window === "undefined") return null;

  if (!echo) {
    (window as any).Pusher = Pusher;
    Pusher.logToConsole = true;

    echo = new Echo({
      broadcaster: "reverb",
      key: import.meta.env.VITE_REVERB_APP_KEY,

      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT),

      forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
      enabledTransports: ["ws", "wss"],

      authEndpoint: `${APP_BASE_URL}/broadcasting/auth`,

      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      },

      withCredentials: true,
    });
  }

  return echo;
}