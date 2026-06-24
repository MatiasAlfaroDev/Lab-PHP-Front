import { NavLink, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

const navItems = [
  { to: "/client", label: "Inicio", icon: HomeIcon, end: true },
  { to: "/client/discover", label: "Descubrir", icon: SearchIcon },
  { to: "/client/packages", label: "Paquetes", icon: PackageIcon },
  { to: "/client/reservas", label: "Reservas", icon: CalendarIcon, end: true },
  { to: "/client/payments", label: "Pagos", icon: CardIcon },
];

interface Props {
  collapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function ClientSidebar({ collapsed, isMobileOpen, onMobileClose }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function getInitials(name?: string) {
    if (!name) return "U";
    return name
      .split(" ")
      .map(w => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

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
          // Mobile: fixed overlay drawer
          "fixed inset-y-0 left-0 z-50",
          "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: in-flow sidebar
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
              className="text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors"
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

      {!effectiveCollapsed && (
        <span className="flex-1">{label}</span>
      )}
    </NavLink>
  ))}
</nav>

        {/* User — solo en el drawer móvil; en desktop vive en HeaderControls */}
        {isMobileOpen && (
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <button
                onClick={() => { navigate("/client/profile"); onMobileClose(); }}
                title="Editar perfil"
                className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink-fixed text-xs font-bold shrink-0 hover:ring-2 hover:ring-accent-hover/40 transition-all"
              >
                {getInitials(user?.name)}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-text truncate">
                  {user?.name ?? "Usuario"}
                </p>
                <p className="text-xs text-sidebar-muted">Cliente</p>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                title="Cerrar sesión"
                className="text-sidebar-muted hover:text-sidebar-text transition-colors"
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

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function PackageIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>;
}
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
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
