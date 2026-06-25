import { useState } from "react";
import { useNavigate } from "react-router";

const ASPECTS = ["Empática", "Profesional", "Puntual", "Buena escucha", "Clara", "Cálida", "Estructurada"];

const STAR_LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

export default function Rating() {
  const navigate = useNavigate();
  const [stars, setStars] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState<string[]>(["Empática", "Profesional", "Puntual", "Cálida"]);
  const [comment, setComment] = useState("Súper contenida y profesional. Cada sesión siento que avanzo un poco más.");
  const [publicName, setPublicName] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleAspect = (a: string) => {
    setSelected((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    navigate("/client");
  };

  const displayStars = hovered || stars;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="badge badge-confirmada mb-4 inline-block">SESIÓN FINALIZADA</span>
          <h1 className="font-display text-4xl text-ink mb-3">
            ¿Cómo estuvo tu sesión con María?
          </h1>
          <p className="text-ink-muted">Tu opinión la ayuda a mejorar y guía a otros clientes.</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded p-6 space-y-6">
          {/* Professional info */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm">MO</div>
              <div>
                <p className="text-sm font-semibold text-ink">María Ortiz</p>
                <p className="text-xs text-ink-muted">Sesión individual · 50 min · 22 may 15:00</p>
              </div>
            </div>
            <span className="text-xs text-ink-muted font-semibold">Sesión #14</span>
          </div>

          {/* Stars */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setStars(s)}
                  className={`cursor-pointer text-4xl transition-transform hover:scale-110 ${displayStars >= s ? "text-accent" : "text-border"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold text-ink">{STAR_LABELS[displayStars]}</p>
          </div>

          {/* Aspects */}
          <div>
            <p className="text-sm font-semibold text-ink mb-3">¿Qué destacarías?</p>
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAspect(a)}
                  className={`cursor-pointer text-sm px-4 py-2 rounded-full border font-semibold transition-colors ${
                    selected.includes(a)
                      ? "bg-ink-fixed text-white border-ink-fixed"
                      : "border-border text-ink-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {selected.includes(a) && "✓ "}
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Comentario <span className="text-ink-muted font-normal">(opcional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-border rounded px-4 py-3 text-sm text-ink bg-bg resize-none focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          {/* Public checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={publicName}
              onChange={(e) => setPublicName(e.target.checked)}
              className="w-4 h-4 accent-ink"
            />
            <span className="text-sm text-ink">Publicar mi reseña con mi nombre</span>
          </label>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-ink-fixed text-white font-semibold py-3 rounded hover:bg-primary transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Enviando..." : "Enviar reseña →"}
            </button>
            <button
              onClick={() => navigate("/client")}
              className="w-full border border-border text-ink-muted font-semibold py-3 rounded hover:bg-bg transition-colors cursor-pointer"
            >
              Saltar por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
