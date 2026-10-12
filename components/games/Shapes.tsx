"use client";

import { useEffect, useState, type ReactNode } from "react";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { pick, shuffle, wobble } from "@/lib/util";
import type { GameProps } from "../types";

const SHAPES: Record<string, ReactNode> = {
  circle: <circle cx="50" cy="50" r="44" />,
  square: <rect x="8" y="8" width="84" height="84" rx="6" />,
  triangle: <path d="M50 6 L94 90 L6 90 Z" strokeLinejoin="round" />,
  star: <path d="M50 5 L61 37 L95 38 L68 58 L78 92 L50 72 L22 92 L32 58 L5 38 L39 37 Z" />,
  heart: <path d="M50 90 C10 62 4 40 14 24 C24 8 44 10 50 28 C56 10 76 8 86 24 C96 40 90 62 50 90 Z" />,
  // Unlocked after 20 stars:
  diamond: <path d="M50 4 L94 50 L50 96 L6 50 Z" />,
  rectangle: <rect x="4" y="24" width="92" height="52" rx="6" />,
  oval: <ellipse cx="50" cy="50" rx="46" ry="30" />,
};

const FILLS = ["#ff5d8f", "#3a8dff", "#3ccf91", "#9b6bff", "#ff8a3d", "#ffc93c"];

type Round = { target: string; options: { shape: string; fill: string }[] };

export default function Shapes({ ask, win, stars }: GameProps) {
  const [round, setRound] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);

  const start = () => {
    const pool = Object.keys(SHAPES).slice(0, stars > 20 ? 8 : 5);
    const opts = shuffle(pool).slice(0, 3);
    const fills = shuffle(FILLS);
    const target = pick(opts);
    setRound({ target, options: opts.map((shape, i) => ({ shape, fill: fills[i] })) });
    setSolved(false);
    ask(`Find the ${target}!`, `Can you find the ${target}?`);
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) return <div className="stage" />;

  const choose = (shape: string, el: HTMLElement) => {
    if (solved) return;
    if (shape === round.target) {
      setSolved(true);
      win(`That's the ${shape}`);
      afterSpeech(start, 1200);
    } else {
      wobble(el);
      sfx.boop();
      say(`That's a ${shape}. Find the ${round.target}!`);
    }
  };

  return (
    <div className="stage">
      <div className="choices" key={round.target + round.options.map((o) => o.shape).join()}>
        {round.options.map(({ shape, fill }) => (
          <button
            key={shape}
            className={`card${solved && shape === round.target ? " right" : ""}`}
            aria-label={shape}
            onClick={(e) => choose(shape, e.currentTarget)}
          >
            <svg className="shape" viewBox="0 0 100 100" fill={fill} stroke={fill} strokeWidth={4}>
              {SHAPES[shape]}
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
