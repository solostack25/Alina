"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { shuffle, wobble } from "@/lib/util";
import { LETTERS as ALL } from "@/lib/letters";
import type { GameProps } from "../types";


// X starts with a different sound than its name (box), so it is left out of this game.
const LETTERS = Object.fromEntries(Object.entries(ALL).filter(([k]) => k !== "X"));

type Choice = { emoji: string; word: string; ok: boolean };
type Round = { letter: string; sound: string; word: string; choices: Choice[] };

export default function Letters({ ask, win, name }: GameProps) {
  const pool = useRef<string[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);

  const start = () => {
    if (!pool.current.length) pool.current = shuffle(Object.keys(LETTERS));
    // Sometimes show the first letter of her name.
    const first = name ? name[0].toUpperCase() : "";
    if (LETTERS[first] && Math.random() < 0.25) pool.current.unshift(first);
    const letter = pool.current.shift()!;
    const [sound, [emoji, word]] = LETTERS[letter];
    const others = shuffle(Object.keys(LETTERS).filter((k) => k !== letter && LETTERS[k][0] !== sound))
      .slice(0, 2)
      .map((k) => ({ emoji: LETTERS[k][1][0], word: LETTERS[k][1][1], ok: false }));
    setRound({ letter, sound, word, choices: shuffle([{ emoji, word, ok: true }, ...others]) });
    setSolved(false);
    const isHers = letter === first;
    ask(
      `${letter} says ${sound}`,
      `This is the letter ${letter}.${isHers ? ` ${name} starts with ${letter}!` : ""} ${letter} says ${sound}. ${sound}. Which one starts with ${sound}?`,
    );
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) return <div className="stage" />;
  const { letter, sound } = round;

  const choose = (c: Choice, el: HTMLElement) => {
    if (solved) return;
    if (c.ok) {
      setSolved(true);
      win(`${c.word}! ${sound}, ${c.word}. ${letter} is for ${c.word}`);
      setTimeout(start, 3200);
    } else {
      wobble(el);
      sfx.boop();
      say(`That's ${c.word}. Listen: ${sound}. Try again!`);
    }
  };

  return (
    <div className="stage split" key={letter}>
      <div className="top">
        <button className="letter" aria-label="Hear the letter again" onClick={() => say(`${letter}. ${sound}. ${sound}.`)}>
          {letter}
          <small>{letter.toLowerCase()}</small>
        </button>
      </div>
      <div className="choices grow">
        {round.choices.map((c) => (
          <button
            key={c.word}
            className={`card${solved && c.ok ? " right" : ""}`}
            aria-label={c.word}
            onClick={(e) => choose(c, e.currentTarget)}
          >
            {c.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
