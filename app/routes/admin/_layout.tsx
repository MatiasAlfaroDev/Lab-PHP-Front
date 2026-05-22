import { Outlet, useNavigate, NavLink } from "react-router";
import { useEffect } from "react";
import { useAuth } from "~/context/AuthContext";

const navItems = [
  { to: "/admin", label: "Panel", icon: "▣", end: true },
  { to: "/admin/users", label: "Usuarios", icon: "👥" },
  { to: "/admin/payments", label: "Pagos", icon: "💳" },
];

export default function AdminLayout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate("/login", { replace: true });
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="w-56 min-h-screen bg-sidebar flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-surface flex items-center justify-center"><span className="text-ink font-bold text-xs">+</span></span>
            <span className="font-display text-sidebar-text text-lg">Cita.Pro</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? "bg-white text-ink" : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"}`}>
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink text-xs font-bold shrink-0">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-text truncate">Admin</p>
              <p className="text-xs text-sidebar-muted">Administrador</p>
            </div>
            <button onClick={() => { logout(); navigate("/login"); }} className="text-sidebar-muted hover:text-sidebar-text text-xs">✕</button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}
