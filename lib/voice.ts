// Spoken instructions. Everything in the app is said out loud because Alina is still learning to read.

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    voice =
      vs.find((v) => /Samantha|Google US English|Jenny|Aria|Karen/i.test(v.name)) ||
      vs.find((v) => /^en[-_]US/i.test(v.lang)) ||
      vs.find((v) => /^en/i.test(v.lang)) ||
      null;
  } catch {
    /* speech not available */
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
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
    u.rate = opts.rate ?? 0.9;
    u.pitch = opts.pitch ?? 1.25;
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
