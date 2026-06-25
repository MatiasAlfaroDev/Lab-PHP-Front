import { useEffect, useRef } from "react";
import { useAuth } from "~/context/AuthContext";
import { getEcho } from "~/lib/echo";

export type CatalogoEvento = {
  tipo: "servicio" | "paquete";
  accion: "creado" | "actualizado" | "eliminado";
  profesional_id: number;
  id: number;
};

const DEBOUNCE_MS = 500;

export function useCatalogoUpdates(onUpdate: (evento: CatalogoEvento) => void) {
  const { token } = useAuth();
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const echo = getEcho(token ?? undefined);
    if (!echo) return;

    const channel = echo.channel("catalogo");
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = (evento: CatalogoEvento) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(evento), DEBOUNCE_MS);
    };

    channel.listen(".CatalogoActualizado", handler);

    return () => {
      if (timer) clearTimeout(timer);
      channel.stopListening(".CatalogoActualizado", handler);
    };
  }, [token]);
}
