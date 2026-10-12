"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import type { GameProps } from "../types";

const PADS = [
  { name: "red", hex: "#ff4d5e", note: 330 },
  { name: "blue", hex: "#3a8dff", note: 392 },
  { name: "yellow", hex: "#ffd43b", note: 494 },
  { name: "green", hex: "#3ccf91", note: 587 },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Simon({ ask, win, miss, level }: GameProps) {
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<"watch" | "play">("watch");
  const seq = useRef<number[]>([]);
  const pos = useRef(0);
  const alive = useRef(true);
  const run = useRef(0); // only the newest playback keeps going

  // Starting length grows with level: 2, 3, 4, ...
  const startLen = 1 + level;

  const show = async () => {
    const me = ++run.current;
    const ok = () => alive.current && run.current === me;
    setPhase("watch");
    ask("Watch!", "Watch and listen!");
    await wait(1300);
    if (!ok()) return;
    // Gets a bit faster as the sequence grows.
    const step = Math.max(380, 700 - seq.current.length * 35);
    for (const i of seq.current) {
      if (!ok()) return;
      setLit(i);
      sfx.note(PADS[i].note, step / 1000);
      await wait(step);
      setLit(null);
      await wait(160);
    }
    if (!ok()) return;
    pos.current = 0;
    setPhase("play");
    ask("Your turn!", "Your turn! Copy me.");
  };

  const newGame = () => {
    seq.current = Array.from({ length: startLen }, () => Math.floor(Math.random() * 4));
    void show();
  };

  useEffect(() => {
    alive.current = true;
    newGame();
    return () => {
      alive.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const press = (i: number) => {
    if (phase !== "play") return;
    sfx.note(PADS[i].note, 0.25);
    setLit(i);
    setTimeout(() => setLit((l) => (l === i ? null : l)), 220);

    if (seq.current[pos.current] !== i) {
      miss();
      setPhase("watch");
      say("Oops! Let's watch again.");
      setTimeout(() => alive.current && void show(), 1200);
      return;
    }
    pos.current++;
    if (pos.current === seq.current.length) {
      setPhase("watch");
      win(`You remembered ${seq.current.length}`);
      seq.current = [...seq.current, Math.floor(Math.random() * 4)];
      setTimeout(() => alive.current && void show(), 2400);
    }
  };

  return (
    <div className="stage">
      <div className={`simon simon-${phase}`}>
        {PADS.map((p, i) => (
          <button
            key={p.name}
            className={`pad${lit === i ? " lit" : ""}`}
            style={{ ["--pad" as string]: p.hex }}
            aria-label={p.name}
            onClick={() => press(i)}
          />
        ))}
        <div className="simon-count" aria-label={`Sequence length ${seq.current.length}`}>
          {seq.current.length}
        </div>
      </div>
    </div>
  );
}
