"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { dragGhost, inside } from "@/lib/drag";
import { NUMBER_WORDS, pick, shuffle } from "@/lib/util";
import type { GameProps } from "../types";

type Item = { e: string; word: string; color?: string };
type Round = { prompt: string; spoken: string; items: (Item & { id: number; ok: boolean })[]; need: number; why: (it: Item) => string };

const FOODS: Item[] = [
  { e: "🍎", word: "apple", color: "red" }, { e: "🍓", word: "strawberry", color: "red" }, { e: "🍒", word: "cherries", color: "red" },
  { e: "🍅", word: "tomato", color: "red" }, { e: "🍌", word: "banana", color: "yellow" }, { e: "🌽", word: "corn", color: "yellow" },
  { e: "🧀", word: "cheese", color: "yellow" }, { e: "🍋", word: "lemon", color: "yellow" }, { e: "🥦", word: "broccoli", color: "green" },
  { e: "🥒", word: "cucumber", color: "green" }, { e: "🍏", word: "green apple", color: "green" }, { e: "🥝", word: "kiwi", color: "green" },
  { e: "🫐", word: "blueberries", color: "blue" }, { e: "🍇", word: "grapes", color: "purple" }, { e: "🍆", word: "eggplant", color: "purple" },
  { e: "🥕", word: "carrot", color: "orange" }, { e: "🍊", word: "orange", color: "orange" }, { e: "🍞", word: "bread" },
  { e: "🍕", word: "pizza" }, { e: "🍪", word: "cookie" }, { e: "🥚", word: "egg" }, { e: "🍉", word: "watermelon" },
  { e: "🍩", word: "donut" }, { e: "🥛", word: "milk" }, { e: "🧁", word: "cupcake" },
];
// First-sound groups: [sound, letter, items]
const SOUNDS: [string, string, string[]][] = [
  ["buh", "B", ["banana", "broccoli", "blueberries", "bread"]],
  ["kuh", "C", ["cookie", "carrot", "corn", "cupcake", "cucumber"]],
];
// Things to count out, with plurals.
const COUNT_FOODS: [string, string][] = [
  ["🍪", "cookies"], ["🍓", "strawberries"], ["🍎", "apples"], ["🧁", "cupcakes"], ["🍩", "donuts"], ["🥚", "eggs"], ["🍒", "cherries"],
];
const RHYMES: [string, Item[]][] = [
  ["cat", [{ e: "🎩", word: "hat" }, { e: "🦇", word: "bat" }, { e: "🐀", word: "rat" }]],
  ["log", [{ e: "🐸", word: "frog" }, { e: "🐶", word: "dog" }]],
  ["bee", [{ e: "🌳", word: "tree" }, { e: "🔑", word: "key" }]],
  ["car", [{ e: "⭐", word: "star" }, { e: "🫙", word: "jar" }]],
  ["cake", [{ e: "🐍", word: "snake" }, { e: "🏞️", word: "lake" }]],
  ["moon", [{ e: "🥄", word: "spoon" }, { e: "🎈", word: "balloon" }]],
];
const RHYME_DECOYS: Item[] = [
  { e: "🐟", word: "fish" }, { e: "🚗", word: "car" }, { e: "🍎", word: "apple" }, { e: "👟", word: "shoe" },
  { e: "🐱", word: "cat" }, { e: "☀️", word: "sun" }, { e: "🧦", word: "sock" }, { e: "🎁", word: "gift" },
];

let uid = 0;
const tag = (items: Item[], ok: (it: Item) => boolean) => items.map((it) => ({ ...it, id: uid++, ok: ok(it) }));

// Level 1: colors. Level 2: first sounds. Level 3: rhymes. Level 4: count out an exact number.
function makeRound(level: number): Round {
  const lv = Math.min(level, 4);
  if (lv === 1) {
    const color = pick(["red", "yellow", "green", "orange", "purple"]);
    const yes = shuffle(FOODS.filter((f) => f.color === color)).slice(0, 3);
    const no = shuffle(FOODS.filter((f) => f.color && f.color !== color)).slice(0, 6 - yes.length);
    return {
      prompt: `Feed me ${color}!`, spoken: `I'm hungry! Feed me ${color} food!`, need: yes.length,
      items: shuffle(tag([...yes, ...no], (it) => it.color === color)),
      why: (it) => `Yuck! That's ${it.color ?? "not " + color}.`,
    };
  }
  if (lv === 2) {
    const [sound, letter, words] = pick(SOUNDS);
    const yes = shuffle(FOODS.filter((f) => words.includes(f.word))).slice(0, 3);
    const no = shuffle(FOODS.filter((f) => f.word[0].toUpperCase() !== letter)).slice(0, 6 - yes.length);
    return {
      prompt: `Starts with ${letter}!`, spoken: `Feed me food that starts with ${sound}! ${sound}!`, need: yes.length,
      items: shuffle(tag([...yes, ...no], (it) => words.includes(it.word))),
      why: (it) => `${it.word} doesn't start with ${sound}!`,
    };
  }
  if (lv === 3) {
    const [rhyme, yes] = pick(RHYMES);
    const no = shuffle(RHYME_DECOYS.filter((d) => !d.word.endsWith(rhyme.slice(-2)))).slice(0, 6 - yes.length);
    return {
      prompt: `Rhymes with ${rhyme}!`, spoken: `Feed me things that rhyme with ${rhyme}! ${rhyme}!`, need: yes.length,
      items: shuffle(tag([...yes, ...no], (it) => yes.includes(it))),
      why: (it) => `${it.word} and ${rhyme} don't rhyme!`,
    };
  }
  const n = 2 + Math.floor(Math.random() * 6);
  const [e, plural] = pick(COUNT_FOODS);
  const food: Item = { e, word: plural };
  return {
    prompt: `Feed me ${n}!`, spoken: `Feed me exactly ${NUMBER_WORDS[n]} ${plural}! Count them!`, need: n,
    items: tag(Array.from({ length: Math.min(10, n + 3) }, () => food), () => true),
    why: () => "",
  };
}

