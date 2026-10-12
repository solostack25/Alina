"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { confetti } from "@/lib/confetti";
import { dragGhost, inside } from "@/lib/drag";
import { store } from "@/lib/util";
import type { GameProps } from "../types";

/**
 * Sticker Book: four scenes from the Super Alina & Super Liyana stories, each with its own stickers,
 * plus the girls' superhero stickers that work in every scene. Art lives in /public/scenes and /public/stickers.
 * Stickers are bought with stars; placed stickers are saved per girl and per scene.
 */

type SceneId = "starry-night" | "bubble-plaza" | "rainbow" | "birthday";
type Group = SceneId | "heroes";

const SCENES: { id: SceneId; label: string; story: string }[] = [
  { id: "starry-night", label: "Starry Night", story: "the missing stars" },
  { id: "bubble-plaza", label: "Bubble Plaza", story: "the bubble trouble" },
  { id: "rainbow", label: "Rainbow Park", story: "the grumpy cloud" },
  { id: "birthday", label: "Birthday Party", story: "the birthday wish" },
];

// [id, name she hears, price in stars, which scene's tray, size on the page (% of scene width)]
const STICKERS: [string, string, number, Group, number][] = [
  ["dragon-happy", "happy dragon", 0, "starry-night", 15],
  ["dragon-sad", "little dragon", 2, "starry-night", 15],
  ["moon", "moon", 2, "starry-night", 13],
  ["star", "golden star", 1, "starry-night", 11],
  ["star-swirl", "shooting star", 2, "starry-night", 13],
  ["heart-swirl", "heart magic", 2, "starry-night", 13],

  ["heart-bubble", "heart bubble", 0, "bubble-plaza", 12],
  ["heart-bubble-small", "little heart bubble", 1, "bubble-plaza", 9],
  ["bubbles", "bubbles", 1, "bubble-plaza", 12],
  ["bubble-wand", "bubble wand", 3, "bubble-plaza", 22],
  ["flower-bubble", "flower bubble", 3, "bubble-plaza", 14],
  ["cake-bubble", "cake bubble", 3, "bubble-plaza", 13],
  ["bike-bubble", "bike bubble", 3, "bubble-plaza", 13],
  ["mayor-bubble", "the mayor", 4, "bubble-plaza", 14],

  ["cloud-happy", "happy cloud", 0, "rainbow", 15],
  ["cloud-grumpy", "grumpy cloud", 2, "rainbow", 15],
  ["rainbow", "rainbow", 2, "rainbow", 18],
  ["flowers", "flowers", 1, "rainbow", 11],

  ["balloons", "balloons", 0, "birthday", 12],
  ["gift-pink", "pink present", 1, "birthday", 10],
  ["gift-purple", "purple present", 1, "birthday", 10],
  ["gift-stack", "pile of presents", 2, "birthday", 13],
  ["tiara", "tiara", 2, "birthday", 11],
  ["confetti", "confetti", 1, "birthday", 11],
  ["fireworks", "fireworks", 2, "birthday", 13],
  ["robot-happy", "Birthday Bot", 3, "birthday", 14],
  ["robot-wow", "surprised Birthday Bot", 3, "birthday", 12],
  ["cake-4", "birthday cake", 4, "birthday", 14],

  ["alina-power", "Super Alina", 2, "heroes", 13],
  ["alina-fly", "Super Alina flying", 3, "heroes", 17],
  ["alina-wave", "Super Alina waving", 2, "heroes", 10],
  ["alina-jump", "Super Alina jumping", 3, "heroes", 11],
  ["liyana-hearts", "Super Liyana", 2, "heroes", 14],
  ["liyana-fly", "Super Liyana flying", 3, "heroes", 17],
  ["liyana-wave", "Super Liyana waving", 2, "heroes", 11],
  ["liyana-cheer", "Super Liyana cheering", 3, "heroes", 11],
  ["sister-hug", "super sister hug", 4, "heroes", 15],
  ["super-team", "super team", 5, "heroes", 20],
];
const byId = Object.fromEntries(STICKERS.map((s) => [s[0], s]));

