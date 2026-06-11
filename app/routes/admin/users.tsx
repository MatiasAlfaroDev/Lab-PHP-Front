import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

export default function AdminUsers() {
  const { token } = useAuth();

  const [clients, setClients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const loadUsers = async () => {
      try {
        const [resClients, resPros]: any = await Promise.all([
          api.get("/admin/clients", token),
          api.get("/admin/professionals", token),
        ]);

        if (resClients.success) setClients(resClients.data);
        if (resPros.success) setProfessionals(resPros.data);
      } catch (e) {
        console.error("Error loading users:", e);
      }
    };

    loadUsers();
  }, [token]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const Table = ({ title, data }: { title: string; data: any[] }) => (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-ink mb-3">{title}</h2>

      <div className="border border-border rounded overflow-x-auto">
        <div style={{ minWidth: "500px" }}>
          {/* HEADER */}
          <div className="grid grid-cols-24 px-5 py-3 border-b border-border bg-bg">
            {["USUARIO", "EMAIL", "SESIONES", "DESDE", ""].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${
                  i === 0
                    ? "col-span-7"
                    : i === 1
                    ? "col-span-7"
                    : i === 2
                    ? "col-span-3 text-center"
                    : i === 3
                    ? "col-span-5 text-center"
                    : "col-span-2"
                }`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* ROWS */}
          {data.map((u) => (
            <div
              key={u.email}
              className="grid grid-cols-24 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors bg-surface"
            >
              {/* USER */}
              <div className="col-span-7 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(u.name)}
                </div>

                <span className="text-sm font-semibold text-ink">
                  {u.name}
                </span>
              </div>

              {/* EMAIL */}
              <div className="col-span-7 min-w-0">
                <span className="text-sm text-ink-muted block truncate sm:truncate-none sm:break-words">
                  {u.email}
                </span>
              </div>

              {/* SESSIONS */}
              <div className="col-span-3 text-center">
                <span className="text-sm text-ink">{u.sessions}</span>
              </div>

              {/* JOINED */}
              <div className="col-span-5 text-center">
                <span className="text-sm text-ink-muted justify items-center">{u.joined}</span>
              </div>

              {/* ACTIONS */}
              <div className="col-span-1">
                <button className="text-ink-muted hover:text-ink p-1">
                  ⋯
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Usuarios</h1>
        <p className="text-ink-muted mt-1">
          Gestión de clientes y profesionales
        </p>
      </div>

      <Table title="Clientes" data={clients} />
      <Table title="Profesionales" data={professionals} />
    </div>
  );
}