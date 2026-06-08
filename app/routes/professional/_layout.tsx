import { Outlet, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { ProfessionalSidebar } from "~/components/ProfessionalSidebar";
import { NotificationProvider } from "~/context/NotificationContext";

export default function ProfessionalLayout() {
  const { user, token, isLoading } = useAuth();

  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    }

    if (!isLoading && user && user.role === "client") {
      navigate("/client", { replace: true });
    }
  }, [user, isLoading, navigate]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
  <NotificationProvider
    userId={user?.id}
    token={token ?? undefined}
  >
    <div className="flex min-h-screen bg-bg">
      <ProfessionalSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile top header — hidden on desktop */}
        <div className="sticky top-0 z-30 flex md:hidden items-center justify-between bg-sidebar px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-sm bg-surface flex items-center justify-center shrink-0">
              <span className="text-ink font-bold text-xs">+</span>
            </span>
            <span className="font-display text-sidebar-text text-lg tracking-tight">Cita.Pro</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sidebar-text p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  </NotificationProvider>
  );
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
