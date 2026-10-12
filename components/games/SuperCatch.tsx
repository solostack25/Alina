"use client";

import { useEffect, useRef, useState } from "react";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { HEROES } from "@/lib/heroes";
import { LETTERS } from "@/lib/letters";
import { NUMBER_WORDS, pick } from "@/lib/util";
import type { GameProps } from "../types";

/**
 * Super Catch: she drags her superhero along the bottom to catch the right falling stars or hearts.
 * Liyana: catch hearts of the color Pip calls. Alina levels up: colors, then numbers, then letter sounds.
 */

const COLORS = [
  { name: "red", hex: "#ff4d5e" }, { name: "blue", hex: "#3a8dff" }, { name: "yellow", hex: "#ffd43b" },
  { name: "green", hex: "#3ccf91" }, { name: "purple", hex: "#9b6bff" }, { name: "orange", hex: "#ff8a3d" },
];
const LETTER_POOL = ["B", "D", "F", "M", "P", "S", "T", "L", "N", "R"];
const GOAL = 5;

type Kind = "color" | "number" | "letter";
type Target = { kind: Kind; value: string; hex?: string; prompt: string; spoken: string };
type Drop = { id: number; x: number; y: number; v: number; value: string; hex: string; spin: number; caught?: boolean };

function makeTarget(kind: Kind): Target {
  if (kind === "color") {
    const c = pick(COLORS);
    return { kind, value: c.name, hex: c.hex, prompt: `Catch ${c.name}!`, spoken: `Catch the ${c.name} ones!` };
  }
  if (kind === "number") {
    const n = 1 + Math.floor(Math.random() * 9);
    return { kind, value: String(n), prompt: `Catch ${n}!`, spoken: `Catch the number ${NUMBER_WORDS[n]}!` };
  }
  const L = pick(LETTER_POOL);
  const sound = LETTERS[L][0];
  return { kind, value: L, prompt: `Catch ${sound}!`, spoken: `Catch the letter that says ${sound}! ${sound}!` };
}

function makeDrop(t: Target, id: number, speed: number, forceRight: boolean): Drop {
  let value = t.value;
  let hex = t.hex ?? pick(COLORS).hex;
  const right = forceRight || Math.random() < 0.45;
  if (!right) {
    if (t.kind === "color") {
      const c = pick(COLORS.filter((c) => c.name !== t.value));
      value = c.name;
      hex = c.hex;
    } else if (t.kind === "number") value = String(pick([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => String(n) !== t.value)));
    else value = pick(LETTER_POOL.filter((l) => l !== t.value));
  }
  return { id, x: 8 + Math.random() * 84, y: -12, v: speed * (0.8 + Math.random() * 0.4), value, hex, spin: Math.random() * 40 - 20 };
}

