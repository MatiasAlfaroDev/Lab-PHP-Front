import { useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { useTheme } from "~/context/ThemeContext";
import { api } from "~/lib/api";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfessionalProfile() {
  const { user, token, updateUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [descripcion, setDescripcion] = useState(user?.descripcion ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setInfoMsg(null);
    try {
      await api.put("/profesional/profile", { name: name.trim(), email: email.trim(), descripcion: descripcion.trim() }, token);
      updateUser({ name: name.trim(), email: email.trim(), initials: getInitials(name.trim()), descripcion: descripcion.trim() });
      setInfoMsg({ type: "ok", text: "Datos actualizados correctamente." });
    } catch (err: any) {
      setInfoMsg({ type: "err", text: err.message ?? "Error al guardar." });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "err", text: "Las contraseñas no coinciden." });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg({ type: "err", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await api.put("/profile/password", { current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword }, token);
      setPwdMsg({ type: "ok", text: "Contraseña actualizada." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdMsg({ type: "err", text: err.message ?? "Error al cambiar contraseña." });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-1">Mi perfil</h1>
      <p className="text-ink-muted mb-8">Gestiona tu información personal</p>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary-soft flex items-center justify-center text-ink-fixed text-2xl font-bold">
          {getInitials(name) || user?.initials || "?"}
        </div>
        <div>
          <p className="font-semibold text-ink text-lg">{name || user?.name}</p>
          <p className="text-sm text-ink-muted">Profesional</p>
        </div>
      </div>

      {/* Apariencia */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">Apariencia</p>
        <button
          type="button"
          role="switch"
          aria-checked={resolvedTheme === "dark"}
          aria-label="Modo oscuro"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-ink-fixed transition-colors cursor-pointer"
        >
          <span
            className={`flex items-center justify-center h-5 w-5 rounded-full bg-white shadow transition-transform ${
              resolvedTheme === "dark" ? "translate-x-1" : "translate-x-6"
            }`}
          >
            {resolvedTheme === "dark" && (
              <ion-icon name="moon" style={{ fontSize: "12px", color: "#1c1c1c" }} />
            )}
          </span>
        </button>
      </div>

      {/* Info personal */}
      <div className="bg-surface border border-border rounded p-6 mb-6">
        <h2 className="font-semibold text-ink mb-4">Información personal</h2>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {infoMsg && (
            <p className={`text-sm ${infoMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
              {infoMsg.text}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-ink-fixed text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>

      {/* Contraseña */}
      <div className="bg-surface border border-border rounded p-6">
        <h2 className="font-semibold text-ink mb-4">Cambiar contraseña</h2>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {pwdMsg && (
            <p className={`text-sm ${pwdMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
              {pwdMsg.text}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPwd}
              className="bg-ink-fixed text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {savingPwd ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
