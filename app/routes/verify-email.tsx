import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

const RESEND_COOLDOWN = 45;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await api.post<{ success: boolean; message: string; token: string; user: any }>(
        "/verify-email",
        { email, code }
      );
      login(data.token, data.user);
      if (data.user.role === "professional") navigate("/professional");
      else if (data.user.role === "admin") navigate("/admin");
      else navigate("/client");
    } catch (err: any) {
      setError(err.message ?? "Código de verificación inválido o vencido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setResending(true);
    try {
      const data = await api.post<{ success: boolean; message: string }>(
        "/resend-verification-code",
        { email }
      );
      setInfo(data.message ?? "Código de verificación reenviado");
      startCooldown();
    } catch (err: any) {
      setError(err.message ?? "No se pudo reenviar el código");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-md">
        <p className="text-sm text-ink-muted mb-1">
          <Link to="/login" className="text-primary underline font-medium">
            ← Volver a iniciar sesión
          </Link>
        </p>
        <h2 className="font-display italic text-4xl text-ink mb-1">Verificar correo</h2>
        <p className="text-ink-muted mb-8">
          Te enviamos un código de 6 dígitos a tu correo. Ingresalo para activar tu cuenta.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
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
            <label className="block text-sm font-medium text-ink mb-1">Código de verificación</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="123456"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-ink-muted text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Verificar →"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || !email}
          className="w-full mt-4 border border-border text-ink font-medium py-3 rounded-xl transition-colors hover:bg-surface disabled:opacity-60"
        >
          {cooldown > 0
            ? `Reenviar código (${cooldown}s)`
            : resending
            ? "Reenviando..."
            : "Reenviar código"}
        </button>
      </div>
    </div>
  );
}