export default function SuperCatch(props: GameProps) {
  const { ask, level, player, name } = props;
  // Always call the newest win/miss (the game loop is set up once).
  const live = useRef(props);
  live.current = props;
  const hero = HEROES[player];
  const kind: Kind = player === "little" ? "color" : (["color", "number", "letter"] as Kind[])[Math.min(level, 3) - 1];
  // Little sister gets slower drops. Alina's speed up with each level.
  const speed = player === "little" ? 9 : 11 + level * 3; // % of stage height per second

  type DropView = Pick<Drop, "id" | "value" | "hex">;
  const [dropViews, setDropViews] = useState<DropView[]>([]);
  const [caught, setCaught] = useState(0);
  const [pose, setPose] = useState<"" | "yay" | "oops">("");
  const stage = useRef<HTMLDivElement>(null);
  const heroEl = useRef<HTMLDivElement>(null);
  const dropEls = useRef(new Map<number, HTMLDivElement>());
  const size = useRef({ w: 1, h: 1 });
  // Where her finger is, and where the hero actually is (it glides toward the finger every frame).
  const fingerX = useRef(50);
  const heroX = useRef(50);
  const pressing = useRef(false);
  const target = useRef<Target>(makeTarget(kind));
  const caughtRef = useRef(0);
  const paused = useRef(false);
  const nextId = useRef(0);
  const dropsRef = useRef<Drop[]>([]);
  const sinceRight = useRef(0);

  const syncViews = () => setDropViews(dropsRef.current.map(({ id, value, hex }) => ({ id, value, hex })));

  const newRound = () => {
    target.current = makeTarget(kind);
    caughtRef.current = 0;
    setCaught(0);
    dropsRef.current = [];
    syncViews();
    paused.current = false;
    const t = target.current;
    ask(t.prompt, `${t.spoken} Move ${name || "your hero"} to catch them!`, t.hex ? { bg: t.hex, fg: t.value === "yellow" ? "#2b2350" : "#fff" } : undefined);
  };

  useEffect(() => {
    const el = stage.current!;
    const measure = () => {
      const r = el.getBoundingClientRect();
      size.current = { w: r.width || 1, h: r.height || 1 };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    newRound();
    let raf = 0;
    let last = performance.now();
    let spawnIn = 600;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { w, h } = size.current;

      // Hero glides toward her finger: quick but smooth, no jitter.
      heroX.current += (fingerX.current - heroX.current) * (1 - Math.exp(-dt * 20));
      if (heroEl.current) heroEl.current.style.transform = `translate3d(${(heroX.current / 100) * w}px,0,0) translateX(-50%)`;

      if (!paused.current) {
        spawnIn -= dt * 1000;
        let changed = false;
        for (const d of dropsRef.current) d.y += d.v * dt;
        const before = dropsRef.current.length;
        dropsRef.current = dropsRef.current.filter((d) => d.y < 112);
        if (dropsRef.current.length !== before) changed = true;
        if (spawnIn <= 0) {
          spawnIn = player === "little" ? 1250 : Math.max(650, 1150 - level * 120);
          // Make sure a right one shows up at least every third drop.
          const d = makeDrop(target.current, nextId.current++, speed, sinceRight.current >= 2);
          sinceRight.current = d.value === target.current.value ? 0 : sinceRight.current + 1;
          dropsRef.current.push(d);
          changed = true;
        }
        // Catch zone: near the hero's hands, around 80% down the stage.
        const hits = dropsRef.current.filter((d) => d.y >= 70 && d.y <= 88 && Math.abs(d.x - heroX.current) <= 11);
        if (hits.length) {
          dropsRef.current = dropsRef.current.filter((d) => !hits.includes(d));
          changed = true;
        }
        // Move the stars on the GPU; React only re-renders when one appears or goes away.
        for (const d of dropsRef.current) {
          const de = dropEls.current.get(d.id);
          if (de) de.style.transform = `translate3d(${(d.x / 100) * w}px,${(d.y / 100) * h}px,0) translate(-50%,-50%) rotate(${d.spin}deg)`;
        }
        if (changed) syncViews();
        hits.forEach((d) => onCatch(d.value === target.current.value, d));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onCatch = (ok: boolean, d: Drop) => {
    const t = target.current;
    if (ok) {
      sfx.tick(caughtRef.current + 1);
      caughtRef.current++;
      setCaught(caughtRef.current);
      setPose("yay");
      setTimeout(() => setPose(""), 350);
      if (caughtRef.current >= GOAL) {
        paused.current = true;
        live.current.win(`You caught ${NUMBER_WORDS[GOAL]}! Super ${name || "hero"}`);
        afterSpeech(newRound, 1500);
      } else say(NUMBER_WORDS[caughtRef.current], { rate: 1 });
    } else {
      sfx.boop();
      live.current.miss();
      setPose("oops");
      setTimeout(() => setPose(""), 400);
      const what = t.kind === "color" ? d.value : t.kind === "number" ? NUMBER_WORDS[Number(d.value)] : `${d.value}, ${LETTERS[d.value][0]}`;
      say(`Oops, that's ${what}!`, { rate: 1 });
    }
  };

  const aim = (clientX: number) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    fingerX.current = Math.max(8, Math.min(92, ((clientX - r.left) / r.width) * 100));
  };

  return (
    <div
      className={`stage catch power-${hero.power}`}
      ref={stage}
      onPointerDown={(e) => {
        // Hold onto the whole play area, so touching a falling star never steals the drag.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        pressing.current = true;
        aim(e.clientX);
      }}
      onPointerMove={(e) => {
        if (pressing.current || e.pointerType === "mouse") aim(e.clientX);
      }}
      onPointerUp={() => (pressing.current = false)}
      onPointerCancel={() => (pressing.current = false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="catch-count" aria-label={`${caught} of ${GOAL} caught`}>
        {Array.from({ length: GOAL }, (_, i) => (
          <span key={i} className={i < caught ? "got" : ""}>
            {hero.power === "stars" ? "⭐" : "💖"}
          </span>
        ))}
      </div>
      {dropViews.map((d) => (
        <div
          key={d.id}
          ref={(el) => {
            if (el) dropEls.current.set(d.id, el);
            else dropEls.current.delete(d.id);
          }}
          className={`drop power-${hero.power}`}
          style={{ ["--c" as string]: d.hex, transform: "translate3d(-200px,-200px,0)" }}
        >
          <svg viewBox="0 0 100 100" aria-hidden>
            {hero.power === "stars" ? (
              <path d="M50 4 L62 36 L96 37 L69 58 L79 92 L50 72 L21 92 L31 58 L4 37 L38 36 Z" />
            ) : (
              <path d="M50 90 C10 62 4 40 14 24 C24 8 44 10 50 28 C56 10 76 8 86 24 C96 40 90 62 50 90 Z" />
            )}
          </svg>
          {kind !== "color" && <b>{d.value}</b>}
        </div>
      ))}
      <div className={`catcher ${pose}`} ref={heroEl}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero.hero} alt={`${name} the superhero`} draggable={false} />
      </div>
      <div className="catch-hint" aria-hidden>
        👆 Drag {name || "your hero"}!
      </div>
    </div>
  );
}
