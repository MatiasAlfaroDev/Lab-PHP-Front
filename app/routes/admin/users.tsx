import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

export default function AdminUsers() {
  const { token } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

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

  const [modal, setModal] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  const blockUser = async (id: number) => {
    try {
      setLoadingId(id);

      const res: any = await api.post(
        `/admin/blockUser/${id}`,
        {},
        token
      );

      if (res.success) {
        const toggle = (list: any[]) =>
          list.map((u) =>
            u.id === id ? { ...u, activo: !u.activo } : u
          );

        setClients(toggle(clients));
        setProfessionals(toggle(professionals));

        setModal({
          open: true,
          message: res.message,
        });
      }
    } catch (e) {
      console.error("Error cambiando estado:", e);
    } finally {
      setLoadingId(null);
    }
  };
  
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
            {["USUARIO", "EMAIL", "SESIONES", "DESDE", "ESTADO", ""].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${
                  i === 0
                    ? "col-span-6"
                    : i === 1
                    ? "col-span-6"
                    : i === 2
                    ? "col-span-3 text-center"
                    : i === 3
                    ? "col-span-4 text-center"
                    : i === 4
                    ? "col-span-3 text-center"
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
                className="grid grid-cols-24 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors bg-surface"            >
              {/* USER */}
              <div className="col-span-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(u.name)}
                </div>

                <span className="text-sm font-semibold text-ink">
                  {u.name}
                </span>
              </div>

              {/* EMAIL */}
              <div className="col-span-6 min-w-0">
                <span className="text-sm text-ink-muted block truncate sm:truncate-none sm:break-words">
                  {u.email}
                </span>
              </div>

              {/* SESSIONS */}
              <div className="col-span-3 text-center">
                <span className="text-sm text-ink">{u.sessions}</span>
              </div>

              {/* JOINED */}
              <div className="col-span-4 text-center">
                <span className="text-sm text-ink-muted justify items-center">{u.joined}</span>
              </div>

              {/* ESTADO */}
              <div className="col-span-3 text-center">
                {u.activo ? (
                  <span className="text-xs px-2 py-1 rounded bg-green-500 text-white">
                    Activo
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-red-500 text-white">
                    Bloqueado
                  </span>
                )}
              </div>

              {/* ACTIONS */}
              <div className="col-span-2">
                <button
                  onClick={() => blockUser(Number(u.id))}
                  disabled={loadingId === u.id}
                  className={`text-xs px-2 py-1 rounded text-white ${
                    u.activo
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  } ${loadingId === u.id ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {loadingId === u.id
                    ? "Cargando..."
                    : u.activo
                    ? "Bloquear"
                    : "Activar"}
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
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 shadow-lg w-[300px] text-center">
            <p className="text-sm text-ink mb-4">{modal.message}</p>

            <button
              onClick={() => setModal({ open: false, message: "" })}
              className="bg-violet-500 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}