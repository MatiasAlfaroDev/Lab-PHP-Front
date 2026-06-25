import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border/60 ${className}`} />;
}

function TableSkeleton({ title }: { title: string }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-ink mb-3">{title}</h2>

      <div className="bg-surface border-t border-border w-full overflow-x-auto">
        <div style={{ minWidth: "500px" }}>
          <div className="grid grid-cols-24 px-5 py-2 border-b border-border">
            <div className="col-span-6"><Skeleton className="h-3 w-12" /></div>
            <div className="col-span-6"><Skeleton className="h-3 w-12" /></div>
            <div className="col-span-3"><Skeleton className="h-3 w-12" /></div>
            <div className="col-span-4"><Skeleton className="h-3 w-12" /></div>
            <div className="col-span-3"><Skeleton className="h-3 w-12" /></div>
            <div className="col-span-2"><Skeleton className="h-3 w-12" /></div>
          </div>

          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className={`grid grid-cols-24 px-5 py-4 items-center ${row > 0 ? "border-t border-border" : ""}`}
            >
              <div className="col-span-6 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="col-span-6"><Skeleton className="h-4 w-32" /></div>
              <div className="col-span-3"><Skeleton className="h-4 w-8" /></div>
              <div className="col-span-4"><Skeleton className="h-4 w-16" /></div>
              <div className="col-span-3"><Skeleton className="h-5 w-16 rounded-full" /></div>
              <div className="col-span-2"><Skeleton className="h-6 w-14 rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { token } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
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

      <div className="bg-surface border-t border-border w-full overflow-x-auto">
        <div style={{ minWidth: "900px" }}>
          {/* HEADER */}
          <div className="grid grid-cols-24 px-5 py-2 border-b border-border">
            {["Usuario", "Email", "Sesiones", "Desde", "Estado", ""].map((h, i) => (
              <div
                key={i}
                className={`text-sm text-ink-muted ${
                  i === 0
                    ? "col-span-5"
                    : i === 1
                    ? "col-span-7"
                    : i === 2
                    ? "col-span-3 flex justify-center items-center"
                    : i === 3
                    ? "col-span-4"
                    : i === 4
                    ? "col-span-2"
                    : "col-span-2"
                }`}
              >
                {h}
              </div>
            ))}

          </div>

          {/* ROWS */}
          {data.map((u, idx) => (
            <div
              key={u.email}
              className={`grid grid-cols-24 px-5 py-4 items-start hover:bg-bg transition-colors ${idx > 0 ? "border-t border-border" : ""}`}
            >
              {/* USER */}
              <div className="col-span-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-ink-fixed text-xs font-bold">
                  {getInitials(u.name)}
                </div>

                <span className="text-sm font-semibold text-ink">
                  {u.name}
                </span>
              </div>

              {/* EMAIL */}
              <div className="col-span-7 min-w-0">
                <span className="text-sm text-ink-muted truncate">
                  {u.email}
                </span>
              </div>

              {/* SESSIONS */}
              <div className="col-span-3 flex items-center justify-center">
                <span className="text-sm text-ink">{u.sessions}</span>
              </div>

              {/* JOINED */}
              <div className="col-span-4">
                <span className="text-sm text-ink-muted truncate">{u.joined}</span>
              </div>

              {/* ESTADO */}
              <div className="col-span-2">
                <span className={u.activo ? "badge badge-confirmada" : "badge badge-cancelada"}>
                  {u.activo ? "Activo" : "Bloqueado"}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="col-span-1 ml-3">
                <button
                  onClick={() => blockUser(Number(u.id))}
                  disabled={loadingId === u.id}
                  className={`cursor-pointer text-xs px-2 py-1 rounded font-medium transition-colors ${
                    u.activo
                      ? "border border-red-200 text-red-500 hover:bg-red-50"
                      : "bg-ink-fixed text-white hover:bg-primary"
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

  if (loading) {
    return (
      <div className="p-4 md:p-8 w-full">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>

        <TableSkeleton title="Clientes" />
        <TableSkeleton title="Profesionales" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full">
      <div className="mb-6">
        <nav className="text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold">Admin</nav>
        <h1 className="font-display text-3xl text-ink">Usuarios</h1>
        <p className="text-ink-muted mt-1">
          Gestión de clientes y profesionales
        </p>
      </div>

      <Table title="Clientes" data={clients} />
      <Table title="Profesionales" data={professionals} />
      {modal.open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModal({ open: false, message: "" })}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 shadow-xl w-[300px] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-ink mb-4">{modal.message}</p>

            <button
              onClick={() => setModal({ open: false, message: "" })}
              className="bg-ink-fixed text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}