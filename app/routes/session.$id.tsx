import { useState } from "react";
import { useNavigate, useParams } from "react-router";

export default function Session() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [notes, setNotes] = useState(
    "· Continuar trabajo con técnicas de respiración\n· Mencionó mejor sueño esta semana\n· Próxima: revisar registros del miércoles"
  );

  const handleEnd = () => navigate(`/session/${id}/rating`);

  return (
    <div className="h-screen flex flex-col bg-ink-fixed text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            EN VIVO · 14:23
          </span>
          <span className="text-white/40">·</span>
          <span className="text-sm text-white/60">Sesión individual</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-xs">○</span>
            Cifrada extremo a extremo
          </span>
          <span className="flex items-center gap-1.5">
            <span>👥</span>
            <span className="font-bold text-white">2</span>
          </span>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Main video area */}
        <div
          className="flex-1 flex items-center justify-center relative"
          style={{
            background: "radial-gradient(ellipse at center, #3d2b1f 0%, #1a1410 60%, #0a0906 100%)",
          }}
        >
          {/* Notes overlay */}
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded p-4 w-72">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-widest">NOTAS PRIVADAS</span>
              <span className="text-xs text-white/40">Auto-guardado</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent text-sm text-white/80 resize-none outline-none leading-relaxed"
              rows={5}
              placeholder="Escribiendo..."
            />
          </div>

          {/* Professional avatar center */}
          <div className="text-center">
            <div className="w-28 h-28 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/10 mx-auto mb-4 text-4xl font-bold text-white/60">
              MO
            </div>
            <p className="font-display text-white text-2xl mb-1">María Ortiz</p>
            <p className="text-sm text-white/50">Hablando · cámara y micrófono activos</p>
          </div>

          {/* Self view (PiP) */}
          <div className="absolute bottom-4 right-4 w-36 h-28 bg-white/10 rounded overflow-hidden border border-white/20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent mx-auto mb-1 flex items-center justify-center text-ink-fixed text-xs font-bold">LP</div>
              <p className="text-xs text-white font-medium">· Vos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <ControlBtn onClick={() => setMicOn(!micOn)} active={micOn} icon="🎤" label="Mic" />
          <ControlBtn onClick={() => setCamOn(!camOn)} active={camOn} icon="📷" label="Cám" />
          <ControlBtn onClick={() => {}} active={true} icon="🖥" label="Compartir" />
          <ControlBtn onClick={() => {}} active={true} icon="💬" label="Chat" badge={3} />
          <ControlBtn onClick={() => {}} active={true} icon="👥" label="Personas" />
          <ControlBtn onClick={() => {}} active={true} icon="⋯" label="Más" />

          <button
            onClick={handleEnd}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded transition-colors ml-4"
          >
            📞 Finalizar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlBtn({
  onClick,
  active,
  icon,
  label,
  badge,
}: {
  onClick: () => void;
  active: boolean;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 w-14 py-2 rounded transition-colors ${
        active ? "text-white hover:bg-white/10" : "text-white/40 hover:bg-white/10"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
      {badge && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 translate-x-3 w-4 h-4 rounded-full bg-accent text-ink-fixed text-xs flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
