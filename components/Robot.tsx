"use client";

/**
 * The girls' robots for Space Bots. Every part is an original drawing in one 200 x 300 SVG,
 * so parts can be mixed freely: head (top), body (middle), legs (bottom), and a tool in the right hand.
 */

export type RobotConfig = { head: string; body: string; legs: string; tool: string; color: string };

export const PARTS = {
  head: [
    { id: "dome", label: "Dome head" },
    { id: "boxy", label: "Box head" },
    { id: "antenna", label: "Antenna head" },
    { id: "star", label: "Star head" },
    { id: "cat", label: "Kitty head" },
    { id: "bubble", label: "Bubble helmet" },
  ],
  body: [
    { id: "box", label: "Button body" },
    { id: "barrel", label: "Round body" },
    { id: "heart", label: "Heart body" },
    { id: "rocket", label: "Rocket body" },
  ],
  legs: [
    { id: "wheels", label: "Wheels" },
    { id: "treads", label: "Tank treads" },
    { id: "boots", label: "Rocket boots" },
    { id: "springs", label: "Springs" },
  ],
  tool: [
    { id: "shovel", label: "Shovel" },
    { id: "magnet", label: "Magnet" },
    { id: "hammer", label: "Hammer" },
  ],
  color: [
    { id: "#9b6bff", label: "purple" },
    { id: "#ff5d8f", label: "pink" },
    { id: "#3a8dff", label: "blue" },
    { id: "#3ccf91", label: "green" },
    { id: "#ffc93c", label: "gold" },
    { id: "#ff8a3d", label: "orange" },
    { id: "rainbow", label: "rainbow" },
  ],
} as const;

export type PartKind = keyof typeof PARTS;

/** What each girl starts with; the rest are earned on missions (in this order). */
export const STARTER = ["dome", "boxy", "box", "barrel", "wheels", "treads", "shovel", "magnet", "hammer", "#9b6bff", "#ff5d8f", "#3a8dff", "#3ccf91"];
export const UNLOCK_ORDER = ["star", "boots", "heart", "#ffc93c", "cat", "springs", "rocket", "antenna", "#ff8a3d", "bubble", "rainbow"];

export const DEFAULT_ROBOT: RobotConfig = { head: "dome", body: "box", legs: "wheels", tool: "shovel", color: "#9b6bff" };

export const partLabel = (id: string) => {
  for (const kind of Object.keys(PARTS) as PartKind[]) {
    const p = (PARTS[kind] as readonly { id: string; label: string }[]).find((x) => x.id === id);
    if (p) return p.label;
  }
  return id;
};
export const partKind = (id: string): PartKind =>
  (Object.keys(PARTS) as PartKind[]).find((k) => (PARTS[k] as readonly { id: string }[]).some((p) => p.id === id)) ?? "head";

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

const INK = "#2b2350";
const METAL = "#c9cfe0";
const METAL_D = "#8f97b3";

function Eyes({ y = 52, gap = 22, r = 9 }: { y?: number; gap?: number; r?: number }) {
  return (
    <g className="bot-eyes">
      <circle cx={100 - gap} cy={y} r={r + 4} fill="#fff" />
      <circle cx={100 + gap} cy={y} r={r + 4} fill="#fff" />
      <circle cx={100 - gap + 1} cy={y + 1} r={r} fill={INK} />
      <circle cx={100 + gap + 1} cy={y + 1} r={r} fill={INK} />
      <circle cx={100 - gap + 4} cy={y - 3} r={3} fill="#fff" />
      <circle cx={100 + gap + 4} cy={y - 3} r={3} fill="#fff" />
    </g>
  );
}

const Smile = ({ y = 74 }: { y?: number }) => <path d={`M86 ${y} q14 12 28 0`} stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;

