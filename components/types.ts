export type Player = "big" | "little";

/** Little sister's games (simple, no levels). */
export type LittleGame = "balloons" | "count" | "letters" | "shapes";
/** Alina's games (harder, they level up). */
export type BigGame = "memory" | "simon" | "spell" | "math" | "patterns" | "odd" | "feed" | "puzzle";
/** Things both girls can do. */
export type Activity = "stickers" | "stories" | "coloring";
/** Superhero game both girls play (levels up for Alina). */
export type HeroGame = "catch" | "bots";
export type GameId = LittleGame | BigGame | Activity | HeroGame;

export type GameProps = {
  /** Show a short prompt in the bubble and say the longer spoken version. */
  ask: (text: string, spoken?: string, color?: { bg: string; fg: string }) => void;
  /** Celebrate a finished round: confetti, cheer, a star, optional spoken line. Counts toward leveling up. */
  win: (spoken?: string) => void;
  /** A wrong answer. Resets the level-up streak. */
  miss: () => void;
  /** Spend stars (sticker shop). Returns false if there aren't enough. */
  spend: (n: number) => boolean;
  stars: number;
  name: string;
  player: Player;
  /** 1-based difficulty for leveled games. */
  level: number;
};
