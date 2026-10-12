"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { pick, wobble } from "@/lib/util";
import type { GameProps } from "../types";

const COLORS = [
  { name: "red", hex: "#ff4d5e" },
  { name: "blue", hex: "#3a8dff" },
  { name: "yellow", hex: "#ffd43b" },
  { name: "green", hex: "#3ccf91" },
  { name: "purple", hex: "#9b6bff" },
  { name: "orange", hex: "#ff8a3d" },
  { name: "pink", hex: "#ff8fc7" },
] as const;

type Color = (typeof COLORS)[number];
type Balloon = { id: number; color: Color; left: number; dur: number; popped: boolean };

export default function Balloons({ ask, win }: GameProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const target = useRef<Color>(COLORS[0]);
  const popped = useRef(0);
  const nextId = useRef(0);

  const newTarget = () => {
    target.current = pick(COLORS);
    const t = target.current;
    ask(`Pop ${t.name}!`, `Pop the ${t.name} balloon!`, { bg: t.hex, fg: t.name === "yellow" ? "#2b2350" : "#fff" });
  };

  const spawn = (forceTarget: boolean) => {
    const color = forceTarget ? target.current : pick(COLORS);
    setBalloons((bs) => [
      ...bs,
      { id: nextId.current++, color, left: 4 + Math.random() * 78, dur: 7 + Math.random() * 4, popped: false },
    ]);
  };

  useEffect(() => {
    newTarget();
    spawn(true);
    let n = 0;
    const iv = setInterval(() => {
      n++;
      spawn(n % 2 === 0);
    }, 900);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = (b: Balloon, el: HTMLElement) => {
    if (b.popped) return;
    const t = target.current;
    if (b.color.name === t.name) {
      sfx.pop();
      setBalloons((bs) => bs.map((x) => (x.id === b.id ? { ...x, popped: true } : x)));
      setTimeout(() => setBalloons((bs) => bs.filter((x) => x.id !== b.id)), 300);
      popped.current++;
      if (popped.current % 3 === 0) {
        win(`You popped ${popped.current} balloons`);
        setTimeout(newTarget, 1600);
      } else say(pick(["Pop!", "Yes!", `${b.color.name}!`, "Good!"]));
    } else {
      wobble(el);
      sfx.boop();
      say(`That one is ${b.color.name}. Find ${t.name}!`);
    }
  };

  return (
    <div className="stage">
      {balloons.map((b) => (
        <button
          key={b.id}
          className={`balloon${b.popped ? " pop" : ""}`}
          aria-label={`${b.color.name} balloon`}
          style={{ background: b.color.hex, left: `${b.left}%`, animationDuration: `${b.dur}s` }}
          onClick={(e) => tap(b, e.currentTarget)}
          onAnimationEnd={(e) => {
            if (e.animationName === "rise") setBalloons((bs) => bs.filter((x) => x.id !== b.id));
          }}
        />
      ))}
    </div>
  );
}
