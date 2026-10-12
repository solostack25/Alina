"use client";

import { useEffect, useRef, useState } from "react";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { NUMBER_WORDS, pick, shuffle, wobble } from "@/lib/util";
import type { GameProps } from "../types";

const ADD_THINGS = [
  ["🦆", "duck", "ducks"], ["🍎", "apple", "apples"], ["🐞", "ladybug", "ladybugs"], ["🧁", "cupcake", "cupcakes"],
  ["🐰", "bunny", "bunnies"], ["⭐", "star", "stars"], ["🎈", "balloon", "balloons"],
] as const;
// Things that can fly or hop away for take-away problems.
const AWAY_THINGS = [
  ["🐦", "bird", "birds", "flies away", "fly away"], ["🦋", "butterfly", "butterflies", "flies away", "fly away"],
  ["🐸", "frog", "frogs", "hops away", "hop away"], ["🐝", "bee", "bees", "buzzes away", "buzz away"],
  ["🎈", "balloon", "balloons", "floats away", "float away"],
] as const;

type Round = {
  kind: "add" | "take";
  a: number;
  b: number;
  answer: number;
  emoji: string;
  one: string;
  many: string;
  verb?: [string, string];
  options: number[];
};

// Level 1: add to 5. Level 2: add to 10. Level 3: take away from 5. Level 4: mix, up to 10.
function makeRound(level: number): Round {
  const lv = Math.min(level, 4);
  const take = lv === 3 || (lv === 4 && Math.random() < 0.5);
  const max = lv === 1 || lv === 3 ? 5 : 10;
  let a: number, b: number, answer: number;
  if (take) {
    a = 2 + Math.floor(Math.random() * (max - 1));
    b = 1 + Math.floor(Math.random() * (a - 1));
    answer = a - b;
  } else {
    a = 1 + Math.floor(Math.random() * (max - 1));
    b = 1 + Math.floor(Math.random() * (max - a));
    answer = a + b;
  }
  const opts = new Set([answer]);
  while (opts.size < 3) {
    const o = answer + Math.floor(Math.random() * 5) - 2;
    if (o >= 0 && o <= 10) opts.add(o);
  }
  if (take) {
    const [emoji, one, many, v1, vMany] = pick(AWAY_THINGS);
    return { kind: "take", a, b, answer, emoji, one, many, verb: [v1, vMany], options: shuffle([...opts]) };
  }
  const [emoji, one, many] = pick(ADD_THINGS);
  return { kind: "add", a, b, answer, emoji, one, many, options: shuffle([...opts]) };
}

const n = (k: number, one: string, many: string) => `${NUMBER_WORDS[k]} ${k === 1 ? one : many}`;

export default function MathGame({ ask, win, miss, level }: GameProps) {
  const [r, setR] = useState<Round | null>(null);
  const [gone, setGone] = useState(false);
  const [solved, setSolved] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const start = () => {
    const round = makeRound(level);
    setR(round);
    setGone(false);
    setSolved(false);
    if (round.kind === "add") {
      ask(`${round.a} + ${round.b} = ?`, `${n(round.a, round.one, round.many)}, plus ${n(round.b, round.one, round.many)}. How many ${round.many}?`);
    } else {
      ask(`${round.a} − ${round.b} = ?`, `There are ${n(round.a, round.one, round.many)}. Watch!`);
      setTimeout(() => {
        if (!alive.current) return;
        setGone(true);
        say(`${n(round.b, round.one, round.many)} ${round.verb![round.b === 1 ? 0 : 1]}! How many are left?`, { queue: true });
      }, 1800);
    }
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return <div className="stage" />;

  const choose = (o: number, el: HTMLElement) => {
    if (solved || (r.kind === "take" && !gone)) return;
    if (o === r.answer) {
      setSolved(true);
      win(r.kind === "add" ? `${r.a} plus ${r.b} is ${r.answer}` : `${r.a} take away ${r.b} is ${r.answer}`);
      afterSpeech(start, 1200);
    } else {
      wobble(el);
      sfx.boop();
      miss();
      say(`Not ${NUMBER_WORDS[o]}. Count them again!`);
    }
  };

  const items = (count: number, offset = 0, leaving = 0) =>
    Array.from({ length: count }, (_, i) => (
      <span key={i + offset} className={`mthing${gone && i >= count - leaving ? " away" : ""}`} style={{ animationDelay: `${(i + offset) * 0.06}s` }}>
        {r.emoji}
      </span>
    ));

  return (
    <div className="stage split" key={`${r.kind}${r.a}${r.b}${r.emoji}`}>
      <div className="equation">
        {r.kind === "add" ? (
          <>
            <div className="group">{items(r.a)}</div>
            <span className="op">+</span>
            <div className="group">{items(r.b, r.a)}</div>
          </>
        ) : (
          <div className="group wide">{items(r.a, 0, r.b)}</div>
        )}
      </div>
      <div className="choices grow">
        {r.options.map((o) => (
          <button key={o} className={`card${solved && o === r.answer ? " right" : ""}`} aria-label={NUMBER_WORDS[o]} onClick={(e) => choose(o, e.currentTarget)}>
            <span className="num">{o}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
