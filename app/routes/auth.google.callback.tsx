import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

export default function GoogleCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

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

    if (token) {
      login(token, user);

      if (user.role === "professional") {
        navigate("/professional");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/client");
      }
    }
  }, []);

  return <p>Iniciando sesión...</p>;
}