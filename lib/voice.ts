// Spoken instructions. Everything in the app is said out loud because Alina is still learning to read.

let voice: SpeechSynthesisVoice | null = null;
let chosenName: string | null = null;

// Joke/sound-effect voices that ship on Apple devices. Never use these for a kids' app.
const NOVELTY =
  /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Junior|Organ|Pipe Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley/i;
// Warm, natural-sounding voices, best first.
const FAVORITES = [/Ava/i, /Zoe/i, /Jenny/i, /Aria/i, /Emma/i, /Michelle/i, /Allison/i, /Samantha/i, /Susan/i, /Google US English/i, /Karen/i, /Serena/i];

function score(v: SpeechSynthesisVoice) {
  if (!/^en/i.test(v.lang) || NOVELTY.test(v.name)) return -1;
  let s = 0;
  if (/Natural|Neural/i.test(v.name)) s += 60; // Edge/Windows online voices: by far the most human
  if (/Premium/i.test(v.name)) s += 50; // Apple downloadable premium voices
  if (/Enhanced/i.test(v.name)) s += 35;
  const fav = FAVORITES.findIndex((re) => re.test(v.name));
  if (fav >= 0) s += 30 - fav;
  if (/^en[-_]US/i.test(v.lang)) s += 8;
  else if (/^en[-_](GB|AU|CA|IE)/i.test(v.lang)) s += 4;
  if (/Male|David|Mark|Guy|Daniel|Tom|Aaron|Arthur/i.test(v.name)) s -= 5; // a softer voice suits Pip
  return s;
}

/** English voices on this device, best-sounding first. */
export function listVoices(): SpeechSynthesisVoice[] {
  try {
    return speechSynthesis
      .getVoices()
      .filter((v) => score(v) >= 0)
      .sort((a, b) => score(b) - score(a));
  } catch {
    return [];
  }
}

function pickVoice() {
  const vs = listVoices();
  voice = (chosenName && vs.find((v) => v.name === chosenName)) || vs[0] || null;
}

export function setVoice(name: string | null) {
  chosenName = name;
  try {
    if (name) localStorage.setItem("voice", name);
    else localStorage.removeItem("voice");
  } catch {
    /* storage blocked */
  }
  pickVoice();
}

export function currentVoiceName() {
  return voice?.name ?? "";
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    chosenName = localStorage.getItem("voice");
  } catch {
    /* storage blocked */
  }
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

// Lets Pip move his mouth while the app is talking.
type Listener = (speaking: boolean) => void;
const listeners = new Set<Listener>();
let pending = 0;
let gen = 0; // bumps on cancel so interrupted lines don't stop the mouth early
function setSpeaking(on: boolean) {
  listeners.forEach((l) => l(on));
}
export function onSpeaking(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export type SayOptions = {
  queue?: boolean;
  rate?: number;
  pitch?: number;
  /** Called with the character index of each word as it is spoken (where the browser supports it). */
  onWord?: (charIndex: number) => void;
  onEnd?: () => void;
};

export function say(text: string, opts: SayOptions = {}) {
  try {
    if (!opts.queue) {
      speechSynthesis.cancel();
      pending = 0;
      gen++;
    }
    const mine = gen;
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    // Natural pitch: raising it makes computer voices sound chipmunky and uncanny.
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.05;
    pending++;
    u.onstart = () => setSpeaking(true);
    const done = () => {
      if (mine === gen) {
        pending = Math.max(0, pending - 1);
        if (!pending) setSpeaking(false);
      }
      opts.onEnd?.();
    };
    u.onend = done;
    u.onerror = done;
    if (opts.onWord) u.onboundary = (e) => e.name !== "sentence" && opts.onWord!(e.charIndex);
    speechSynthesis.speak(u);
  } catch {
    opts.onEnd?.();
  }
}

export function hush() {
  try {
    speechSynthesis.cancel();
    pending = 0;
    gen++;
    setSpeaking(false);
  } catch {
    /* ignore */
  }
}