type Placed = { id: number; sid: string; x: number; y: number };

export default function Stickers({ ask, spend, stars, player, name }: GameProps) {
  // Each girl starts with her own superhero sticker plus one free sticker per scene.
  const starter = [player === "big" ? "alina-power" : "liyana-hearts", ...STICKERS.filter((s) => s[2] === 0).map((s) => s[0])];
  const [owned, setOwned] = useState<string[]>(starter);
  const [scene, setScene] = useState<SceneId>("starry-night");
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [fresh, setFresh] = useState<number | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const [overTrash, setOverTrash] = useState(false);

  const ownedKey = `stickers2:${player}`;
  const placedKey = (s: SceneId) => `placed2:${player}:${s}`;

  useEffect(() => {
    setOwned(Array.from(new Set([...starter, ...store.get<string[]>(ownedKey, [])])));
    setPlaced(store.get(placedKey("starry-night"), []));
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
    trayRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    const sc = SCENES.find((x) => x.id === s)!;
    say(`${sc.label}, from ${sc.story}!`);
  };

  const buy = (sid: string) => {
    const [, word, price] = byId[sid];
    if (!spend(price)) {
      sfx.boop();
      say(`The ${word} sticker costs ${price} stars. You have ${stars}. Play games to earn more stars!`);
      return;
    }
    const next = [...owned, sid];
    setOwned(next);
    store.set(ownedKey, next);
    sfx.yay();
    confetti(60);
    say(`You got the ${word} sticker!`);
  };

  const stick = (sid: string) => {
    const p: Placed = { id: Date.now(), sid, x: 20 + Math.random() * 60, y: 30 + Math.random() * 40 };
    sfx.pop();
    setFresh(p.id);
    savePlaced([...placed, p]);
    say(`${byId[sid][1]}! Drag it anywhere.`);
  };

  const dropOnScene = (x: number, y: number, update: (pos: { x: number; y: number }) => void) => {
    const r = sceneRef.current!.getBoundingClientRect();
    if (!inside(sceneRef.current, x, y)) return false;
    update({ x: ((x - r.left) / r.width) * 100, y: ((y - r.top) / r.height) * 100 });
    return true;
  };

  const tray = [...STICKERS.filter((s) => s[3] === scene), ...STICKERS.filter((s) => s[3] === "heroes")];

  return (
    <div className="stage split stickerbook">
      <div className="scene-tabs">
        {SCENES.map((s) => (
          <button key={s.id} className={`scene-tab photo${scene === s.id ? " on" : ""}`} onClick={() => switchScene(s.id)} aria-label={s.label}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/scenes/${s.id}-thumb.webp`} alt="" />
            {s.label}
          </button>
        ))}
      </div>
      <div className="scene photo" ref={sceneRef} style={{ backgroundImage: `url(/scenes/${scene}.webp)` }}>
        {placed.map((p) => {
          const st = byId[p.sid];
          if (!st) return null;
          return (
            <div
              key={p.id}
              className={`placed img${fresh === p.id ? " fresh" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${st[4]}%` }}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${p.sid}.webp`} alt={st[1]} draggable={false} />
            </div>
          );
        })}
        <div className={`trash${overTrash ? " over" : ""}`} ref={trashRef} aria-label="Drag here to remove">
          🗑️
        </div>
      </div>
      <div className="tray-row" role="list" ref={trayRef}>
        {tray.map(([sid, word, price, group], i) => {
          const have = owned.includes(sid);
          return (
            <button
              key={sid}
              role="listitem"
              className={`sticker img${have ? "" : " locked"}${!have && price <= stars ? " affordable" : ""}${group === "heroes" && tray[i - 1]?.[3] !== "heroes" ? " first-hero" : ""}`}
              aria-label={have ? word : `${word}, ${price} stars`}
              onClick={() => (have ? stick(sid) : buy(sid))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${sid}.webp`} alt="" draggable={false} loading="lazy" />
              {!have && <span className="price">⭐{price}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
