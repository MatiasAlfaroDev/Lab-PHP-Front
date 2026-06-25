import { NavLink, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

const navItems = [
  { to: "/admin", label: "Panel", icon: GridIcon, end: true },
  { to: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { to: "/admin/payments", label: "Pagos", icon: CardIcon },
];

interface Props {
  collapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ collapsed, isMobileOpen, onMobileClose }: Props) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // On mobile drawer: always show labels (never collapsed)
  const effectiveCollapsed = collapsed && !isMobileOpen;

  return (
    <>
      {/* Backdrop — mobile only */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={[
          "flex flex-col bg-sidebar shrink-0 transition-all duration-200 ease-in-out overflow-y-auto",
          "fixed inset-y-0 left-0 z-50 [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]",
          "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:inset-y-auto md:left-auto md:z-auto",
          "md:translate-x-0",
          collapsed ? "md:w-14" : "md:w-56",
          "md:min-h-screen",
        ].join(" ")}
      >
        {/* Logo + cerrar — solo en el drawer móvil; en desktop el logo vive en la barra superior compartida */}
        {isMobileOpen && (
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-sm bg-surface flex items-center justify-center shrink-0">
                <span className="text-ink font-bold text-xs">+</span>
              </span>
              <span className="font-display text-sidebar-text text-lg tracking-tight">
                Cita.Pro
              </span>
            </div>
            <button
              onClick={onMobileClose}
              title="Cerrar menú"
              className="text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={effectiveCollapsed ? label : undefined}
              onClick={isMobileOpen ? onMobileClose : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  effectiveCollapsed ? "justify-center px-0" : ""
                } ${
                  isActive
                    ? "bg-accent/15 text-accent-hover"
                    : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!effectiveCollapsed && <span className="flex-1">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User — solo en el drawer móvil; en desktop vive en la barra superior */}
        {isMobileOpen && (
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink-fixed text-xs font-bold shrink-0">
                A
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-text truncate">Admin</p>
                <p className="text-xs text-sidebar-muted">Administrador</p>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                title="Cerrar sesión"
                className="text-sidebar-muted hover:text-sidebar-text transition-colors cursor-pointer"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function GridIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function CardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>;
}
