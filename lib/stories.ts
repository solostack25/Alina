// Original read-along stories, written with short sight-word sentences for early readers.
// "{name}" is the reader's name; "{alina}" is always the birthday girl (the big-sister player).

export type Page = { art: string; bg: string; text: string };
export type Story = { id: string; title: string; cover: string; color: string; pages: Page[] };

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
  {
    id: "pip-star",
    title: "Pip and the Lost Star",
    cover: "⭐",
    color: "#5b3fd1",
    pages: [
      { art: "🦉🌙", bg: "#2d2470", text: "Pip the owl likes the night sky." },
      { art: "⭐💧", bg: "#2d2470", text: "Oh no! A little star fell down." },
      { art: "🦉⭐", bg: "#3a2f8f", text: "\"I will help you,\" said Pip." },
      { art: "🐸🍃", bg: "#2f5d4d", text: "Pip and the star hop to the frog. \"Can you jump up?\" asked Pip." },
      { art: "🐸💨", bg: "#2f5d4d", text: "The frog can jump, but not that high." },
      { art: "🦉⬆️⭐", bg: "#3a2f8f", text: "Pip can fly! Up, up, up they go." },
      { art: "🌌⭐✨", bg: "#1f1a55", text: "The star is home. It will shine for Pip every night." },
    ],
  },
  {
    id: "red-bus",
    title: "The Big Red Bus",
    cover: "🚌",
    color: "#ff4d5e",
    pages: [
      { art: "🚌", bg: "#ffe2e2", text: "This is a bus. The bus is big and red." },
      { art: "🚌🐶", bg: "#e2f4ff", text: "A dog gets on the bus." },
      { art: "🚌🐶🐱", bg: "#e2f4ff", text: "A cat gets on the bus. Now there are two." },
      { art: "🚌🐶🐱🐷", bg: "#e2f4ff", text: "A pig gets on the bus. Now there are three." },
      { art: "🚌💨", bg: "#fff4cc", text: "Beep, beep! Go, bus, go!" },
      { art: "🏖️🐶🐱🐷", bg: "#ffeec2", text: "They get to the beach. What a fun day!" },
    ],
  },
  {
    id: "colors",
    title: "I See Colors",
    cover: "🌈",
    color: "#3ccf91",
    pages: [
      { art: "🍎", bg: "#ffe1e1", text: "I see red. I see a red apple." },
      { art: "🍊", bg: "#ffe9d4", text: "I see orange. I see an orange orange!" },
      { art: "🍌", bg: "#fff6c9", text: "I see yellow. I see a yellow banana." },
      { art: "🐸", bg: "#dcf8e8", text: "I see green. I see a green frog." },
      { art: "🐳", bg: "#dbeaff", text: "I see blue. I see a blue whale." },
      { art: "🍇", bg: "#ece0ff", text: "I see purple. I see purple grapes." },
      { art: "🌈", bg: "#eaf7ff", text: "I see a rainbow. It has all the colors!" },
    ],
  },
];

export const fill = (s: string, name: string, alina = "Alina") =>
  s.replaceAll("{name}", name || "you").replaceAll("{alina}", alina || "Alina");
