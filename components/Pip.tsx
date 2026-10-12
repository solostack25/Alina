"use client";

import { useEffect, useState } from "react";
import { onSpeaking } from "@/lib/voice";

/**
 * Pip: the app's own guide character, a round little night owl.
 * Blinks on his own and moves his beak whenever the app is talking.
 */
export default function Pip({ size = 120, mood = "happy", className = "" }: { size?: number; mood?: "happy" | "wow"; className?: string }) {
  const [talking, setTalking] = useState(false);
  const [blink, setBlink] = useState(false);
  const [mouth, setMouth] = useState(false);

  useEffect(() => onSpeaking(setTalking), []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2200 + Math.random() * 2800);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!talking) {
      setMouth(false);
      return;
    }
    const iv = setInterval(() => setMouth((m) => !m), 150);
    return () => clearInterval(iv);
  }, [talking]);

  const eyeH = blink ? 1.5 : 13;
  return (
    <svg
      className={`pip ${talking ? "talking" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Pip the owl"
    >
      {/* ear tufts */}
      <path d="M26 30 L22 8 L44 22 Z" fill="#7b5cf0" />
      <path d="M94 30 L98 8 L76 22 Z" fill="#7b5cf0" />
      {/* body */}
      <ellipse cx="60" cy="66" rx="44" ry="46" fill="#8f6bff" />
      <ellipse cx="60" cy="82" rx="28" ry="26" fill="#d9ccff" />
      {/* belly feathers */}
      <path d="M46 78 q4 5 8 0 q4 5 8 0 q4 5 8 0" stroke="#b7a3ff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 90 q4 5 8 0 q4 5 8 0" stroke="#b7a3ff" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* wings */}
      <path className="wing l" d="M17 60 q-10 22 8 38 q6-20 0-38 Z" fill="#7b5cf0" />
      <path className="wing r" d="M103 60 q10 22 -8 38 q-6-20 0-38 Z" fill="#7b5cf0" />
      {/* eyes */}
      <circle cx="42" cy="48" r="17" fill="#fff" />
      <circle cx="78" cy="48" r="17" fill="#fff" />
      <ellipse cx="44" cy="49" rx="8" ry={eyeH / 2 + 1} fill="#2b2350" />
      <ellipse cx="80" cy="49" rx="8" ry={eyeH / 2 + 1} fill="#2b2350" />
      {!blink && (
        <>
          <circle cx="47" cy="45" r="2.6" fill="#fff" />
          <circle cx="83" cy="45" r="2.6" fill="#fff" />
        </>
      )}
      {/* cheeks */}
      <circle cx="28" cy="64" r="5" fill="#ff8fb1" opacity=".7" />
      <circle cx="92" cy="64" r="5" fill="#ff8fb1" opacity=".7" />
      {/* beak: opens while talking */}
      {mouth || mood === "wow" ? (
        <>
          <path d="M52 60 L68 60 L60 66 Z" fill="#ffb02e" />
          <path d="M53 64 L67 64 L60 74 Z" fill="#ff8a3d" />
        </>
      ) : (
        <path d="M52 60 L68 60 L60 71 Z" fill="#ffb02e" />
      )}
      {/* feet */}
      <path d="M46 110 l-4 6 M50 110 v7 M54 110 l4 6" stroke="#ffb02e" strokeWidth="4" strokeLinecap="round" />
      <path d="M66 110 l-4 6 M70 110 v7 M74 110 l4 6" stroke="#ffb02e" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
