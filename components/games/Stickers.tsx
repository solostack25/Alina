"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { confetti } from "@/lib/confetti";
import { dragGhost, inside } from "@/lib/drag";
import { store } from "@/lib/util";
import type { GameProps } from "../types";

// [sticker, name, price in stars]
const CATALOG: [string, string, number][] = [
  ["🌸", "flower", 1], ["🦋", "butterfly", 2], ["🐞", "ladybug", 2], ["🌈", "rainbow", 3], ["🐰", "bunny", 3], ["🌳", "tree", 2],
  ["🐠", "fish", 2], ["🐙", "octopus", 3], ["🐳", "whale", 4], ["🧜‍♀️", "mermaid", 6], ["🐚", "shell", 1], ["🦀", "crab", 2],
  ["🚀", "rocket", 4], ["🪐", "planet", 3], ["⭐", "star", 1], ["👽", "alien", 4], ["🌙", "moon", 2], ["☄️", "comet", 3],
  ["🦄", "unicorn", 6], ["👑", "crown", 5], ["🎂", "birthday cake", 3], ["🐶", "puppy", 3], ["🐱", "kitty", 3], ["🦁", "lion", 4],
];

const SCENES = [
  { id: "garden", label: "Garden", icon: "🌻" },
  { id: "ocean", label: "Ocean", icon: "🌊" },
  { id: "space", label: "Space", icon: "🌌" },
] as const;
type SceneId = (typeof SCENES)[number]["id"];

type Placed = { id: number; e: string; x: number; y: number; s: number };

export default function Stickers({ ask, spend, stars, player, name }: GameProps) {
  const [owned, setOwned] = useState<string[]>([]);
  const [scene, setScene] = useState<SceneId>("garden");
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [fresh, setFresh] = useState<number | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [overTrash, setOverTrash] = useState(false);

  const placedKey = (s: SceneId) => `placed:${player}:${s}`;

  useEffect(() => {
    setOwned(store.get(`stickers:${player}`, ["🌸", "⭐"]));
    setPlaced(store.get(placedKey("garden"), []));
    ask("Sticker Book", `${name ? name + ", this" : "This"} is your sticker book! Tap a sticker to put it on the picture. Use your stars to get new stickers.`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const savePlaced = (p: Placed[]) => {
    setPlaced(p);
    store.set(placedKey(scene), p);
  };

  const switchScene = (s: SceneId) => {
    sfx.flip();
    setScene(s);
    setPlaced(store.get(placedKey(s), []));
    say(`The ${s}!`);
  };

  const buy = (e: string, word: string, price: number) => {
    if (!spend(price)) {
      sfx.boop();
      say(`The ${word} costs ${price} stars. You have ${stars}. Play games to earn more stars!`);
      return;
    }
    const next = [...owned, e];
    setOwned(next);
    store.set(`stickers:${player}`, next);
    sfx.yay();
    confetti(60);
    say(`You got the ${word} sticker!`);
  };

  const stick = (e: string, word: string) => {
    const p: Placed = { id: Date.now(), e, x: 25 + Math.random() * 50, y: 25 + Math.random() * 45, s: 1 };
    sfx.pop();
    setFresh(p.id);
    savePlaced([...placed, p]);
    say(`${word}! Drag it anywhere.`);
  };

  const dropOnScene = (x: number, y: number, update: (pos: { x: number; y: number }) => void) => {
    const r = sceneRef.current!.getBoundingClientRect();
    if (!inside(sceneRef.current, x, y)) return false;
    update({ x: ((x - r.left) / r.width) * 100, y: ((y - r.top) / r.height) * 100 });
    return true;
  };

  return (
    <div className="stage split stickerbook">
      <div className="scene-tabs">
        {SCENES.map((s) => (
          <button key={s.id} className={`scene-tab${scene === s.id ? " on" : ""}`} onClick={() => switchScene(s.id)} aria-label={s.label}>
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      <div className={`scene ${scene}`} ref={sceneRef}>
        {scene === "garden" && <div className="sun" aria-hidden />}
        {scene === "space" && <div className="planet" aria-hidden />}
        {placed.map((p) => (
          <div
            key={p.id}
            className={`placed${fresh === p.id ? " fresh" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onPointerDown={(e) =>
              dragGhost(e, {
                onMove: (x, y) => setOverTrash(inside(trashRef.current, x, y, 10)),
                onDrop: (x, y) => {
                  setOverTrash(false);
                  if (inside(trashRef.current, x, y, 10)) {
                    sfx.boop();
                    savePlaced(placed.filter((q) => q.id !== p.id));
                    return true;
                  }
                  return dropOnScene(x, y, (pos) => {
                    sfx.pop();
                    savePlaced(placed.map((q) => (q.id === p.id ? { ...q, ...pos } : q)));
                  });
                },
              })
            }
          >
            {p.e}
          </div>
        ))}
        <div className={`trash${overTrash ? " over" : ""}`} ref={trashRef} aria-label="Drag here to remove">
          🗑️
        </div>
      </div>
      <div className="tray-row" role="list">
        {CATALOG.map(([e, word, price]) => {
          const have = owned.includes(e);
          return (
            <button
              key={e}
              role="listitem"
              className={`sticker${have ? "" : " locked"}${!have && price <= stars ? " affordable" : ""}`}
              aria-label={have ? word : `${word}, ${price} stars`}
              onClick={() => (have ? stick(e, word) : buy(e, word, price))}
            >
              <span className="se">{e}</span>
              {!have && <span className="price">⭐{price}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
