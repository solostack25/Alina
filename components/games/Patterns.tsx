"use client";

import { useEffect, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { pick, shuffle, wobble } from "@/lib/util";
import type { GameProps } from "../types";

const SETS = [
  ["🔴", "🔵", "🟡", "🟢", "🟣"],
  ["🐶", "🐱", "🐰", "🐸", "🐼"],
  ["⭐", "🌙", "☀️", "☁️", "🌈"],
  ["🍎", "🍌", "🍇", "🍓", "🍊"],
  ["🚗", "🚌", "🚀", "🚂", "🚁"],
];

// Each template repeats. Level 1: AB. Level 2: AAB, ABC. Level 3: ABB, AABB, ABAC. Level 4: ABCD, AABBC, ABCB.
const TEMPLATES = [["AB"], ["AAB", "ABC"], ["ABB", "AABB", "ABAC"], ["ABCD", "AABBC", "ABCB"]];

type Round = { shown: string[]; answer: string; options: string[] };

function makeRound(level: number): Round {
  const tpl = pick(TEMPLATES[Math.min(level, 4) - 1]);
  const set = shuffle(pick(SETS));
  const letters = [...new Set(tpl.split(""))];
  const map = Object.fromEntries(letters.map((l, i) => [l, set[i]]));
  // Show two full repeats plus part of a third, then ask for the next one.
  const total = tpl.length * 2 + 1 + Math.floor(Math.random() * (tpl.length - 1));
  const seq = Array.from({ length: total + 1 }, (_, i) => map[tpl[i % tpl.length]]);
  const answer = seq[total];
  const used = letters.map((l) => map[l]);
  const extra = set.find((s) => !used.includes(s))!;
  const options = shuffle([...new Set([answer, ...shuffle(used.filter((u) => u !== answer)).slice(0, 1), extra])]);
  return { shown: seq.slice(0, total), answer, options };
}

export default function Patterns({ ask, win, miss, level }: GameProps) {
  const [r, setR] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);

  const start = () => {
    setR(makeRound(level));
    setSolved(false);
    ask("What comes next?", "Look at the pattern. What comes next?");
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return <div className="stage" />;

  const choose = (o: string, el: HTMLElement) => {
    if (solved) return;
    if (o === r.answer) {
      setSolved(true);
      win("You finished the pattern");
      setTimeout(start, 2400);
    } else {
      wobble(el);
      sfx.boop();
      miss();
      say("Hmm, not that one. Look at the pattern again!");
    }
  };

  return (
    <div className="stage split" key={r.shown.join("")}>
      <div className="pattern">
        {r.shown.map((s, i) => (
          <span key={i} className="pitem" style={{ animationDelay: `${i * 0.08}s` }}>
            {s}
          </span>
        ))}
        <span className={`pitem mystery${solved ? " solved" : ""}`}>{solved ? r.answer : "?"}</span>
      </div>
      <div className="choices grow">
        {r.options.map((o) => (
          <button key={o} className={`card${solved && o === r.answer ? " right" : ""}`} onClick={(e) => choose(o, e.currentTarget)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
