import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api";

type Client = {
  cliente_id: number;
  nombre: string;
  email: string;
  sesiones_restantes: number;
  proxima_sesion: string;
  hora_proxima_sesion: string;
  estado: string;
};

const colors = [
  "bg-violet-500",
  "bg-purple-400",
  "bg-orange-400",
  "bg-teal-500",
  "bg-amber-500",
];

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("citapro_token");

    const fetchClients = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/clientes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();

        console.log(data);

        if (Array.isArray(data)) {
          setClients(data);
        } else {
          setClients([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">
            Clientes
          </h1>

          <p className="text-ink-muted mt-1">
            {clients.length} clientes activos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="border border-border rounded px-4 py-2 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink w-56"
            placeholder="Buscar cliente..."
          />

          <button className="bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors">
            + Agregar cliente
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-border bg-bg">
          {[
            "CLIENTE",
            "EMAIL",
            "SESIONES",
            "PRÓXIMA SESIÓN",
            "ESTADO",
            "",
          ].map((h, i) => (
            <div
              key={i}
              className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${
                i === 0
                  ? "col-span-3"
                  : i === 1
                  ? "col-span-2"
                  : i === 2
                  ? "col-span-2"
                  : i === 3
                  ? "col-span-3"
                  : i === 4
                  ? "col-span-2"
                  : "col-span-1"
              }`}
            >
              {h}
            </div>
          ))}
        </div>

        {clients.map((c, index) => {
          const initials = c.nombre
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={c.cliente_id}
              className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors"
            >
              <div className="col-span-3 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg ${
                    colors[index % colors.length]
                  } flex items-center justify-center text-white text-xs font-bold shrink-0`}
                >
                  {initials}
                </div>

                <span className="text-sm font-semibold text-ink">
                  {c.nombre}
                </span>
              </div>

              <div className="col-span-3">
                <span className="text-sm text-ink-muted">
                  {c.email}
                </span>
              </div>

              <div className="col-span-1">
                <span className="text-sm font-semibold text-ink">
                  {c.sesiones_restantes}
                </span>
              </div>

              <div className="col-span-3">
                <span className="text-sm text-ink">
                  {c.proxima_sesion}{" "}
                  {c.hora_proxima_sesion?.slice(0, 5) ?? ""}
                </span>
              </div>

              <div className="col-span-2">
                <span
                  className={`badge ${
                    c.estado === "EN SESION"
                      ? "badge-en-vivo"
                      : "badge-confirmada"
                  }`}
                >
                  {c.estado}
                </span>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <button className="text-ink-muted hover:text-ink p-1">
                  
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}