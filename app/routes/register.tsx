import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

type Role = "professional" | "client";

export default function Register() {
  const [role, setRole] = useState<Role>("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== password_confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: any }>("/register", {
        name,
        email,
        password,
        password_confirmation,
        role,
      });
      login(data.token, data.user);
      if (data.user.role === "professional") navigate("/professional");
      else navigate("/client");
    } catch (err: any) {
      setError(err.message ?? "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, #e07055 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #c8ddd2 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white" />
          </span>
          <span className="font-display italic text-white text-xl">CitaPro</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display italic text-white text-5xl leading-tight mb-4">
            Comenzá hoy.
          </h1>
          <p className="text-primary-soft text-base leading-relaxed max-w-sm">
            Crea tu cuenta y empezá a gestionar tus reservas, clientes y pagos desde un solo lugar.
          </p>
        </div>
        <div className="relative z-10 text-primary-soft text-sm">
          + 12.000 profesionales · 4.9 ★
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-sm text-ink-muted mb-1">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-primary underline font-medium">
              Iniciar sesión
            </Link>
          </p>
          <h2 className="font-display italic text-4xl text-ink mb-1">Crear cuenta</h2>
          <p className="text-ink-muted mb-8">Completá tus datos para empezar.</p>

          {/* Role selector */}
          <div className="flex rounded-full border border-border bg-surface p-1 mb-6">
            {(["professional", "client"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                  role === r ? "bg-ink-fixed text-white shadow" : "text-ink-muted hover:text-ink"
                }`}
              >
                {r === "professional" ? "Soy profesional" : "Soy cliente"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={password_confirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                placeholder="••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta →"}
            </button>
          </form>

          <p className="text-xs text-ink-muted text-center mt-6">
            Al continuar aceptás los{" "}
            <a href="#" className="underline">Términos</a> y la{" "}
            <a href="#" className="underline">Política de privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
