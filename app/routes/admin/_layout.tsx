import { Outlet, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { AdminSidebar } from "~/components/AdminSidebar";

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login", { replace: true });
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-sidebar">
      {/* Barra superior — logo + toggle, compartida por sidebar y contenido. Solo desktop */}
      <div className="hidden md:flex bg-sidebar shrink-0">
        <div
          className={`flex items-center justify-between px-4 py-4 shrink-0 transition-all duration-200 ease-in-out ${
            sidebarCollapsed ? "w-14" : "w-56"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">+</span>
            </span>
            {!sidebarCollapsed && (
              <span className="font-display text-sidebar-text text-lg tracking-tight">Cita.Pro</span>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              title="Contraer menú"
              className="text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            title="Expandir menú"
            className="flex items-center px-2 text-sidebar-muted hover:text-sidebar-text transition-colors cursor-pointer"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 flex items-center justify-end px-4">
          <HeaderControls />
        </div>
      </div>

      {/* Mobile top header — hidden on desktop */}
      <div className="sticky top-0 z-30 flex md:hidden items-center justify-between bg-sidebar px-4 py-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">+</span>
          </span>
          <span className="font-display text-sidebar-text text-lg tracking-tight">Cita.Pro</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-text p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          isMobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 overflow-auto min-w-0 bg-surface border-l border-sidebar-border rounded-t-2xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function HeaderControls() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function getInitials(name?: string) {
    if (!name) return "A";
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        title="Cuenta"
        className="flex items-center gap-2 cursor-pointer rounded-lg pl-3 pr-1.5 py-1.5"
      >
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-sidebar-text">{user?.name ?? "Admin"}</p>
          <p className="text-xs text-sidebar-muted">Administrador</p>
        </div>
        <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-ink-fixed text-xs font-bold shrink-0">
          {getInitials(user?.name)}
        </span>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
            <button
              onClick={async () => { setMenuOpen(false); await logout(); navigate("/login"); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink hover:bg-bg transition-colors cursor-pointer"
            >
              <LogoutIcon className="w-4 h-4 text-ink-muted" /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>;
}
function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>;
}
