// Ícones SVG próprios (stroke = currentColor). Animações em loop ficam no globals.css (.ico-*).

type P = { className?: string };

const base = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function IconeSmash({ className }: P) {
  return (
    <svg {...base} className={`ico ${className ?? ""}`}>
      <g className="ico-prensa">
        <rect x="14" y="8" width="36" height="7" rx="3" />
        <path d="M32 15v7" />
      </g>
      <path d="M10 44c0-5 4-8 9-8h26c5 0 9 3 9 8v2H10z" fill="currentColor" fillOpacity=".25" />
      <path d="M12 52h40" />
      <g className="ico-chama">
        <path d="M22 58c-2-2-1-4 1-6 0 2 2 2 2 4 1-2 3-3 3-6 3 3 5 6 3 8" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function IconeCheddar({ className }: P) {
  return (
    <svg {...base} className={`ico ${className ?? ""}`}>
      <path d="M6 36L42 12l16 20z" fill="currentColor" fillOpacity=".35" />
      <path d="M6 36h52v14H6z" fill="currentColor" fillOpacity=".2" />
      <circle cx="20" cy="43" r="3" />
      <circle cx="38" cy="42" r="2.2" />
      <circle cx="50" cy="44" r="1.8" />
      <g className="ico-queijo-gota">
        <path d="M12 50v7c0 3 6 3 6 0v-7" fill="currentColor" fillOpacity=".5" />
      </g>
      <g className="ico-queijo-gota" style={{ animationDelay: "0.9s" }}>
        <path d="M42 50v5c0 3 5 3 5 0v-5" fill="currentColor" fillOpacity=".5" />
      </g>
    </svg>
  );
}

export function IconeMaionese({ className }: P) {
  return (
    <svg {...base} className={`ico ${className ?? ""}`}>
      <path d="M24 6h16l-3 10H27z" fill="currentColor" fillOpacity=".25" />
      <path d="M22 16h20c4 0 6 3 6 6v28c0 4-3 7-7 7H23c-4 0-7-3-7-7V22c0-3 2-6 6-6z" />
      <path d="M22 30h20M22 38h20" strokeWidth="2" opacity=".55" />
      <path className="ico-gota" d="M32 52c-3-4-4-6-4-8a4 4 0 018 0c0 2-1 4-4 8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeBatata({ className }: P) {
  return (
    <svg {...base} className={`ico ${className ?? ""}`}>
      <path className="ico-batata-1" d="M16 30l3-16 5 2-1 14" />
      <path className="ico-batata-2" d="M26 28l2-20 5 1-1 19" />
      <path className="ico-batata-3" d="M36 28l3-16 5 2-3 14" />
      <path d="M12 28h40l-5 28H17z" fill="currentColor" fillOpacity=".25" />
      <path d="M22 38h20M24 46h16" strokeWidth="2" opacity=".6" />
    </svg>
  );
}

export function IconeBurger({ className }: P) {
  return (
    <svg {...base} className={`ico ${className ?? ""}`}>
      <g className="ico-pao-topo">
        <path d="M10 28c0-11 10-18 22-18s22 7 22 18z" fill="currentColor" fillOpacity=".25" />
        <path d="M24 17h.01M34 14h.01M42 19h.01" strokeWidth="3.4" />
      </g>
      <path d="M8 36c4 2 6-2 10 0s6-2 10 0 6-2 10 0 6-2 10 0 4-1 6 0" />
      <path d="M10 42h44" strokeWidth="4" opacity=".7" />
      <path d="M12 48h40c0 6-4 9-10 9H22c-6 0-10-3-10-9z" fill="currentColor" fillOpacity=".25" />
    </svg>
  );
}

export function IconeRefri({ className }: P) {
  return (
    <svg {...base} className={`ico ${className ?? ""}`}>
      <path d="M27 5h10v6l4 6v38c0 3-2 5-5 5h-8c-3 0-5-2-5-5V17l4-6z" />
      <path d="M23 30h18v12H23z" fill="currentColor" fillOpacity=".3" />
      <circle className="ico-bolha" cx="30" cy="50" r="1.6" fill="currentColor" />
      <circle className="ico-bolha b2" cx="35" cy="52" r="1.3" fill="currentColor" />
      <circle className="ico-bolha b3" cx="32" cy="48" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function IconeSacola({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8z" fill="currentColor" fillOpacity=".15" />
      <path d="M9 8V6.5a3 3 0 016 0V8" />
    </svg>
  );
}

export function IconeInstagram({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconePino({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.6" />
    </svg>
  );
}

export function IconeRelogio({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  );
}

export const ICONES = {
  smash: IconeSmash,
  cheddar: IconeCheddar,
  maionese: IconeMaionese,
  batata: IconeBatata,
  burger: IconeBurger,
  refri: IconeRefri,
} as const;

export type NomeIcone = keyof typeof ICONES;
