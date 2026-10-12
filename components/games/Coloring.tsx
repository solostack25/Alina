"use client";

import { useEffect, useState, type ReactNode } from "react";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { store } from "@/lib/util";
import type { GameProps } from "../types";
import PictureCanvas, { type PicturePage } from "./PictureCanvas";

/** A coloring page: tappable regions (filled by her) plus fixed line details drawn on top. */
type Region = { id: string; d?: string; shape?: ReactNode };
type ColorPage = { id: string; label: string; icon: string; regions: Region[]; lines?: ReactNode };

const P = (d: string) => <path d={d} />;

const PAGES: ColorPage[] = [
  {
    id: "cake", label: "Birthday Cake", icon: "🎂",
    regions: [
      { id: "bg", shape: <rect x="2" y="2" width="296" height="296" rx="18" /> },
      { id: "plate", shape: <ellipse cx="150" cy="252" rx="120" ry="20" /> },
      { id: "bottom", shape: <rect x="55" y="170" width="190" height="80" rx="10" /> },
      { id: "top", shape: <rect x="80" y="112" width="140" height="62" rx="10" /> },
      { id: "icing", shape: P("M80 122 q0-14 14-14 h112 q14 0 14 14 q-10 14 -20 0 q-10 14 -20 0 q-10 14 -20 0 q-10 14 -20 0 q-10 14 -20 0 q-10 14 -20 0 q-10 14 -20 0 z") },
      { id: "c1", shape: <rect x="104" y="72" width="14" height="38" rx="4" /> },
      { id: "c2", shape: <rect x="143" y="66" width="14" height="44" rx="4" /> },
      { id: "c3", shape: <rect x="182" y="72" width="14" height="38" rx="4" /> },
      { id: "f1", shape: P("M111 66 q-10-12 0-26 q10 14 0 26 z") },
      { id: "f2", shape: P("M150 60 q-10-12 0-26 q10 14 0 26 z") },
      { id: "f3", shape: P("M189 66 q-10-12 0-26 q10 14 0 26 z") },
      { id: "dot1", shape: <circle cx="95" cy="210" r="11" /> },
      { id: "dot2", shape: <circle cx="150" cy="215" r="11" /> },
      { id: "dot3", shape: <circle cx="205" cy="210" r="11" /> },
    ],
  },
  {
    id: "fish", label: "Fish", icon: "🐠",
    regions: [
      { id: "water", shape: <rect x="2" y="2" width="296" height="296" rx="18" /> },
      { id: "sand", shape: P("M2 250 q75-20 150 0 t146 0 v30 q0 18 -18 18 h-260 q-18 0 -18 -18 z") },
      { id: "weed1", shape: P("M40 255 q-16-40 4-70 q16-30 -2-60 q22 26 8 60 q-12 34 6 70 z") },
      { id: "weed2", shape: P("M262 255 q16-34 -4-60 q-14-24 4-50 q-22 22 -8 50 q12 30 -6 60 z") },
      { id: "tail", shape: P("M212 140 l60 -42 q-8 42 0 84 z") },
      { id: "body", shape: <ellipse cx="140" cy="140" rx="82" ry="56" /> },
      { id: "fin", shape: P("M110 90 q30-46 70-10 q-34 -4 -70 10 z") },
      { id: "stripe", shape: P("M150 88 q20 52 0 104 q-22 -4 -20 -4 q18-48 0-96 z") },
      { id: "eye", shape: <circle cx="95" cy="128" r="15" /> },
      { id: "b1", shape: <circle cx="58" cy="78" r="12" /> },
      { id: "b2", shape: <circle cx="40" cy="44" r="8" /> },
      { id: "b3", shape: <circle cx="66" cy="22" r="6" /> },
    ],
    lines: (
      <>
        <circle cx="92" cy="125" r="5" fill="#2b2350" stroke="none" />
        <path d="M66 156 q12 10 24 0" fill="none" />
      </>
    ),
  },
  {
    id: "house", label: "House", icon: "🏡",
    regions: [
      { id: "sky", shape: <rect x="2" y="2" width="296" height="296" rx="18" /> },
      { id: "grass", shape: P("M2 230 h296 v50 q0 18 -18 18 h-260 q-18 0 -18 -18 z") },
      { id: "sun", shape: <circle cx="250" cy="52" r="28" /> },
      { id: "wall", shape: <rect x="70" y="128" width="140" height="104" /> },
      { id: "roof", shape: P("M54 132 l86 -76 l86 76 z") },
      { id: "door", shape: <rect x="122" y="172" width="38" height="60" rx="6" /> },
      { id: "w1", shape: <rect x="84" y="148" width="28" height="28" rx="3" /> },
      { id: "w2", shape: <rect x="170" y="148" width="28" height="28" rx="3" /> },
      { id: "trunk", shape: <rect x="244" y="170" width="18" height="62" /> },
      { id: "leaves", shape: <circle cx="253" cy="152" r="32" /> },
      { id: "cloud", shape: P("M40 70 q0-20 22-20 q8-16 28-10 q18-4 22 14 q16 2 14 16 z") },
    ],
    lines: (
      <>
        <circle cx="152" cy="204" r="3" fill="#2b2350" stroke="none" />
        <path d="M98 148 v28 M84 162 h28 M184 148 v28 M170 162 h28" fill="none" />
      </>
    ),
  },
  {
    id: "butterfly", label: "Butterfly", icon: "🦋",
    regions: [
      { id: "bg", shape: <rect x="2" y="2" width="296" height="296" rx="18" /> },
      { id: "ul", shape: P("M146 140 q-40-110 -116-74 q-26 60 116 74 z") },
      { id: "ur", shape: P("M154 140 q40-110 116-74 q26 60 -116 74 z") },
      { id: "ll", shape: P("M146 150 q-110 6 -86 76 q50 30 86 -76 z") },
      { id: "lr", shape: P("M154 150 q110 6 86 76 q-50 30 -86 -76 z") },
      { id: "s1", shape: <circle cx="88" cy="100" r="16" /> },
      { id: "s2", shape: <circle cx="212" cy="100" r="16" /> },
      { id: "s3", shape: <circle cx="96" cy="196" r="12" /> },
      { id: "s4", shape: <circle cx="204" cy="196" r="12" /> },
      { id: "body", shape: <rect x="140" y="92" width="20" height="132" rx="10" /> },
      { id: "head", shape: <circle cx="150" cy="80" r="16" /> },
    ],
    lines: <path d="M144 66 q-12-26 -26-30 M156 66 q12-26 26-30" fill="none" />,
  },
];

