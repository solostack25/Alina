"use client";

import { useEffect, useState } from "react";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { pick, shuffle, wobble } from "@/lib/util";
import type { GameProps } from "../types";

type Group = { id: string; what: string; items: [string, string][] };

const GROUPS: Group[] = [
  { id: "animals", what: "an animal", items: [["🐶", "dog"], ["🐱", "cat"], ["🐰", "bunny"], ["🐻", "bear"], ["🦁", "lion"], ["🐵", "monkey"], ["🐮", "cow"]] },
  { id: "sea", what: "a sea animal", items: [["🐟", "fish"], ["🐙", "octopus"], ["🦀", "crab"], ["🐳", "whale"], ["🐬", "dolphin"], ["🦈", "shark"]] },
  { id: "fruit", what: "a fruit", items: [["🍎", "apple"], ["🍌", "banana"], ["🍇", "grapes"], ["🍓", "strawberry"], ["🍊", "orange"], ["🍉", "watermelon"]] },
  { id: "treats", what: "a treat", items: [["🍰", "cake"], ["🧁", "cupcake"], ["🍩", "donut"], ["🍪", "cookie"], ["🍭", "lollipop"], ["🍦", "ice cream"]] },
  { id: "ride", what: "something you ride in", items: [["🚗", "car"], ["🚌", "bus"], ["🚒", "fire truck"], ["🚂", "train"], ["✈️", "airplane"], ["🚁", "helicopter"]] },
  { id: "sky", what: "something in the sky", items: [["☀️", "sun"], ["🌙", "moon"], ["⭐", "star"], ["☁️", "cloud"], ["🌈", "rainbow"]] },
  { id: "wear", what: "something you wear", items: [["👕", "shirt"], ["👖", "pants"], ["👗", "dress"], ["🧦", "socks"], ["🧢", "cap"], ["👟", "shoes"]] },
];

// Groups that look alike, used at level 3 to make it tricky.
const CLOSE: Record<string, string> = { animals: "sea", sea: "animals", fruit: "treats", treats: "fruit" };

type Round = { group: Group; odd: [string, string]; items: [string, string][] };

function makeRound(level: number): Round {
  const lv = Math.min(level, 3);
  const group = pick(lv === 3 ? GROUPS.filter((g) => CLOSE[g.id]) : GROUPS);
  const oddGroup = lv === 3 ? GROUPS.find((g) => g.id === CLOSE[group.id])! : pick(GROUPS.filter((g) => g.id !== group.id && CLOSE[g.id] !== group.id));
  const same = shuffle(group.items).slice(0, lv === 1 ? 3 : 4);
  const odd = pick(oddGroup.items);
  return { group, odd, items: shuffle([...same, odd]) };
}

export default function OddOneOut({ ask, win, miss, level }: GameProps) {
  const [r, setR] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);

  const start = () => {
    setR(makeRound(level));
    setSolved(false);
    ask("Which one doesn't belong?", "Which one doesn't belong?");
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return <div className="stage" />;

  const choose = (it: [string, string], el: HTMLElement) => {
    if (solved) return;
    if (it === r.odd) {
      setSolved(true);
      win(`The ${it[1]} is not ${r.group.what}`);
      afterSpeech(start, 1200);
    } else {
      wobble(el);
      sfx.boop();
      miss();
      say(`The ${it[1]} is ${r.group.what}. Try again!`);
    }
  };

  return (
    <div className="stage">
      <div className={`choices odd n${r.items.length}`} key={r.items.map((i) => i[0]).join("")}>
        {r.items.map((it) => (
          <button key={it[0]} className={`card${solved && it === r.odd ? " right" : ""}${solved && it !== r.odd ? " faded" : ""}`} aria-label={it[1]} onClick={(e) => choose(it, e.currentTarget)}>
            {it[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
