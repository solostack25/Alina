"use client";

import { useEffect, useRef, useState } from "react";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { HEROES } from "@/lib/heroes";
import { LETTERS } from "@/lib/letters";
import { pick, shuffle } from "@/lib/util";
import type { GameProps } from "../types";

/**
 * Super Letter Race: her superhero races down a track. Pip calls a letter, gates with letters
 * come at her, and she taps a lane to fly through the right one. Eight gates to the finish.
 * Liyana: 2 lanes, capitals. Alina levels up: capitals, lowercase (with look-alikes),
 * letter sounds, then first letters of pictures.
 */

const GATES = 8;
const HERO_X = 20; // % from left where gates are judged
const UPPER = "ABCDEFGHIJKLMNOPRSTUVWYZ".split("");
const LOOKALIKE: Record<string, string[]> = { b: ["d", "p"], d: ["b", "q"], p: ["q", "b"], q: ["p", "d"], m: ["n", "w"], n: ["m", "h"], u: ["n", "v"], w: ["m", "v"] };
const LETTER_WORD: Record<string, string> = { B: "B", D: "D", P: "P", Q: "Q" };

type Kind = "upper" | "lower" | "sound" | "picture";
type Q = { answer: string; options: string[]; text: string; spoken: string; pic?: string; kind: Kind };

function makeQ(kind: Kind, lanes: number, last: string): Q {
  const pool = UPPER.filter((l) => l !== last.toUpperCase() && l !== "X" && l !== "Q");
  const L = pick(pool);
  const others = (n: number, base: string[], ans: string) => shuffle(base.filter((x) => x !== ans)).slice(0, n);
  if (kind === "upper") {
    return { kind, answer: L, options: shuffle([L, ...others(lanes - 1, UPPER, L)]), text: `Find ${L}!`, spoken: `Find the letter ${LETTER_WORD[L] ?? L}!` };
  }
  if (kind === "lower") {
    const l = Math.random() < 0.4 ? pick(Object.keys(LOOKALIKE)) : L.toLowerCase();
    const trick = LOOKALIKE[l] ?? [];
    const opts = [l, ...shuffle(trick).slice(0, lanes - 1)];
    while (opts.length < lanes) {
      const o = pick(UPPER).toLowerCase();
      if (!opts.includes(o)) opts.push(o);
    }
    return { kind, answer: l, options: shuffle(opts), text: `Find little ${l}!`, spoken: `Find little ${l}! Lowercase ${l}.` };
  }
  if (kind === "sound") {
    const sound = LETTERS[L][0];
    const opts = [L, ...others(lanes - 1, pool.filter((x) => LETTERS[x][0] !== sound), L)];
    return { kind, answer: L, options: shuffle(opts), text: `Which says “${sound}”?`, spoken: `Which letter says ${sound}? ${sound}!` };
  }
  const [emoji, word] = LETTERS[L][1];
  const opts = [L, ...others(lanes - 1, pool.filter((x) => LETTERS[x][0] !== LETTERS[L][0]), L)];
  return { kind, answer: L, options: shuffle(opts), text: `${word} starts with…`, spoken: `${word}! What letter does ${word} start with?`, pic: emoji };
}

type Gate = { id: number; x: number; q: Q; judged: boolean; result?: "yes" | "no"; hitLane?: number };