// Superhero pages from the family's coloring sheet (public/coloring). Tap any space to fill it.
const PICTURES: PicturePage[] = [
  { id: "super-sisters", label: "Super Sisters", w: 918, h: 1458 },
  { id: "alina-brave", label: "Alina the Brave", w: 804, h: 1458 },
  { id: "liyana-kind", label: "Liyana the Kind Heart", w: 804, h: 1458 },
  { id: "birthday", label: "Happy Birthday Alina", w: 816, h: 1425 },
  { id: "alina-four", label: "Alina is 4", w: 894, h: 1425 },
  { id: "dream-big", label: "Dream Big", w: 816, h: 1458 },
  { id: "together", label: "Together", w: 894, h: 1458 },
  { id: "star-power", label: "Star Power", w: 918, h: 1425 },
  { id: "keep-shining", label: "Keep Shining", w: 807, h: 1425 },
  { id: "you-are-special", label: "You Are Special", w: 804, h: 1425 },
];

const PALETTE = ["#ff4d5e", "#ff8a3d", "#ffd43b", "#3ccf91", "#3a8dff", "#9b6bff", "#ff8fc7", "#d99a6c", "#f6d3b8", "#8b5a2b", "#2b2350", "#ffffff"];
const COLOR_NAMES = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "tan", "peach", "brown", "black", "white"];

