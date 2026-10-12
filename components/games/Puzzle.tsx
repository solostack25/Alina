"use client";

import { useEffect, useRef, useState } from "react";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { dragGhost } from "@/lib/drag";
import { pick, shuffle } from "@/lib/util";
import type { GameProps } from "../types";

// Each picture is painted on a canvas: a sky-to-ground scene with a big hero and a few extras.
const PICTURES = [
  { name: "lion", sky: ["#ffd88a", "#ffb067"], ground: "#e0a84f", hero: "🦁", extras: ["🌳", "☀️", "🦒"] },
  { name: "rocket", sky: ["#1d1650", "#4b36b8"], ground: "#6b5fa8", hero: "🚀", extras: ["🌙", "⭐", "🪐"] },
  { name: "whale", sky: ["#7fd3ff", "#2f86e6"], ground: "#f3d28c", hero: "🐳", extras: ["🐠", "🐙", "🐚"] },
  { name: "unicorn", sky: ["#ffd1ea", "#c7b6ff"], ground: "#9ce3b8", hero: "🦄", extras: ["🌈", "☁️", "🌸"] },
  { name: "train", sky: ["#bfe6ff", "#e9f7ff"], ground: "#78c46a", hero: "🚂", extras: ["⛰️", "☁️", "🌻"] },
  { name: "panda", sky: ["#d9f7c9", "#9edc8a"], ground: "#6fae5a", hero: "🐼", extras: ["🎋", "🦋", "🌼"] },
];

// Level 1: 2x2 with a faint guide picture. Level 2: 3x2. Level 3: 3x3, no guide.
const GRIDS = [
  { cols: 2, rows: 2, guide: true },
  { cols: 3, rows: 2, guide: true },
  { cols: 3, rows: 3, guide: false },
];

const W = 600;
const H = 450;

function paint(pic: (typeof PICTURES)[number]) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, pic.sky[0]);
  sky.addColorStop(1, pic.sky[1]);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  g.fillStyle = pic.ground;
  g.beginPath();
  g.moveTo(0, H * 0.74);
  g.quadraticCurveTo(W * 0.5, H * 0.62, W, H * 0.76);
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.fill();
  g.textAlign = "center";
  g.textBaseline = "middle";
  const emoji = (e: string, x: number, y: number, size: number) => {
    g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.fillText(e, x, y);
  };
  emoji(pic.extras[0], W * 0.15, H * 0.62, 110);
  emoji(pic.extras[1], W * 0.84, H * 0.18, 90);
  emoji(pic.extras[2], W * 0.84, H * 0.72, 80);
  emoji(pic.hero, W * 0.48, H * 0.52, 230);
  return c;
}

type Piece = { idx: number; url: string };

export default function Puzzle({ ask, win, miss, level }: GameProps) {
  const [grid, setGrid] = useState(GRIDS[0]);
  const [full, setFull] = useState("");
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const board = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const start = () => {
    const gr = GRIDS[Math.min(level, GRIDS.length) - 1];
    const pic = pick(PICTURES.filter((p) => p.name !== name));
    const canvas = paint(pic);
    const pw = W / gr.cols;
    const ph = H / gr.rows;
    const ps: Piece[] = [];
    for (let r = 0; r < gr.rows; r++)
      for (let c = 0; c < gr.cols; c++) {
        const pc = document.createElement("canvas");
        pc.width = pw;
        pc.height = ph;
        pc.getContext("2d")!.drawImage(canvas, c * pw, r * ph, pw, ph, 0, 0, pw, ph);
        ps.push({ idx: r * gr.cols + c, url: pc.toDataURL() });
      }
    setGrid(gr);
    setFull(canvas.toDataURL());
    setPieces(shuffle(ps));
    setPlaced({});
    setName(pic.name);
    done.current = false;
    ask("Puzzle!", `Let's make a puzzle! Drag the pieces onto the board.`);
  };

  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps

  const drop = (p: Piece, x: number, y: number) => {
    const el = board.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
    const col = Math.floor(((x - r.left) / r.width) * grid.cols);
    const row = Math.floor(((y - r.top) / r.height) * grid.rows);
    const slot = row * grid.cols + col;
    if (slot !== p.idx || placed[slot]) {
      sfx.boop();
      miss();
      say("Not there. Look at the picture!");
      return false;
    }
    sfx.pop();
    const next = { ...placed, [slot]: p.url };
    setPlaced(next);
    if (Object.keys(next).length === grid.cols * grid.rows && !done.current) {
      done.current = true;
      setTimeout(() => {
        win(`You made the ${name}`);
        afterSpeech(start, 1500);
      }, 400);
    } else say(pick(["Click!", "It fits!", "Yes!", "Good!"]), { rate: 1 });
    return true;
  };

  const remaining = pieces.filter((p) => !placed[p.idx]);

  return (
    <div className="stage puzzle-stage">
      <div
        ref={board}
        className={`board${Object.keys(placed).length === grid.cols * grid.rows ? " complete" : ""}`}
        style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, gridTemplateRows: `repeat(${grid.rows}, 1fr)` }}
      >
        {grid.guide && full && <img className="guide" src={full} alt="" />}
        {Array.from({ length: grid.cols * grid.rows }, (_, i) => (
          <div key={i} className="slot-cell">
            {placed[i] && <img src={placed[i]} alt="" className="snap" />}
          </div>
        ))}
      </div>
      <div className="piece-tray">
        {remaining.map((p) => (
          <button
            key={p.idx + name}
            className="piece"
            style={{ aspectRatio: `${W / grid.cols} / ${H / grid.rows}` }}
            aria-label="Puzzle piece"
            onPointerDown={(e) => dragGhost(e, { onDrop: (x, y) => drop(p, x, y), onTap: () => say("Drag me to the board!") })}
          >
            <img src={p.url} alt="" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
}
