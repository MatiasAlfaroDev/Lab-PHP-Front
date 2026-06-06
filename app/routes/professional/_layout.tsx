import { Outlet, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { ProfessionalSidebar } from "~/components/ProfessionalSidebar";
import { NotificationProvider } from "~/context/NotificationContext";

export default function ProfessionalLayout() {
  const { user, token, isLoading } = useAuth();

  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      />

      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  </NotificationProvider>
);
}