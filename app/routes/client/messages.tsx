import { useState } from "react";

const conversations = [
  { initials: "MO", name: "María Ortiz", preview: "Antes de la sesión, completá el formulario...", time: "1h", unread: 2, color: "bg-violet-500" },
  { initials: "AC", name: "Andrés Calleja", preview: "¡Recordá traer ropa cómoda el lunes!", time: "ayer", unread: 0, color: "bg-orange-400" },
  { initials: "LS", name: "Liana Souza", preview: "¿Podés enviarme el registro de la semana?", time: "lun", unread: 0, color: "bg-teal-500" },
];

const messages = [
  { from: "pro", text: "Hola Lucía! ¿Cómo te sentiste después de la última sesión?", time: "lun 10:30" },
  { from: "client", text: "Mucho mejor, gracias! Seguí con los ejercicios de respiración.", time: "lun 11:00" },
  { from: "pro", text: "Antes de la sesión, completá el formulario que te envié por mail. ¡Nos vemos!", time: "hoy 10:40" },
];

export default function ClientMessages() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-72 border-r border-border bg-surface flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-xl text-ink mb-3">Mensajes</h2>
          <input className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Buscar..." />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c, i) => (
            <button key={i} onClick={() => setSelected(i)} className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-bg text-left transition-colors ${selected === i ? "bg-accent/20" : ""}`}>
              <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{c.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-ink-muted">{c.time}</span>
                </div>
                <p className="text-xs text-ink-muted truncate">{c.preview}</p>
              </div>
              {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-accent text-ink-fixed text-xs flex items-center justify-center font-bold shrink-0">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-bg">
        <div className="bg-surface border-b border-border px-6 py-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${conversations[selected].color} flex items-center justify-center text-white text-xs font-bold`}>{conversations[selected].initials}</div>
          <p className="text-sm font-semibold text-ink">{conversations[selected].name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-sm px-4 py-3 rounded text-sm ${m.from === "client" ? "bg-ink-fixed text-white" : "bg-surface border border-border text-ink"}`}>
                <p>{m.text}</p>
                <p className={`text-xs mt-1 ${m.from === "client" ? "text-white/60" : "text-ink-muted"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface border-t border-border p-4 flex items-center gap-3">
          <input className="flex-1 border border-border rounded px-4 py-2.5 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Escribir mensaje..." />
          <button className="bg-ink-fixed text-white px-4 py-2.5 rounded hover:bg-primary text-sm font-semibold transition-colors">Enviar</button>
        </div>
      </div>
    </div>
  );
}
