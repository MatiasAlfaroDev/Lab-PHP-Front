import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import Landing from "~/components/Landing";

export function meta() {
  return [{ title: "CitaPro — Agenda, pagos y videollamadas en un solo lugar" }];
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === "client") {
      navigate("/client", { replace: true });
    } else if (user.role === "professional") {
      navigate("/professional", { replace: true });
    } else if (user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-ink-muted text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  return <Landing />;
}
