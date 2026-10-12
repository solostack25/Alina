"use client";

import { HEROES } from "@/lib/heroes";
import type { Player } from "./types";

/**
 * A go-kart with the girl's own face in the driver's seat, wearing a racing helmet.
 * Original drawing (side view, facing right). Alina's is purple and gold with a star;
 * Liyana's is pink with a heart.
 */
const LOOK: Record<Player, { body: string; dark: string; accent: string; helmet: string; suit: string; badge: "star" | "heart" }> = {
  big: { body: "#8a5cf6", dark: "#5b3fd1", accent: "#ffc93c", helmet: "#ffc93c", suit: "#c9b6ff", badge: "star" },
  little: { body: "#ff5d8f", dark: "#d63c6f", accent: "#ffffff", helmet: "#ff8fc7", suit: "#ffd1e3", badge: "heart" },
};

const STAR = "M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.5 8.1 L0 4 L-6.5 8.1 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1 Z";
const HEART = "M0 8 C-9 2 -10 -4 -6 -7 C-3 -9 -1 -7 0 -5 C1 -7 3 -9 6 -7 C10 -4 9 2 0 8 Z";

export default function Kart({ player, className = "" }: { player: Player; className?: string }) {
  const c = LOOK[player];
  const face = HEROES[player].face;
  const badge = c.badge === "star" ? STAR : HEART;
  const clip = `kart-face-${player}`;
  return (
    <svg className={`kart ${className}`} viewBox="0 0 250 160" role="img" aria-label="Go-kart">
      <defs>
        <clipPath id={clip}>
          <circle cx="104" cy="46" r="24" />
        </clipPath>
      </defs>

      {/* exhaust puffs and boost flame */}
      <g className="kart-puffs" aria-hidden>
        <circle cx="10" cy="108" r="7" fill="#fff" opacity=".8" />
        <circle cx="0" cy="102" r="5" fill="#fff" opacity=".6" />
      </g>
      <path className="kart-flame" d="M22 104 q-26 6 -30 2 q14 -2 0 -8 q18 0 30 2 Z" fill="#ff8a3d" />

      {/* spoiler */}
      <path d="M30 64 h30 v8 h-8 l-4 28 h-6 l-4 -28 h-8 Z" fill={c.dark} />
      <rect x="26" y="58" width="40" height="9" rx="4" fill={c.accent} stroke={c.dark} strokeWidth="2" />

      {/* driver: body, arm on the wheel */}
      <rect x="84" y="62" width="40" height="38" rx="14" fill={c.suit} stroke={c.dark} strokeWidth="2" />
      <path d="M116 76 q18 2 28 -2" stroke={c.suit} strokeWidth="11" fill="none" strokeLinecap="round" />
      <circle cx="146" cy="73" r="6" fill="#d99a6c" />

      {/* steering wheel */}
      <g transform="rotate(-25 152 72)">
        <ellipse cx="152" cy="72" rx="5" ry="13" fill="none" stroke="#2b2350" strokeWidth="4" />
      </g>
      <path d="M152 78 l10 20" stroke="#2b2350" strokeWidth="4" strokeLinecap="round" />

      {/* kart body */}
      <path d="M18 116 Q16 90 50 88 L78 88 Q84 100 110 100 L150 96 Q196 92 230 110 Q240 116 234 126 L22 126 Q18 124 18 116 Z" fill={c.body} stroke={c.dark} strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 108 H122 M158 108 H212" stroke={c.accent} strokeWidth="6" strokeLinecap="round" />
      <path d="M150 96 Q190 94 222 108" stroke="#fff" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round" />
      {/* number badge */}
      <circle cx="140" cy="113" r="13" fill="#fff" stroke={c.dark} strokeWidth="2" />
      <path d={badge} transform="translate(140 113)" fill={c.badge === "star" ? "#ffc93c" : "#ff5d8f"} />

      {/* wheels */}
      {[
        { x: 58, r: 25 },
        { x: 200, r: 22 },
      ].map((w) => (
        <g key={w.x}>
          <circle cx={w.x} cy="128" r={w.r} fill="#2b2350" />
          <g className="kart-wheel" style={{ transformOrigin: `${w.x}px 128px` }}>
            <circle cx={w.x} cy="128" r={w.r * 0.48} fill="#c9cfe0" />
            <path d={`M${w.x - w.r * 0.45} 128 H${w.x + w.r * 0.45} M${w.x} ${128 - w.r * 0.45} V${128 + w.r * 0.45}`} stroke="#8f97b3" strokeWidth="3" />
          </g>
        </g>
      ))}

      {/* her face in an open-face racing helmet */}
      <circle cx="104" cy="42" r="33" fill={c.helmet} stroke={c.dark} strokeWidth="3" />
      <path d="M74 30 Q104 4 134 30" stroke="#fff" strokeWidth="5" fill="none" opacity=".55" strokeLinecap="round" />
      <path d="M104 9 V22" stroke={c.dark} strokeWidth="5" strokeLinecap="round" opacity=".35" />
      <circle cx="104" cy="46" r="24" fill="#f6d3b8" />
      <image href={face} x="78" y="20" width="52" height="52" clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" />
      <circle cx="104" cy="46" r="24" fill="none" stroke={c.dark} strokeWidth="2.5" />
      <g transform="translate(130 26) scale(.85)">
        <circle r="11" fill="#fff" stroke={c.dark} strokeWidth="2" />
        <path d={badge} fill={c.badge === "star" ? "#ffc93c" : "#ff5d8f"} />
      </g>
    </svg>
  );
}
