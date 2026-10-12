"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Paint-bucket coloring for the superhero pages.
 * Each page ships two images made from the family's illustration:
 *   <id>-lines.png    the outlines she sees
 *   <id>-regions.png  every fillable area, with its number packed into the red+green channels (0 = a line)
 * Tapping looks up the area under her finger and fills every pixel of it.
 */
export type PicturePage = { id: string; label: string; w: number; h: number };

type Props = {
  page: PicturePage;
  fills: Record<string, string>;
  onFill: (regionId: number) => void;
};

const hexToRGB = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

export default function PictureCanvas({ page, fills, onFill }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ids = useRef<Uint16Array | null>(null);
  const [ready, setReady] = useState(false);

  // Load the region map once per page.
  useEffect(() => {
    setReady(false);
    ids.current = null;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = page.w;
      c.height = page.h;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, page.w, page.h).data;
      const map = new Uint16Array(page.w * page.h);
      for (let i = 0, p = 0; i < map.length; i++, p += 4) map[i] = d[p] | (d[p + 1] << 8);
      ids.current = map;
      setReady(true);
    };
    img.src = `/coloring/${page.id}-regions.png`;
  }, [page.id, page.w, page.h]);

  // Repaint the color layer whenever her fills change.
  useEffect(() => {
    const map = ids.current;
    const cv = canvas.current;
    if (!ready || !map || !cv) return;
    const g = cv.getContext("2d")!;
    const out = g.createImageData(page.w, page.h);
    const o = out.data;
    let maxId = 0;
    for (let i = 0; i < map.length; i++) if (map[i] > maxId) maxId = map[i];
    const lut = new Uint8Array((maxId + 1) * 3).fill(255);
    for (const [k, hex] of Object.entries(fills)) {
      const id = Number(k);
      if (id > 0 && id <= maxId) lut.set(hexToRGB(hex), id * 3);
    }
    for (let i = 0, p = 0; i < map.length; i++, p += 4) {
      const id = map[i] * 3;
      o[p] = lut[id];
      o[p + 1] = lut[id + 1];
      o[p + 2] = lut[id + 2];
      o[p + 3] = 255;
    }
    g.putImageData(out, 0, 0);
  }, [ready, fills, page.w, page.h]);

  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    const map = ids.current;
    if (!map) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * page.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * page.h);
    // If she taps right on a line, use the nearest area instead.
    for (let rad = 0; rad <= 10; rad += 2) {
      for (let dy = -rad; dy <= rad; dy += 2)
        for (let dx = -rad; dx <= rad; dx += 2) {
          const px = x + dx;
          const py = y + dy;
          if (px < 0 || py < 0 || px >= page.w || py >= page.h) continue;
          const id = map[py * page.w + px];
          if (id) return onFill(id);
        }
    }
  };

  return (
    <div className="picture" style={{ aspectRatio: `${page.w} / ${page.h}` }} onPointerDown={tap}>
      <canvas ref={canvas} width={page.w} height={page.h} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/coloring/${page.id}-lines.png`} alt={page.label} draggable={false} />
      {!ready && <span className="picture-loading">🖍️</span>}
    </div>
  );
}
