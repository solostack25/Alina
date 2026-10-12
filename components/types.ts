export type GameId = "balloons" | "count" | "letters" | "shapes";

export type GameProps = {
  /** Show a short prompt in the bubble and say the longer spoken version. */
  ask: (text: string, spoken?: string, color?: { bg: string; fg: string }) => void;
  /** Celebrate a right answer: confetti, cheer, a star, and optional spoken line. */
  win: (spoken?: string) => void;
  stars: number;
  name: string;
};
