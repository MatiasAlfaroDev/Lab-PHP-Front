import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "~/context/AuthContext";
import { ClientSidebar } from "~/components/ClientSidebar";

export default function ClientLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate("/login", { replace: true });
    if (!isLoading && user && user.role === "professional")
      navigate("/professional", { replace: true });
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <ClientSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
