import { useRef } from "react";
import { Link } from "react-router";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: delay / 1000,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: ref, dependencies: [delay] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function AgendaFragment() {
  return (
    <div className="flex items-center gap-2.5 p-2.5 border border-border rounded-xl mb-4">
      <div className="text-center shrink-0 w-9">
        <p className="text-[10px] text-ink-muted uppercase font-medium">Hoy</p>
        <p className="font-display text-sm text-ink">10:00</p>
      </div>
      <div className="w-7 h-7 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center shrink-0">M</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink truncate">María Ortiz</p>
        <span className="badge badge-confirmada">confirmada</span>
      </div>
    </div>
  );
}

function ModalidadFragment() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="badge badge-en-vivo">En vivo</span>
      <span className="flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded-lg">
        <ion-icon name="videocam-outline" style={{ fontSize: "14px" }} /> Unirse
      </span>
    </div>
  );
}

function PaquetesFragment() {
  return (
    <div className="border border-border rounded-xl p-3 mb-4">
      <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
        <ion-icon name="cube-outline" style={{ fontSize: "14px" }} /> Activo
      </div>
      <p className="text-ink-muted text-xs mb-1.5">
        <span className="text-lg font-bold text-ink">3</span> de 5 sesiones
      </p>
      <div className="h-1.5 bg-border rounded-full">
        <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
      </div>
    </div>
  );
}

function PagosFragment() {
  return (
    <div className="flex items-center justify-between gap-3 border border-border rounded-xl p-3 mb-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink truncate">Sesión de coaching</p>
        <p className="text-[10px] text-ink-muted">$1.200</p>
      </div>
      <span className="bg-ink-fixed text-white text-[10px] font-semibold px-3 py-1.5 rounded-full shrink-0">Pagar</span>
    </div>
  );
}

function NotificacionesFragment() {
  return (
    <div className="flex items-center gap-3 border border-border rounded-xl p-3 mb-4">
      <span className="relative shrink-0">
        <ion-icon name="notifications-outline" style={{ fontSize: "20px" }} />
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] leading-none px-1 py-0.5 rounded-full">1</span>
      </span>
      <p className="text-xs text-ink">Tu sesión empieza en 10 min</p>
    </div>
  );
}

function StarIcon({ filled = true, size = 12 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DescubrirFragment() {
  return (
    <div className="flex items-center gap-2.5 border border-border rounded-xl p-3 mb-4">
      <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-white shrink-0">LP</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink truncate">Lucía Pérez</p>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-0.5 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} filled={i < 5} />
            ))}
          </span>
          <span className="text-[10px] text-ink-muted">4.9 (32)</span>
        </div>
      </div>
    </div>
  );
}

function CalificacionesFragment() {
  return (
    <div className="border border-border rounded-xl p-3 mb-4">
      <span className="flex items-center gap-0.5 text-accent mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} filled />
        ))}
      </span>
      <p className="text-[10px] text-ink-muted">"Excelente atención, muy puntual"</p>
    </div>
  );
}

