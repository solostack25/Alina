import type { Player } from "@/components/types";

// The girls as superheroes. Art lives in /public/heroes (cut from the family's illustration).
export const HEROES: Record<Player, { face: string; hero: string; power: "stars" | "hearts"; burst: string[]; color: string }> = {
  big: {
    face: "/heroes/alina-face.webp",
    hero: "/heroes/alina-hero.webp",
    power: "stars",
    burst: ["⭐", "🌟", "✨"],
    color: "#ffc93c",
  },
  little: {
    face: "/heroes/liyana-face.webp",
    hero: "/heroes/liyana-hero.webp",
    power: "hearts",
    burst: ["💖", "💗", "💕"],
    color: "#ff5d8f",
  },
};