export default function Feed({ ask, win, miss, level }: GameProps) {
  const [r, setR] = useState<Round | null>(null);
  const [eaten, setEaten] = useState<number[]>([]);
  const [chomp, setChomp] = useState(0);
  const [open, setOpen] = useState(false);
  const [yuck, setYuck] = useState(0);
  const mouth = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const start = () => {
    const round = makeRound(level);
    setR(round);
    setEaten([]);
    done.current = false;
    ask(round.prompt, round.spoken);
  };
  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return <div className="stage" />;

  const feed = (it: Round["items"][number]) => {
    if (done.current) return false;
    if (!it.ok) {
      sfx.boop();
      miss();
      setYuck((y) => y + 1);
      say(r.why(it));
      return false;
    }
    const next = [...eaten, it.id];
    setEaten(next);
    setChomp((c) => c + 1);
    sfx.pop();
    const count = next.length;
    if (level >= 4) say(NUMBER_WORDS[count], { rate: 1 });
    else say(pick(["Yum!", "Mmm!", "Nom nom!", "Delicious!"]) + ` ${it.word}!`, { rate: 1 });
    if (count >= r.need) {
      done.current = true;
      setTimeout(() => {
        win(level >= 4 ? `${NUMBER_WORDS[count]}! I'm so full` : "I'm full! Thank you");
        setTimeout(start, 2600);
      }, 700);
    }
    return true;
  };

  return (
    <div className="stage split feed" key={r.prompt + r.items[0].id}>
      <div className="monster-zone">
        <div className={`monster${open ? " open" : ""}`} key={`${chomp}-${yuck}`} data-anim={yuck && !open ? "yuck" : chomp ? "chomp" : ""} ref={mouth}>
          <svg viewBox="0 0 200 180" aria-label="Hungry monster">
            <path d="M40 40 L30 6 L64 28 Z M160 40 L170 6 L136 28 Z" fill="#2fb57a" />
            <ellipse cx="100" cy="100" rx="88" ry="74" fill="#3ccf91" />
            <circle cx="70" cy="62" r="20" fill="#fff" /><circle cx="130" cy="62" r="20" fill="#fff" />
            <circle cx="74" cy="64" r="9" fill="#2b2350" /><circle cx="126" cy="64" r="9" fill="#2b2350" />
            <circle cx="77" cy="60" r="3" fill="#fff" /><circle cx="129" cy="60" r="3" fill="#fff" />
            <g className="jaw">
              <path d="M44 102 Q100 170 156 102 Z" fill="#7a1f3d" />
              <path d="M60 104 l8 12 l8 -12 M124 104 l8 12 l8 -12" fill="#fff" />
              <ellipse cx="100" cy="136" rx="22" ry="10" fill="#ff7aa0" />
            </g>
            <circle cx="40" cy="96" r="8" fill="#ff8fb1" opacity=".6" /><circle cx="160" cy="96" r="8" fill="#ff8fb1" opacity=".6" />
          </svg>
          {level >= 4 && <span className="belly">{eaten.length}</span>}
        </div>
      </div>
      <div className="food-tray">
        {r.items.map((it) =>
          eaten.includes(it.id) ? (
            <span key={it.id} className="food gone" />
          ) : (
            <button
              key={it.id}
              className="food"
              aria-label={it.word}
              onPointerDown={(e) =>
                dragGhost(e, {
                  onMove: (x, y) => setOpen(inside(mouth.current, x, y, 30)),
                  onDrop: (x, y) => {
                    setOpen(false);
                    return inside(mouth.current, x, y, 30) ? feed(it) : false;
                  },
                  onTap: () => say(`${it.word}. Drag it to the monster!`, { rate: 1 }),
                })
              }
            >
              {it.e}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
