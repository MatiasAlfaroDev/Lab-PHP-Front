import { Outlet, useNavigate, NavLink } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "~/context/AuthContext";

const navItems = [
  { to: "/admin", label: "Panel", icon: "▣", end: true },
  { to: "/admin/users", label: "Usuarios", icon: "👥" },
  { to: "/admin/payments", label: "Pagos", icon: "💳" },
];

export default function AdminLayout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login", { replace: true });
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Backdrop — mobile only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "flex flex-col bg-sidebar shrink-0 transition-all duration-200 ease-in-out",
          "fixed inset-y-0 left-0 z-50",
          "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:inset-y-auto md:left-auto md:z-auto",
          "md:translate-x-0 md:w-56 md:min-h-screen",
        ].join(" ")}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-surface flex items-center justify-center"><span className="text-ink font-bold text-xs">+</span></span>
              <span className="font-display text-sidebar-text text-lg">Cita.Pro</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? "bg-white text-ink" : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"}`}
            >
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

      <main className="flex-1 overflow-auto">
        {/* Mobile top header — hidden on desktop */}
        <div className="sticky top-0 z-30 flex md:hidden items-center justify-between bg-sidebar px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-surface flex items-center justify-center shrink-0">
              <span className="text-ink font-bold text-xs">+</span>
            </span>
            <span className="font-display text-sidebar-text text-lg">Cita.Pro</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sidebar-text p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