const FEATURES = [
  {
    title: "Agenda inteligente",
    desc: "Visualizá tu semana en una grilla clara y gestioná disponibilidad, bloqueos y horarios sin choques.",
    Fragment: AgendaFragment,
  },
  {
    title: "Modalidad híbrida",
    desc: "Atendé presencial, por videollamada o ambas. La sala virtual se abre 10 minutos antes de cada sesión.",
    Fragment: ModalidadFragment,
  },
  {
    title: "Paquetes de sesiones",
    desc: "Armá paquetes con varias sesiones y vendélos para que tus clientes los consuman a su ritmo.",
    Fragment: PaquetesFragment,
  },
  {
    title: "Pagos integrados",
    desc: "Cobrá con PayPal o de forma presencial y seguí el estado de cada pago desde un solo panel.",
    Fragment: PagosFragment,
  },
  {
    title: "Notificaciones al instante",
    desc: "Recordatorios y avisos push para que nadie se olvide de una reserva ni se quede esperando.",
    Fragment: NotificacionesFragment,
  },
  {
    title: "Descubrí profesionales cerca",
    desc: "Explorá servicios por ubicación y modalidad, y elegí al profesional que mejor se adapte a vos.",
    Fragment: DescubrirFragment,
  },
  {
    title: "Calificaciones y reseñas",
    desc: "Calificá cada sesión y construí una reputación que genera confianza con nuevos clientes.",
    Fragment: CalificacionesFragment,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Creá tu perfil",
    desc: "Definí tus servicios, precios, duración y modalidad en minutos.",
  },
  {
    n: "02",
    title: "Recibí reservas",
    desc: "Tus clientes te encuentran, reservan online y pagan al instante.",
  },
  {
    n: "03",
    title: "Atendé y cobrá",
    desc: "Presencial o por videollamada, con todo el historial siempre a la mano.",
  },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
        <span className="text-white font-bold text-sm">+</span>
      </span>
      <span className="font-display text-xl text-ink">Cita.Pro</span>
    </Link>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3 block">
      {children}
    </span>
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const accentSquareRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.7 } });

        tl.from(
          [".hero-eyebrow", ".hero-title", ".hero-desc", ".hero-visual", ".hero-ctas", ".hero-trust"],
          { opacity: 0, y: 16, stagger: 0.08 }
        ).from(
          ".hero-mock-row",
          { opacity: 0, x: 16, duration: 0.5, stagger: 0.12 },
          "-=0.3"
        );

        if (accentSquareRef.current) {
          gsap.to(accentSquareRef.current, {
            y: -24,
            rotate: 20,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        return () => tl.kill();
      });
    },
    { scope: heroRef }
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-ink-muted">
            <a href="#caracteristicas" className="hover:text-ink transition-colors">Características</a>
            <a href="#como-funciona" className="hover:text-ink transition-colors">Cómo funciona</a>
            <a href="#para-quien" className="hover:text-ink transition-colors">Para quién es</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline text-sm font-semibold text-ink hover:underline">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="bg-accent hover:bg-accent-hover text-ink-fixed text-sm font-semibold px-4 py-2 rounded-full transition-all hover:scale-105"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        ref={heroRef}
        className="max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center"
      >
        <div>
          <div className="hero-eyebrow">
            <Eyebrow>Para profesionales y clientes independientes</Eyebrow>
          </div>
          <h1 className="hero-title font-display text-ink text-5xl lg:text-6xl leading-tight mb-6">
            Agenda, pagos y<br />videollamadas, todo junto.
          </h1>
          <p className="hero-desc text-ink-muted text-lg leading-relaxed max-w-md mb-8">
            CitaPro conecta profesionales independientes con sus clientes: reservá sesiones
            presenciales, virtuales o híbridas, vendé paquetes y cobrá sin salir de la plataforma.
          </p>
          <div className="hero-ctas flex flex-wrap items-center gap-4 mb-10">
            <Link
              to="/register"
              className="bg-accent hover:bg-accent-hover text-ink-fixed font-semibold px-6 py-3 rounded-full transition-all hover:scale-105"
            >
              Crear cuenta gratis →
            </Link>
            <a
              href="#como-funciona"
              className="border border-border hover:border-ink text-ink font-semibold px-6 py-3 rounded-full transition-all hover:scale-105"
            >
              Ver cómo funciona
            </a>
          </div>
          <div className="hero-trust flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <span>Presencial, virtual e híbrida</span>
          </div>
        </div>

        {/* Visual mock */}
        <div className="hero-visual relative">
          <div
            ref={accentSquareRef}
            className="absolute -top-6 -right-6 w-40 h-40 bg-accent opacity-90 rotate-12 -z-10"
            style={{ borderRadius: "2px" }}
          />
          <div className="bg-surface border border-border rounded-2xl shadow-xl p-5 relative">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-ink text-lg">Hoy</span>
              <span className="badge badge-confirmada">3 reservas</span>
            </div>
            <div className="space-y-3">
              <div className="hero-mock-row flex items-center gap-3 p-3 border border-border rounded-xl transition-colors hover:bg-bg">
                <div className="w-10 h-10 rounded-full bg-violet-400 flex items-center justify-center font-bold text-white text-sm">LP</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Lucía Pérez</p>
                  <p className="text-xs text-ink-muted">10:00 · Sesión de coaching</p>
                </div>
                <span className="badge badge-pagada">Pagada</span>
              </div>
              <div className="hero-mock-row flex items-center gap-3 p-3 border border-border rounded-xl transition-colors hover:bg-bg">
                <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center font-bold text-white text-sm">RG</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Rodrigo Gómez</p>
                  <p className="text-xs text-ink-muted">12:30 · Videollamada · Nutrición</p>
                </div>
                <span className="badge badge-en-curso">Virtual</span>
              </div>
              <div className="hero-mock-row flex items-center gap-3 p-3 border border-border rounded-xl transition-colors hover:bg-bg">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-bold text-white text-sm">MO</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">María Ortiz</p>
                  <p className="text-xs text-ink-muted">16:00 · Paquete: 3/5 sesiones</p>
                </div>
                <span className="badge badge-pendiente">Pendiente</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="caracteristicas" className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <Reveal className="max-w-2xl mb-12">
          <Eyebrow>Características</Eyebrow>
          <h2 className="font-display text-ink text-4xl leading-tight">
            Todo lo que necesitás para gestionar tu negocio
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="bg-surface border border-border rounded-2xl p-6 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <f.Fragment />
                <h3 className="font-display text-ink text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <Reveal className="max-w-2xl mb-12">
          <Eyebrow>Cómo funciona</Eyebrow>
          <h2 className="font-display text-ink text-4xl leading-tight">
            De la reserva al cobro, en tres pasos
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <span className="font-display text-5xl text-ink-muted/30 block mb-4">{s.n}</span>
              <h3 className="font-display text-ink text-xl mb-2">{s.title}</h3>
              <p className="text-ink-muted leading-relaxed">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Audience split */}
      <section id="para-quien" className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <div className="grid md:grid-cols-2 gap-6">
          <Reveal className="bg-surface border border-border rounded-2xl p-8 lg:p-10 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <Eyebrow>Para profesionales</Eyebrow>
            <h3 className="font-display text-ink text-2xl mb-4">Gestioná tu agenda como un estudio entero</h3>
            <ul className="space-y-3 mb-8">
              {[
                "Agenda y disponibilidad sin choques de horario",
                "Paquetes y servicios con precios propios",
                "Pagos y reportes en un solo panel",
                "Notificaciones automáticas de cada reserva",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-muted">
                  <ion-icon name="checkmark-outline" style={{ fontSize: "18px", color: "var(--color-accent-hover)", flexShrink: 0, marginTop: "1px" }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className="font-semibold text-ink underline">
              Crear cuenta como profesional →
            </Link>
          </Reveal>
          <Reveal delay={120} className="bg-surface border border-border rounded-2xl p-8 lg:p-10 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <Eyebrow>Para clientes</Eyebrow>
            <h3 className="font-display text-ink text-2xl mb-4">Encontrá y reservá sin vueltas</h3>
            <ul className="space-y-3 mb-8">
              {[
                "Descubrí profesionales cerca de ti",
                "Reservá en segundos, presencial o virtual",
                "Pagá online y seguí tus reservas",
                "Calificá cada sesión que tuviste",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-muted">
                  <ion-icon name="checkmark-outline" style={{ fontSize: "18px", color: "var(--color-accent-hover)", flexShrink: 0, marginTop: "1px" }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className="font-semibold text-ink underline">
              Crear cuenta como cliente →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <Reveal className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-ink-fixed rounded-2xl p-10 lg:p-16 relative overflow-hidden">
          <div
            className="absolute -bottom-10 -right-10 w-56 h-56 bg-accent opacity-90 rotate-12"
            style={{ borderRadius: "2px" }}
          />
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-white text-4xl leading-tight mb-4">
              Empezá hoy. Es gratis.
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Sumate a CitaPro y centralizá tu agenda, tus pagos y tus clientes en una sola plataforma.
            </p>
            <Link
              to="/register"
              className="inline-block bg-accent hover:bg-accent-hover text-ink-fixed font-semibold px-6 py-3 rounded-full transition-all hover:scale-105"
            >
              Crear cuenta gratis →
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <Logo />
            <p className="text-sm text-ink-muted mt-3 max-w-xs">
              Agenda, pagos y videollamadas para profesionales independientes.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink-muted tracking-widest uppercase mb-3">Producto</p>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li><a href="#caracteristicas" className="hover:text-ink">Características</a></li>
              <li><a href="#como-funciona" className="hover:text-ink">Cómo funciona</a></li>
              <li><a href="#para-quien" className="hover:text-ink">Para quién es</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-ink-muted tracking-widest uppercase mb-3">Cuenta</p>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li><Link to="/login" className="hover:text-ink">Iniciar sesión</Link></li>
              <li><Link to="/register" className="hover:text-ink">Crear cuenta</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6 border-t border-border text-xs text-ink-muted">
          © {new Date().getFullYear()} Cita.Pro. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