export default function Coloring({ ask, win, player }: GameProps) {
  const [pageId, setPageId] = useState<string | null>(null);
  const [color, setColor] = useState(0);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [doneOnce, setDoneOnce] = useState(false);

  useEffect(() => {
    ask("Coloring", "Pick a picture to color!");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const key = (id: string) => `color:${player}:${id}`;

  const openPicture = (p: PicturePage) => {
    sfx.flip();
    setPageId(p.id);
    setFills(store.get(key(p.id), {}));
    setDoneOnce(false);
    ask(p.label, `Let's color ${p.label}! Pick a color, then tap the picture.`);
  };

  const open = (p: ColorPage) => {
    sfx.flip();
    setPageId(p.id);
    setFills(store.get(key(p.id), {}));
    setDoneOnce(false);
    ask(p.label, `Let's color the ${p.label.toLowerCase()}! Pick a color, then tap the picture.`);
  };

  const picture = PICTURES.find((p) => p.id === pageId);
  const page = PAGES.find((p) => p.id === pageId) ?? picture;

  if (!page) {
    return (
      <div className="stage">
        <div className="color-pick">
          {PICTURES.map((p) => (
            <button key={p.id} className="color-thumb hero-thumb" onClick={() => openPicture(p)} aria-label={p.label}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/coloring/${p.id}-lines.png`} alt="" draggable={false} loading="lazy" style={{ aspectRatio: `${p.w} / ${p.h}` }} />
              <span>{p.label}</span>
            </button>
          ))}
          {PAGES.map((p) => {
            const saved = store.get<Record<string, string>>(key(p.id), {});
            return (
              <button key={p.id} className="color-thumb" onClick={() => open(p)} aria-label={p.label}>
                <svg viewBox="0 0 300 300" stroke="#2b2350" strokeWidth="5" strokeLinejoin="round">
                  {p.regions.map((r) => (
                    <g key={r.id} fill={saved[r.id] ?? "#fff"}>{r.shape}</g>
                  ))}
                  {p.lines}
                </svg>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const paint = (id: string | number) => {
    const next = { ...fills, [id]: PALETTE[color] };
    setFills(next);
    store.set(key(page.id), next);
    sfx.pop();
  };

  return (
    <div className="stage coloring">
      <div className="canvas-wrap">
        {picture ? (
          <PictureCanvas page={picture} fills={fills} onFill={paint} />
        ) : (
        <svg className="color-svg" viewBox="0 0 300 300" stroke="#2b2350" strokeWidth="5" strokeLinejoin="round">
          {"regions" in page && page.regions.map((r) => (
            <g key={r.id} className="region" fill={fills[r.id] ?? "#fff"} onPointerDown={() => paint(r.id)}>
              {r.shape}
            </g>
          ))}
          <g pointerEvents="none">{"lines" in page && page.lines}</g>
        </svg>
        )}
      </div>
      <div className="palette-col">
        <div className="palette">
          {PALETTE.map((c, i) => (
            <button
              key={c}
              className={`swatch${i === color ? " on" : ""}`}
              style={{ background: c }}
              aria-label={COLOR_NAMES[i]}
              onClick={() => {
                setColor(i);
                say(COLOR_NAMES[i], { rate: 1 });
              }}
            />
          ))}
        </div>
        <div className="row-center">
          <button
            className="pill-btn"
            onClick={() => {
              setFills({});
              store.set(key(page.id), {});
              sfx.boop();
            }}
          >
            🧽 Clear
          </button>
          <button
            className="pill-btn go"
            onClick={() => {
              if (!doneOnce) {
                setDoneOnce(true);
                win("What a beautiful picture");
              } else say("Beautiful!");
              afterSpeech(() => {
                setPageId(null);
                ask("Coloring", "Pick another picture!");
              }, 1200);
            }}
          >
            ✅ Done
          </button>
        </div>
      </div>
    </div>
  );
}
