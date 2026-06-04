import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echo: Echo<any> | null = null;

export function getEcho(token?: string) {
  if (typeof window === "undefined") return null;

  if (!echo) {
    (window as any).Pusher = Pusher;

    echo = new Echo({
      broadcaster: "reverb",
      key: import.meta.env.VITE_REVERB_APP_KEY,

      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT),

      forceTLS: false,
      enabledTransports: ["ws", "wss"],

      authEndpoint: "http://localhost:8000/broadcasting/auth",

      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      },
    });
  }

  return echo;
}