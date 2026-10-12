"use client";

import { HEROES } from "@/lib/heroes";
import type { Player } from "./types";

/** Her superhero swoops in from the side with a burst of her power when she gets one right. */
export default function HeroSwoop({ player, id, big }: { player: Player; id: number; big?: boolean }) {
  const h = HEROES[player];
  const side = id % 2 === 0 ? "right" : "left";
  return (
    <div key={id} className={`swoop ${side}${big ? " big" : ""}`} aria-hidden>
      <div className="swoop-burst">
        {Array.from({ length: big ? 14 : 9 }, (_, i) => (
          <span key={i} style={{ ["--a" as string]: `${(360 / (big ? 14 : 9)) * i}deg`, ["--d" as string]: `${i * 0.03}s` }}>
            {h.burst[i % h.burst.length]}
          </span>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={h.hero} alt="" draggable={false} />
    </div>
  );
}
