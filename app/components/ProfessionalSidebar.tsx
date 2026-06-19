import { NavLink, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

const navItems = [
  { to: "/professional/dashboard", label: "Resumen", icon: HomeIcon },
  { to: "/professional", label: "Clientes", icon: CalendarIcon, end: true },
  { to: "/professional/services", label: "Servicios", icon: BriefcaseIcon },
  { to: "/professional/service-packages", label: "Paquetes", icon: BoxesIcon },
  { to: "/professional/availability", label: "Disponibilidad", icon: ClockIcon },
  { to: "/professional/payments", label: "Cobros", icon: CardIcon },
];

interface Props {
  collapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function ProfessionalSidebar({ collapsed, isMobileOpen, onMobileClose }: Props) {
  const { user, logout } = useAuth();
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
          // Mobile: fixed overlay drawer
          "fixed inset-y-0 left-0 z-50",
          "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: in-flow sidebar
          "md:relative md:inset-y-auto md:left-auto md:z-auto",
          "md:translate-x-0",
          collapsed ? "md:w-14" : "md:w-56",
          "md:h-auto",
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
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          effectiveCollapsed ? "justify-center px-0" : ""
        } ${
          isActive
            ? "bg-accent/15 text-accent-hover"
            : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
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

        {/* User */}
        {isMobileOpen && (
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <button
                onClick={() => { navigate("/professional/profile"); onMobileClose(); }}
                title="Editar perfil"
                className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-ink-fixed text-xs font-bold shrink-0 hover:ring-2 hover:ring-accent-hover/40 transition-all"
              >
                {user?.initials ?? "MO"}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-text truncate">{user?.name ?? "Profesional"}</p>
                <p className="text-xs text-sidebar-muted">Profesional</p>
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
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function BriefcaseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M5.566 4.657A4.505 4.505 0 016.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0015.75 3h-7.5a3 3 0 00-2.684 1.657zM2.25 12a3 3 0 013-3h13.5a3 3 0 013 3v6a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-6zM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 016.75 6h10.5a3 3 0 012.683 1.657A4.505 4.505 0 0018.75 7.5H5.25z"/></svg>;
}
function BoxesIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function CardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
}
function BellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 1-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>;
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>;
}
