"use client";

import { useEffect, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { NUMBER_WORDS, pick, shuffle, wobble } from "@/lib/util";
import type { GameProps } from "../types";

const THINGS = [
  ["🍓", "strawberries"],
  ["🐥", "chicks"],
  ["🍎", "apples"],
  ["⭐", "stars"],
  ["🐠", "fish"],
  ["🧁", "cupcakes"],
  ["🦋", "butterflies"],
  ["🍌", "bananas"],
] as const;

type Round = { n: number; emoji: string; label: string; options: number[] };

function makeRound(stars: number): Round {
  // Starts at up to 5, grows toward 10 as she earns stars.
  const max = Math.min(5 + Math.floor(stars / 15), 10);
  const n = 1 + Math.floor(Math.random() * max);
  const [emoji, label] = pick(THINGS);
  const opts = new Set([n]);
  while (opts.size < 3) opts.add(Math.max(1, n + Math.floor(Math.random() * 5) - 2));
  return { n, emoji, label, options: shuffle([...opts]) };
}

export default function Counting({ ask, win, stars }: GameProps) {
  const [round, setRound] = useState<Round | null>(null);
  const [counted, setCounted] = useState<number[]>([]); // index -> order counted
  const [choosing, setChoosing] = useState(false);
  const [solved, setSolved] = useState(false);

  const start = () => {
    const r = makeRound(stars);
    setRound(r);
    setCounted([]);
    setChoosing(false);
    setSolved(false);
    ask(`Count the ${r.label}!`, `Let's count the ${r.label}! Tap each one.`);
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) return <div className="stage" />;

  const tapThing = (i: number) => {
    if (counted[i]) return;
    const num = counted.filter(Boolean).length + 1;
    const next = [...counted];
    next[i] = num;
    setCounted(next);
    sfx.tick(num);
    say(NUMBER_WORDS[num]);
    if (num === round.n)
      setTimeout(() => {
        setChoosing(true);
        ask("How many?", `How many ${round.label}?`);
      }, 800);
  };

  const choose = (o: number, el: HTMLElement) => {
    if (solved) return;
    if (o === round.n) {
      setSolved(true);
      win(`${NUMBER_WORDS[o]} ${round.label}`);
      setTimeout(start, 2200);
    } else {
      wobble(el);
      sfx.boop();
      say(`That's ${NUMBER_WORDS[o]}. Try again!`);
    }
  };

  return (
    <div className="stage split" key={round.label + round.n}>
      <div className="tray">
        {Array.from({ length: round.n }, (_, i) => (
          <button
            key={i}
            className={`thing${counted[i] ? " counted" : ""}`}
            style={{ animationDelay: `${i * 0.07}s` }}
            aria-label={round.label}
            onClick={() => tapThing(i)}
          >
            {round.emoji}
            {counted[i] ? <span className="tag">{counted[i]}</span> : null}
          </button>
        ))}
      </div>
      <div className="choices grow">
        {choosing &&
          round.options.map((o) => (
            <button
              key={o}
              className={`card${solved && o === round.n ? " right" : ""}`}
              aria-label={NUMBER_WORDS[o]}
              onClick={(e) => choose(o, e.currentTarget)}
            >
              <span className="num">{o}</span>
              <span className="dots">
                {Array.from({ length: o }, (_, k) => (
                  <b key={k} />
                ))}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
