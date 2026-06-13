import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

export default function GoogleCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [modal, setModal] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const error = params.get("error");

    // 🔴 ERROR (bloqueado)
    if (error) {
      setModal({
        open: true,
        message: error,
      });
      return;
    }

    const token = params.get("token");

    const user = {
      id: Number(params.get("id")),
      name: params.get("name") || "",
      email: params.get("email") || "",
      role: params.get("role") as any,
      initials: (params.get("name") || "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    };

    // 🟢 LOGIN OK
    if (token) {
      login(token, user);

      if (user.role === "professional") navigate("/professional");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/client");
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-ink-muted">Iniciando sesión...</p>

      {/* 🔴 MODAL */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[320px] text-center">
            <h2 className="text-lg font-bold mb-2 text-red-600">
              Acceso denegado
            </h2>

            <p className="text-sm text-ink mb-4">{modal.message}</p>

            <button
              onClick={() => navigate("/login")}
              className="bg-ink text-white px-4 py-2 rounded"
            >
              Volver al login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}