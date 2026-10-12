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

export function say(text: string, opts: { queue?: boolean; rate?: number; pitch?: number } = {}) {
  try {
    if (!opts.queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? 0.9;
    u.pitch = opts.pitch ?? 1.25;
    speechSynthesis.speak(u);
  } catch {
    /* speech not available */
  }
}

export function hush() {
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
