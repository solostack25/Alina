// Spoken instructions. Everything in the app is said out loud because Alina is still learning to read.
// Uses the AI voice (app/api/tts) when a voice key is set in Vercel, otherwise the device voice.
import { audioContext } from "./sfx";

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

/** The iPad / browser built-in voice. Used when the AI voice isn't set up or can't be reached. */
function deviceSay(text: string, opts: SayOptions, mine: number) {
  try {
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

// ---------- AI voice (see app/api/tts) ----------
// "unknown" until the first try; "off" when the server says no voice key is configured.
let cloud: "unknown" | "on" | "off" = "unknown";
const buffers = new Map<string, Promise<AudioBuffer>>();
let current: AudioBufferSourceNode | null = null;
let chain: Promise<void> = Promise.resolve();
let wordTimers: ReturnType<typeof setTimeout>[] = [];

export function voiceMode(): "ai" | "device" {
  return cloud === "on" ? "ai" : "device";
}

function getBuffer(ctx: AudioContext, text: string, speed: number) {
  const k = `${speed}|${text}`;
  let p = buffers.get(k);
  if (!p) {
    p = fetch(`/api/tts?t=${encodeURIComponent(text)}&s=${speed}&v=${encodeURIComponent(process.env.NEXT_PUBLIC_TTS_VOICE ?? "default")}`).then(async (res) => {
      if (res.status === 503) cloud = "off";
      if (!res.ok) throw new Error(`tts ${res.status}`);
      cloud = "on";
      return ctx.decodeAudioData(await res.arrayBuffer());
    });
    p.catch(() => buffers.delete(k));
    buffers.set(k, p);
    if (buffers.size > 300) buffers.delete(buffers.keys().next().value!);
  }
  return p;
}

function stopCloud() {
  wordTimers.forEach(clearTimeout);
  wordTimers = [];
  try {
    current?.stop();
  } catch {
    /* already stopped */
  }
  current = null;
}

function playBuffer(ctx: AudioContext, buf: AudioBuffer, text: string, opts: SayOptions, mine: number) {
  return new Promise<void>((resolve) => {
    if (mine !== gen) return resolve();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    current = src;
    setSpeaking(true);
    // Word timing for read-along highlighting: spread the words across the clip by length.
    if (opts.onWord) {
      const words = [...text.matchAll(/\S+/g)].map((m) => ({ i: m.index ?? 0, n: m[0].length + 1 }));
      const total = words.reduce((t, w) => t + w.n, 0) || 1;
      const span = buf.duration * 0.9;
      let at = buf.duration * 0.04;
      for (const w of words) {
        const ci = w.i;
        wordTimers.push(setTimeout(() => mine === gen && opts.onWord!(ci), at * 1000));
        at += (w.n / total) * span;
      }
    }
    src.onended = () => {
      if (current === src) current = null;
      if (mine === gen && !current) setSpeaking(false);
      opts.onEnd?.();
      resolve();
    };
    src.start();
  });
}

export function say(text: string, opts: SayOptions = {}) {
  if (!opts.queue) {
    try {
      speechSynthesis.cancel();
    } catch {
      /* no device speech */
    }
    stopCloud();
    pending = 0;
    gen++;
    chain = Promise.resolve();
  }
  const mine = gen;
  const ctx = cloud !== "off" ? audioContext() : null;
  if (!ctx) return deviceSay(text, opts, mine);

  const speed = Math.round(Math.min(1.2, Math.max(0.7, (opts.rate ?? 0.95) / 0.95)) * 100) / 100;
  const buf = getBuffer(ctx, text, speed);
  const run = () =>
    buf.then(
      (b) => playBuffer(ctx, b, text, opts, mine),
      () => {
        // AI voice unavailable: use the device voice for this line.
        if (mine === gen) deviceSay(text, opts, mine);
      },
    );
  chain = opts.queue ? chain.then(run) : run();
}

/** Fetch lines ahead of time so they play instantly later. */
export function prefetch(lines: string[]) {
  const ctx = cloud !== "off" ? audioContext() : null;
  if (!ctx) return;
  for (const t of lines) void getBuffer(ctx, t, 1).catch(() => {});
}

export function hush() {
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
  stopCloud();
  pending = 0;
  gen++;
  chain = Promise.resolve();
  setSpeaking(false);
}
