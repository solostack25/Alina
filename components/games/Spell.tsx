"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { soundOf } from "@/lib/letters";
import { pick, shuffle, wobble } from "@/lib/util";
import type { GameProps } from "../types";

// Level 1: three-letter words. Level 2: four letters. Level 3: five letters.
const WORDS: [string, string][][] = [
  [["cat", "🐱"], ["dog", "🐶"], ["pig", "🐷"], ["sun", "☀️"], ["bus", "🚌"], ["hat", "🎩"], ["bed", "🛏️"], ["fox", "🦊"],
   ["ant", "🐜"], ["web", "🕸️"], ["map", "🗺️"], ["van", "🚐"], ["box", "📦"], ["hen", "🐔"], ["bat", "🦇"], ["cup", "🥤"]],
  [["fish", "🐟"], ["frog", "🐸"], ["duck", "🦆"], ["star", "⭐"], ["crab", "🦀"], ["milk", "🥛"], ["drum", "🥁"],
   ["ship", "🚢"], ["moon", "🌙"], ["bird", "🐦"], ["lion", "🦁"], ["bear", "🐻"], ["ball", "⚽"], ["sock", "🧦"]],
  [["apple", "🍎"], ["horse", "🐴"], ["house", "🏠"], ["snake", "🐍"], ["train", "🚂"], ["zebra", "🦓"], ["tiger", "🐯"],
   ["pizza", "🍕"], ["robot", "🤖"], ["candy", "🍬"], ["plant", "🪴"], ["cloud", "☁️"]],
];
const ALPHA = "abcdefghijklmnoprstuvwz";

type Tile = { id: number; ch: string; used: boolean };

export default function Spell({ ask, win, miss, level, name }: GameProps) {
  const [word, setWord] = useState<[string, string] | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [filled, setFilled] = useState(0);
  const recent = useRef<string[]>([]);

  // Level 1: 3 letters, hints shown. Level 2: 4 letters, one extra tile. Level 3: 5 letters, two extra tiles.
  const tier = Math.min(level, 3);
  const showHint = tier === 1;

  const start = () => {
    const pool = WORDS[tier - 1].filter(([w]) => !recent.current.includes(w));
    const w = pick(pool);
    recent.current = [...recent.current.slice(-5), w[0]];
    const extras = shuffle(ALPHA.split("").filter((c) => !w[0].includes(c))).slice(0, tier - 1);
    setWord(w);
    setFilled(0);
    setTiles(shuffle([...w[0].split(""), ...extras]).map((ch, id) => ({ id, ch, used: false })));
    const spelled = w[0].split("").map((c) => soundOf(c)).join(", ");
    ask(`Spell ${w[0].toUpperCase()}`, `Let's spell ${w[0]}. ${spelled}. ${w[0]}!`);
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!word) return <div className="stage" />;
  const [text, emoji] = word;

  const tap = (t: Tile, el: HTMLElement) => {
    if (t.used || filled >= text.length) return;
    const want = text[filled];
    if (t.ch === want) {
      sfx.tick(filled + 1);
      say(`${t.ch.toUpperCase()}. ${soundOf(t.ch)}`, { rate: 1 });
      setTiles((ts) => ts.map((x) => (x.id === t.id ? { ...x, used: true } : x)));
      const n = filled + 1;
      setFilled(n);
      if (n === text.length) {
        setTimeout(() => {
          win(`${text.split("").join(", ")}. ${text}!${name ? ` ${name} can spell ${text}` : ""}`);
          setTimeout(start, 3400);
        }, 500);
      }
    } else {
      wobble(el);
      sfx.boop();
      miss();
      say(`That's ${t.ch.toUpperCase()}. We need ${soundOf(want)}.`);
    }
  };

  return (
    <div className="stage split" key={text}>
      <div className="spell-top">
        <button className="spell-pic" aria-label={`Hear ${text}`} onClick={() => say(`${text}. ${text.split("").map(soundOf).join(", ")}. ${text}.`)}>
          {emoji}
        </button>
        <div className="slots">
          {text.split("").map((c, i) => (
            <span key={i} className={`slot${i < filled ? " in" : ""}${i === filled ? " next" : ""}`}>
              {i < filled ? c : showHint ? <span className="ghost">{c}</span> : ""}
            </span>
          ))}
        </div>
      </div>
      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.id} className={`tile${t.used ? " used" : ""}`} aria-label={t.ch} onClick={(e) => tap(t, e.currentTarget)}>
            {t.ch}
          </button>
        ))}
      </div>
    </div>
  );
}