export default function LetterRace(props: GameProps) {
  const { player, level, name } = props;
  const live = useRef(props);
  live.current = props;
  const hero = HEROES[player];
  const little = player === "little";
  const lanes = little ? 2 : 3;
  const kind: Kind = little ? "upper" : (["upper", "lower", "sound", "picture"] as Kind[])[Math.min(level, 4) - 1];
  // Seconds for a gate to travel to her hero. Slower for Liyana, a bit quicker as Alina levels up.
  const travel = little ? 7 : Math.max(4.6, 6.4 - level * 0.4);

  const [lane, setLane] = useState(little ? 0 : 1);
  const laneRef = useRef(lane);
  const [gates, setGates] = useState<Gate[]>([]);
  const gatesRef = useRef<Gate[]>([]);
  const [passed, setPassed] = useState(0);
  const [right, setRight] = useState(0);
  const [boost, setBoost] = useState(0);
  const [oops, setOops] = useState(0);
  const [finished, setFinished] = useState(false);
  const [prompt, setPromptState] = useState<Q | null>(null);
  const gateEls = useRef(new Map<number, HTMLDivElement>());
  const track = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const speed = useRef(1);
  const nextId = useRef(0);
  const passedRef = useRef(0);
  const rightRef = useRef(0);
  const lastLetter = useRef("");
  const raceOver = useRef(false);

  const sendGate = () => {
    if (raceOver.current) return;
    const q = makeQ(kind, lanes, lastLetter.current);
    lastLetter.current = q.answer;
    setPromptState(q);
    live.current.ask(q.pic ? `${q.pic} ${q.text}` : q.text, q.spoken);
    // Launch the gate once the question has been heard.
    afterSpeech(() => {
      if (raceOver.current) return;
      const g: Gate = { id: nextId.current++, x: 108, q, judged: false };
      gatesRef.current = [...gatesRef.current, g];
      setGates(gatesRef.current);
    }, 200);
  };

  const newRace = () => {
    raceOver.current = false;
    passedRef.current = 0;
    rightRef.current = 0;
    gatesRef.current = [];
    setGates([]);
    setPassed(0);
    setRight(0);
    setFinished(false);
    live.current.ask("Ready, set, go!", `Ready, set, go! Tap a lane to steer ${name || "your hero"} through the right letter!`);
    afterSpeech(sendGate, 300);
  };

  const judge = (g: Gate) => {
    const laneLetter = g.q.options[laneRef.current];
    const ok = laneLetter === g.q.answer;
    g.judged = true;
    g.result = ok ? "yes" : "no";
    g.hitLane = laneRef.current;
    setGates([...gatesRef.current]);
    passedRef.current++;
    setPassed(passedRef.current);
    if (ok) {
      rightRef.current++;
      setRight(rightRef.current);
      sfx.levelUp();
      setBoost((b) => b + 1);
      speed.current = 2.6;
      setTimeout(() => (speed.current = 1), 1300);
      const noun = g.q.kind === "lower" ? `little ${g.q.answer}` : g.q.answer;
      say(pick([`Zoom! ${noun}!`, `Yes, ${noun}! Speed boost!`, `${noun}! Super fast!`]), { rate: 1.05 });
    } else {
      sfx.boop();
      live.current.miss();
      setOops((o) => o + 1);
      speed.current = 0.5;
      setTimeout(() => (speed.current = 1), 900);
      const got = laneLetter;
      const want = g.q.kind === "lower" ? `little ${g.q.answer}` : g.q.answer;
      say(`Oops, that was ${g.q.kind === "lower" ? "little " + got : got}. We needed ${want}!`, { rate: 1 });
    }
    if (passedRef.current >= GATES) {
      raceOver.current = true;
      afterSpeech(() => {
        setFinished(true);
        sfx.yay();
        live.current.win(`You crossed the finish line! You got ${rightRef.current} letters right`);
        afterSpeech(newRace, 2500);
      }, 600);
    } else {
      afterSpeech(sendGate, 500);
    }
  };

  useEffect(() => {
    newRace();
    let raf = 0;
    let last = performance.now();
    let bgX = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const v = speed.current;
      // scenery scrolls at race speed
      bgX -= dt * 180 * v;
      if (bgRef.current) bgRef.current.style.setProperty("--scroll", `${bgX}px`);
      // gates move toward her hero; boost/slowdown also affects them (gently)
      const rate = (108 - HERO_X) / travel;
      let changed = false;
      for (const g of gatesRef.current) {
        g.x -= dt * rate * (g.judged ? 1.6 * v : Math.min(1.3, 0.85 + 0.15 * v));
        if (!g.judged && g.x <= HERO_X + 2) judge(g);
        const el = gateEls.current.get(g.id);
        if (el) el.style.transform = `translate3d(${(g.x / 100) * (track.current?.clientWidth ?? 1000)}px,0,0)`;
      }
      const before = gatesRef.current.length;
      gatesRef.current = gatesRef.current.filter((g) => g.x > -30);
      if (gatesRef.current.length !== before) changed = true;
      if (changed) setGates([...gatesRef.current]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      raceOver.current = true;
      cancelAnimationFrame(raf);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const steer = (i: number) => {
    if (i === laneRef.current) return;
    laneRef.current = i;
    setLane(i);
    sfx.flip();
  };

  const laneTop = (i: number) => `${((i + 0.5) / lanes) * 100}%`;

  return (
    <div className={`stage race power-${hero.power}${finished ? " finished" : ""}`} ref={bgRef}>
      <div className="race-sky" aria-hidden />
      <div className="race-city" aria-hidden />
      <div className="race-progress" aria-label={`${passed} of ${GATES} gates`}>
        <div className="rp-track">
          <span className="rp-fill" style={{ width: `${(passed / GATES) * 100}%` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rp-face" src={hero.face} alt="" style={{ left: `${(passed / GATES) * 100}%` }} />
        </div>
        <span className="rp-flag">🏁</span>
        <span className="rp-score">⭐ {right}</span>
      </div>
      <div className={`race-track lanes-${lanes}`} ref={track}>
        {Array.from({ length: lanes }, (_, i) => (
          <button key={i} className={`lane${i === lane ? " on" : ""}`} aria-label={`Lane ${i + 1}`} onPointerDown={() => steer(i)} />
        ))}
        {gates.map((g) => (
          <div
            key={g.id}
            className={`gate${g.result ? " " + g.result : ""}`}
            ref={(el) => {
              if (el) gateEls.current.set(g.id, el);
              else gateEls.current.delete(g.id);
            }}
            style={{ transform: "translate3d(120%,0,0)" }}
          >
            {g.q.options.map((o, i) => (
              <span key={i} className={`sign${g.hitLane === i ? " hit" : ""}${g.result && o === g.q.answer ? " answer" : ""}`} style={{ top: laneTop(i) }}>
                {o}
              </span>
            ))}
          </div>
        ))}
        <div className={`racer${boost ? " boosting" : ""}`} key={`r${boost}-${oops}`} style={{ top: laneTop(lane) }} data-oops={oops ? "1" : ""}>
          <div className="racer-trail" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.hero} alt={`${name} racing`} draggable={false} />
        </div>
        {finished && (
          <div className="finish" aria-hidden>
            <span className="trophy">🏆</span>
          </div>
        )}
      </div>
      {prompt?.pic && !finished && <div className="race-pic" key={prompt.answer + passed}>{prompt.pic}</div>}
    </div>
  );
}
