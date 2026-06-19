import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { api, APP_BASE_URL } from "~/lib/api";

type Role = "professional" | "client";

export default function Login() {
  const [role, setRole] = useState<Role>("professional");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: any }>("/login", {
        email, password, role,
      });
      login(data.token, data.user);
      if (data.user.role === "professional") navigate("/professional");
      else if (data.user.role === "admin") navigate("/admin");
      else navigate("/client");
    } catch (err: any) {
      setError(err.message ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (demoRole: Role) => {
    const demoUsers: Record<Role, any> = {
      client: { id: 1, name: "Lucía Pérez", email: "lucia@gmail.com", role: "client", initials: "LP" },
      professional: { id: 2, name: "María Ortiz", email: "maria.ortiz@cita.pro", role: "professional", initials: "MO" },
    };
    login("demo-token-" + demoRole, demoUsers[demoRole]);
    if (demoRole === "professional") navigate("/professional");
    else navigate("/client");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — dark editorial panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-fixed flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute top-12 right-12 w-48 h-48 bg-accent opacity-90 rotate-12"
          style={{ borderRadius: "2px" }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-surface flex items-center justify-center">
              <span className="text-ink font-bold text-xs">+</span>
            </span>
            <span className="font-display text-white text-xl">Cita.Pro</span>
          </div>
        </div>

        <div className="relative z-10">
          <span className="text-xs font-bold text-accent tracking-widest uppercase mb-4 block">
            Para profesionales independientes
          </span>
          <h1 className="font-display text-white text-5xl leading-tight mb-4">
            Sesiones,<br />paquetes,<br />cobros.{" "}
            <span className="text-accent">Listo.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Una plataforma para servicios profesionales — agenda, modalidades híbridas y pagos en una sola interfaz.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-white/40 text-sm">
          <span>+ 12.000 profesionales</span>
          <span>·</span>
          <span>4.9 ★ en App Store</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-sm text-ink-muted mb-1">
            ¿Es tu primera vez?{" "}
            <Link to="/register" className="text-ink underline font-semibold">
              Crear cuenta
            </Link>
          </p>
          <h2 className="font-display text-4xl text-ink mb-1">Iniciar sesión</h2>
          <p className="text-ink-muted mb-8">Accedé a tu agenda y tus clientes.</p>

          {/* Role selector */}
          <div className="flex rounded border border-border bg-surface mb-6">
            {(["professional", "client"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  role === r
                    ? "bg-ink-fixed text-white"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {r === "professional" ? "Soy profesional" : "Soy cliente"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria.ortiz@cita.pro"
                className="w-full px-4 py-3 border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink rounded"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-ink">Contraseña</label>
                 {/*<a href="#" className="text-sm text-ink-muted underline">¿Olvidaste tu contraseña?</a>  */}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-4 py-3 border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-ink rounded"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-ink"
              />
              <span className="text-sm text-ink">Mantener sesión iniciada</span>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink-fixed hover:bg-primary text-white font-semibold py-3 rounded transition-colors disabled:opacity-60"
            >
              {loading ? "Iniciando..." : "Iniciar sesión →"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-ink-muted uppercase tracking-widest">O CONTINUÁ CON</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="flex gap-3 mb-6">
            <button
            onClick={() => {
              window.location.href =
                `${APP_BASE_URL}/auth/google/redirect?role=${role}`;
            }}
            className="flex-1 flex items-center justify-center gap-2 border border-border rounded py-3 bg-surface hover:bg-bg transition-colors text-sm font-semibold text-ink"
          >
            <GoogleIcon /> Google
          </button>
          </div>

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
    </svg>
  );
}