function Head({ id, c, d }: { id: string; c: string; d: string }) {
  switch (id) {
    case "boxy":
      return (
        <g>
          <rect x="52" y="20" width="96" height="80" rx="14" fill={c} stroke={d} strokeWidth="5" />
          <rect x="38" y="44" width="14" height="30" rx="5" fill={METAL_D} />
          <rect x="148" y="44" width="14" height="30" rx="5" fill={METAL_D} />
          <rect x="66" y="38" width="26" height="22" rx="5" fill="#fff" />
          <rect x="108" y="38" width="26" height="22" rx="5" fill="#fff" />
          <rect x="74" y="44" width="12" height="12" rx="3" fill={INK} className="bot-blink" />
          <rect x="116" y="44" width="12" height="12" rx="3" fill={INK} className="bot-blink" />
          <rect x="74" y="72" width="52" height="14" rx="4" fill={METAL} />
          <path d="M84 72 v14 M94 72 v14 M104 72 v14 M114 72 v14" stroke={METAL_D} strokeWidth="3" />
        </g>
      );
    case "antenna":
      return (
        <g>
          <path d="M100 30 V4" stroke={METAL_D} strokeWidth="5" />
          <circle cx="100" cy="6" r="9" fill="#ffc93c" className="bot-glow" />
          <rect x="56" y="28" width="88" height="74" rx="30" fill={c} stroke={d} strokeWidth="5" />
          <Eyes y={58} gap={20} r={8} />
          <Smile y={80} />
        </g>
      );
    case "star":
      return (
        <g>
          <path d="M100 6 L118 42 L158 46 L128 72 L136 110 L100 92 L64 110 L72 72 L42 46 L82 42 Z" fill={c} stroke={d} strokeWidth="5" strokeLinejoin="round" />
          <Eyes y={60} gap={16} r={7} />
          <Smile y={78} />
        </g>
      );
    case "cat":
      return (
        <g>
          <path d="M58 46 L52 8 L86 30 Z M142 46 L148 8 L114 30 Z" fill={c} stroke={d} strokeWidth="5" strokeLinejoin="round" />
          <path d="M60 36 L58 18 L76 30 Z M140 36 L142 18 L124 30 Z" fill="#ffb3cf" />
          <rect x="52" y="24" width="96" height="78" rx="36" fill={c} stroke={d} strokeWidth="5" />
          <Eyes y={56} gap={20} r={8} />
          <path d="M96 70 l4 4 l4 -4 Z" fill="#ff6f9e" />
          <path d="M90 80 q5 6 10 0 q5 6 10 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M60 70 h-18 M60 78 h-16 M140 70 h18 M140 78 h16" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "bubble":
      return (
        <g>
          <circle cx="100" cy="58" r="52" fill="#d9f4ff" opacity=".7" stroke="#9bdcff" strokeWidth="5" />
          <circle cx="100" cy="64" r="34" fill={c} stroke={d} strokeWidth="4" />
          <Eyes y={60} gap={14} r={6} />
          <Smile y={74} />
          <path d="M66 30 q14 -14 34 -16" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".9" />
        </g>
      );
    default: // dome
      return (
        <g>
          <path d="M50 100 V62 a50 50 0 0 1 100 0 V100 Z" fill={c} stroke={d} strokeWidth="5" strokeLinejoin="round" />
          <rect x="62" y="34" width="76" height="46" rx="20" fill="#2d2470" />
          <circle cx="82" cy="57" r="9" fill="#7ff0ff" className="bot-blink" />
          <circle cx="118" cy="57" r="9" fill="#7ff0ff" className="bot-blink" />
          <path d="M88 88 q12 8 24 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="14" r="7" fill="#ff5d8f" className="bot-glow" />
        </g>
      );
  }
}

function Body({ id, c, d }: { id: string; c: string; d: string }) {
  switch (id) {
    case "barrel":
      return (
        <g>
          <rect x="50" y="108" width="100" height="104" rx="46" fill={c} stroke={d} strokeWidth="5" />
          <circle cx="100" cy="160" r="22" fill="#fff" stroke={d} strokeWidth="4" />
          <circle cx="100" cy="160" r="10" fill="#ffc93c" className="bot-glow" />
        </g>
      );
    case "heart":
      return (
        <g>
          <rect x="54" y="108" width="92" height="104" rx="18" fill={c} stroke={d} strokeWidth="5" />
          <path d="M100 186 C76 170 72 156 80 146 C88 136 98 140 100 150 C102 140 112 136 120 146 C128 156 124 170 100 186 Z" fill="#ff5d8f" stroke="#fff" strokeWidth="4" className="bot-beat" />
        </g>
      );
    case "rocket":
      return (
        <g>
          <path d="M100 106 C130 120 146 150 146 212 H54 C54 150 70 120 100 106 Z" fill={c} stroke={d} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="100" cy="158" r="18" fill="#bfe9ff" stroke="#fff" strokeWidth="5" />
          <path d="M54 212 L40 222 L54 190 Z M146 212 L160 222 L146 190 Z" fill="#ff5d8f" />
        </g>
      );
    default: // box with buttons
      return (
        <g>
          <rect x="54" y="108" width="92" height="104" rx="14" fill={c} stroke={d} strokeWidth="5" />
          <rect x="68" y="122" width="64" height="40" rx="8" fill="#2d2470" />
          <path d="M74 146 l10 -10 l10 14 l10 -18 l10 10 l12 -2" stroke="#7ff0ff" strokeWidth="4" fill="none" className="bot-screen" />
          <circle cx="78" cy="186" r="9" fill="#ff5d8f" />
          <circle cx="100" cy="186" r="9" fill="#ffc93c" />
          <circle cx="122" cy="186" r="9" fill="#3ccf91" />
        </g>
      );
  }
}

function Legs({ id, d }: { id: string; d: string }) {
  switch (id) {
    case "treads":
      return (
        <g>
          <rect x="78" y="206" width="44" height="32" rx="8" fill={METAL_D} />
          <rect x="40" y="232" width="120" height="54" rx="27" fill="#4a4470" stroke={INK} strokeWidth="5" />
          {[66, 100, 134].map((x) => (
            <circle key={x} cx={x} cy="259" r="14" fill={METAL} stroke={METAL_D} strokeWidth="4" className="bot-wheel" />
          ))}
        </g>
      );
    case "boots":
      return (
        <g>
          <rect x="74" y="206" width="16" height="30" rx="6" fill={METAL_D} />
          <rect x="110" y="206" width="16" height="30" rx="6" fill={METAL_D} />
          <path d="M70 232 h22 v28 l8 10 h-38 Z M108 232 h22 v38 h-38 l8 -10 Z" fill={METAL} stroke={METAL_D} strokeWidth="4" strokeLinejoin="round" />
          <path d="M70 272 q11 26 22 0 Z M108 272 q11 26 22 0 Z" fill="#ff8a3d" className="bot-flame" />
          <path d="M75 272 q6 14 12 0 Z M113 272 q6 14 12 0 Z" fill="#ffd43b" className="bot-flame" />
        </g>
      );
    case "springs":
      return (
        <g className="bot-bounce">
          <path d="M80 214 l-12 8 l24 8 l-24 8 l24 8 l-24 8 l24 8 l-12 8" stroke={METAL_D} strokeWidth="6" fill="none" strokeLinejoin="round" />
          <path d="M120 214 l-12 8 l24 8 l-24 8 l24 8 l-24 8 l24 8 l-12 8" stroke={METAL_D} strokeWidth="6" fill="none" strokeLinejoin="round" />
          <ellipse cx="80" cy="280" rx="22" ry="9" fill={d} />
          <ellipse cx="120" cy="280" rx="22" ry="9" fill={d} />
        </g>
      );
    default: // wheels
      return (
        <g>
          <rect x="60" y="214" width="80" height="30" rx="10" fill={METAL_D} />
          {[66, 134].map((x) => (
            <g key={x} className="bot-wheel" style={{ transformOrigin: `${x}px 262px` }}>
              <circle cx={x} cy="262" r="26" fill={INK} />
              <circle cx={x} cy="262" r="12" fill={METAL} />
              <path d={`M${x} 240 v44 M${x - 22} 262 h44`} stroke={METAL_D} strokeWidth="4" />
            </g>
          ))}
        </g>
      );
  }
}

/** The tool, drawn so its working end sits at about (186, 196) for missions to aim at. */
function Tool({ id }: { id: string }) {
  switch (id) {
    case "magnet":
      return (
        <g>
          <path d="M166 150 v30 a20 20 0 0 0 40 0 v-30 h-12 v30 a8 8 0 0 1 -16 0 v-30 Z" fill="#ff4d5e" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="166" y="144" width="12" height="12" fill={METAL} stroke={INK} strokeWidth="3" />
          <rect x="194" y="144" width="12" height="12" fill={METAL} stroke={INK} strokeWidth="3" />
          <path d="M162 138 l-6 -8 M186 132 v-10 M210 138 l6 -8" stroke="#ffc93c" strokeWidth="3" strokeLinecap="round" className="bot-glow" />
        </g>
      );
    case "hammer":
      return (
        <g>
          <rect x="178" y="128" width="10" height="80" rx="4" fill="#b07a4f" stroke={INK} strokeWidth="3" />
          <rect x="160" y="116" width="46" height="24" rx="5" fill={METAL} stroke={INK} strokeWidth="3" />
        </g>
      );
    default: // shovel
      return (
        <g>
          <rect x="180" y="110" width="9" height="78" rx="4" fill="#b07a4f" stroke={INK} strokeWidth="3" />
          <path d="M170 186 h30 v18 q-15 18 -30 0 Z" fill={METAL} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="174" y="104" width="22" height="10" rx="4" fill={INK} />
        </g>
      );
  }
}

export default function Robot({ config, className = "", acting = false }: { config: RobotConfig; className?: string; acting?: boolean }) {
  const rainbow = config.color === "rainbow";
  const c = rainbow ? "url(#bot-rainbow)" : config.color;
  const d = rainbow ? "#7b4fe0" : shade(config.color, -55);
  return (
    <svg className={`robot ${className}`} viewBox="0 0 220 300" role="img" aria-label="Your robot">
      <defs>
        <linearGradient id="bot-rainbow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ff5d8f" />
          <stop offset=".25" stopColor="#ffc93c" />
          <stop offset=".5" stopColor="#3ccf91" />
          <stop offset=".75" stopColor="#3a8dff" />
          <stop offset="1" stopColor="#9b6bff" />
        </linearGradient>
      </defs>
      <Legs id={config.legs} d={d} />
      {/* left arm */}
      <path d="M56 136 q-26 14 -22 44" stroke={METAL_D} strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="184" r="9" fill={METAL} stroke={METAL_D} strokeWidth="3" />
      <rect x="88" y="98" width="24" height="14" rx="4" fill={METAL_D} />
      <Body id={config.body} c={c} d={d} />
      {/* right arm with tool */}
      <g className={`bot-arm${acting ? " acting" : ""}`}>
        <path d="M144 136 q26 2 34 26" stroke={METAL_D} strokeWidth="9" fill="none" strokeLinecap="round" />
        <Tool id={config.tool} />
      </g>
      <Head id={config.head} c={c} d={d} />
    </svg>
  );
}
