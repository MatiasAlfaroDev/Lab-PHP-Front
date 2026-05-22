import { useState } from "react";

const conversations = [
  { initials: "LP", name: "Lucía Pérez", preview: "Antes de la sesión, completá el formulario...", time: "1h", unread: 2, color: "bg-violet-500" },
  { initials: "CR", name: "Carlos Ruiz", preview: "¿Podemos mover la sesión del martes?", time: "3h", unread: 1, color: "bg-purple-400" },
  { initials: "ML", name: "Marta López", preview: "Muchas gracias por hoy, fue muy útil.", time: "ayer", unread: 0, color: "bg-orange-400" },
  { initials: "JV", name: "Joaquín Vega", preview: "Ok, nos vemos el jueves entonces.", time: "lun", unread: 0, color: "bg-teal-500" },
];

const messages = [
  { from: "client", text: "Hola María, ¿podemos confirmar el horario de mañana?", time: "10:30" },
  { from: "pro", text: "Hola Lucía! Sí, confirmado para las 16:30. Te mando el enlace 15 min antes.", time: "10:35" },
  { from: "client", text: "Perfecto, muchas gracias. Nos vemos mañana.", time: "10:37" },
  { from: "pro", text: "Antes de la sesión, completá el formulario que te envié por mail. ¡Nos vemos!", time: "10:40" },
];

export default function Messages() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 border-r border-border bg-surface flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-xl text-ink mb-3">Mensajes</h2>
          <input
            className="w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
            placeholder="Buscar..."
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-bg text-left transition-colors ${selected === i ? "bg-accent/20" : ""}`}
            >
              <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-ink-muted">{c.time}</span>
                </div>
                <p className="text-xs text-ink-muted truncate">{c.preview}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold shrink-0">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col bg-bg">
        <div className="bg-surface border-b border-border px-6 py-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${conversations[selected].color} flex items-center justify-center text-white text-xs font-bold`}>
            {conversations[selected].initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{conversations[selected].name}</p>
            <p className="text-xs text-ink-muted">Cliente · sesión mañana 16:30</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "pro" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-sm px-4 py-3 rounded text-sm ${
                  m.from === "pro" ? "bg-ink text-white" : "bg-surface border border-border text-ink"
                }`}
              >
                <p>{m.text}</p>
                <p className={`text-xs mt-1 ${m.from === "pro" ? "text-white/60" : "text-ink-muted"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface border-t border-border p-4 flex items-center gap-3">
          <input
            className="flex-1 border border-border rounded px-4 py-2.5 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink"
            placeholder="Escribir mensaje..."
          />
          <button className="bg-ink text-white px-4 py-2.5 rounded hover:bg-primary text-sm font-semibold transition-colors">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
