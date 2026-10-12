// Original read-along stories, written with short sight-word sentences for early readers.
// "{name}" is the reader's name; "{alina}" is always the birthday girl (the big-sister player); "{liyana}" her little sister.

export type Page = { art: string; bg: string; text: string; heroes?: ("a" | "l")[]; dark?: boolean; /** full illustration for the page */ img?: string };
export type Story = { id: string; title: string; cover: string; color: string; pages: Page[]; series?: "super"; coverImg?: string };

export const STORIES: Story[] = [
  {
    id: "birthday",
    title: "{alina}'s Big Day",
    cover: "🎂",
    color: "#ff5d8f",
    pages: [
      { art: "☀️🛏️", bg: "#ffe7a3", text: "The sun is up. It is a big day!" },
      { art: "🎈🎈🎈", bg: "#ffd6e5", text: "Today {alina} is four. Pop, pop, pop go the balloons!" },
      { art: "🦉🎁", bg: "#e4dbff", text: "Pip the owl has a gift. What can it be?" },
      { art: "📚✨", bg: "#d7f3ff", text: "It is a book! A book for a big girl." },
      { art: "🎂🕯️🕯️🕯️🕯️", bg: "#fff1d6", text: "One, two, three, four candles. Make a wish, {alina}!" },
      { art: "🥳💕", bg: "#ffe0ec", text: "Happy birthday, {alina}! We love you." },
    ],
  },
];

export const fill = (s: string, name: string, alina = "Alina", liyana = "Liyana") =>
  s.replaceAll("{name}", name || "you").replaceAll("{alina}", alina || "Alina").replaceAll("{liyana}", liyana || "Liyana");
