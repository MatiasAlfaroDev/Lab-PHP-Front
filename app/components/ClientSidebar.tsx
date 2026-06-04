import { NavLink, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

const navItems = [
  { to: "/client", label: "Resumen", icon: HomeIcon, end: true },
  { to: "/client/discover", label: "Descubrir", icon: SearchIcon },
  { to: "/client/packages", label: "Paquetes", icon: PackageIcon },
  { to: "/client/reservas", label: "Reservas",  icon: CalendarIcon, end: true },
  { to: "/client/messages", label: "Mensajes",  icon: MessageIcon,  disabled: true },
  { to: "/client/payments", label: "Pagos",     icon: CardIcon },
  { to: "/client/notifications", label: "Notificaciones", icon: BellIcon },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function ClientSidebar({ collapsed, onToggle }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={`${collapsed ? "w-14" : "w-56"} min-h-screen bg-sidebar flex flex-col transition-all duration-200 ease-in-out shrink-0`}
    >
      {/* Logo + toggle */}
      <div className="p-4 border-b border-white/10">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-sm bg-surface flex items-center justify-center shrink-0">
              <span className="text-ink font-bold text-xs">+</span>
            </span>
            {!collapsed && (
              <span className="font-display text-sidebar-text text-lg tracking-tight">
                Cita.Pro
              </span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onToggle}
              title="Contraer menú"
              className="text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <div className="flex justify-center mt-3">
            <button
              onClick={onToggle}
              title="Expandir menú"
              className="text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end, disabled }) => (
          disabled ? (
            <div
              key={to}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed opacity-40 text-sidebar-muted ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && (
                <span className="text-[10px] text-sidebar-muted/60 font-normal">pronto</span>
              )}
            </div>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  collapsed ? "justify-center px-0" : ""
                } ${
                  isActive
                    ? "bg-white text-ink"
                    : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
            </NavLink>
          )
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        {collapsed ? (
          <div className="flex justify-center py-1">
            <button
              onClick={() => navigate("/client/profile")}
              title={user?.name ?? "Usuario"}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink text-xs font-bold hover:ring-2 hover:ring-white/40 transition-all"
            >
              {user?.initials ?? "LP"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              onClick={() => navigate("/client/profile")}
              title="Editar perfil"
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink text-xs font-bold shrink-0 hover:ring-2 hover:ring-white/40 transition-all"
            >
              {user?.initials ?? "LP"}
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
        )}
      </div>
    </aside>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

function MessageIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
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
function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>;
}
function BellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 1-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>;
}
