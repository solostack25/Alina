"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { shuffle } from "@/lib/util";
import type { GameProps } from "../types";

const PICS = [
  ["🦄", "unicorn"], ["🐶", "puppy"], ["🐱", "kitty"], ["🦋", "butterfly"], ["🐢", "turtle"], ["🦊", "fox"],
  ["🐼", "panda"], ["🐸", "frog"], ["🦁", "lion"], ["🐧", "penguin"], ["🐬", "dolphin"], ["🦒", "giraffe"],
  ["🍓", "strawberry"], ["🌈", "rainbow"], ["🚀", "rocket"], ["🎂", "cake"],
] as const;

// Level -> number of pairs. 3, 4, 6, 8 pairs (6 to 16 cards).
const PAIRS = [3, 4, 6, 8];

type Card = { id: number; emoji: string; word: string; up: boolean; done: boolean };

export default function Memory({ ask, win, miss, level }: GameProps) {
  const [cards, setCardsState] = useState<Card[]>([]);
  // Mirror of the cards so quick double taps always see the latest flips.
  const cardsRef = useRef<Card[]>([]);
  const setCards = (next: Card[] | ((cs: Card[]) => Card[])) => {
    cardsRef.current = typeof next === "function" ? next(cardsRef.current) : next;
    setCardsState(cardsRef.current);
  };
  const [cols, setCols] = useState(3);
  const busy = useRef(false);
  const open = useRef<number[]>([]);
  const finished = useRef(false);

  const start = () => {
    const pairs = PAIRS[Math.min(level, PAIRS.length) - 1];
    const picks = shuffle(PICS).slice(0, pairs);
    const deck = shuffle(picks.flatMap(([emoji, word]) => [{ emoji, word }, { emoji, word }])).map((c, i) => ({
      ...c, id: i, up: false, done: false,
    }));
    setCols(pairs <= 3 ? 3 : 4);
    setCards(deck);
    open.current = [];
    busy.current = false;
    finished.current = false;
    ask("Find the twins!", `Find the matching pairs! There are ${pairs} pairs.`);
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (c: Card) => {
    if (busy.current || finished.current) return;
    const live = cardsRef.current.find((x) => x.id === c.id);
    if (!live || live.up || live.done) return;
    const next = cardsRef.current.map((x) => (x.id === c.id ? { ...x, up: true } : x));
    sfx.flip();
    say(c.word, { rate: 1 });
    setCards(next);
    open.current.push(c.id);
    if (open.current.length < 2) return;

    const [a, b] = open.current.map((id) => next.find((x) => x.id === id)!);
    open.current = [];
    busy.current = true;
    if (a.emoji === b.emoji) {
      setTimeout(() => {
        sfx.pop();
        const matched = cardsRef.current.map((x) => (x.emoji === a.emoji ? { ...x, done: true } : x));
        setCards(matched);
        busy.current = false;
        if (matched.every((x) => x.done)) {
          finished.current = true;
          win("You found them all");
          setTimeout(start, 2600);
        } else say(`Two ${a.word}s!`);
      }, 450);
    } else {
      miss();
      setTimeout(() => {
        setCards((cs) => cs.map((x) => (x.id === a.id || x.id === b.id ? { ...x, up: false } : x)));
        busy.current = false;
      }, 1100);
    }
  };

  return (
    <div className="stage">
      <div className="memory" style={{ ["--cols" as string]: cols }}>
        {cards.map((c) => (
          <button
            key={c.id + "-" + cards.length}
            className={`mcard${c.up || c.done ? " up" : ""}${c.done ? " done" : ""}`}
            aria-label={c.up || c.done ? c.word : "Hidden card"}
            onClick={() => flip(c)}
          >
            <span className="face back" aria-hidden>
              ★
            </span>
            <span className="face front" aria-hidden>
              {c.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
