// Tiny synthesized sound effects, so the app needs no audio files.

let ac: AudioContext | null = null;

function tone(freq: number, dur = 0.15, type: OscillatorType = "sine", when = 0, vol = 0.25) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = ac || new Ctx();
    if (ac.state === "suspended") void ac.resume();
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t = ac.currentTime + when;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {
    /* audio not available */
  }
}

export const sfx = {
  unlock: () => tone(1, 0.01, "sine", 0, 0.001),
  pop: () => {
    tone(600, 0.08, "square", 0, 0.15);
    tone(180, 0.12, "triangle", 0.02, 0.2);
  },
  yay: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", i * 0.09)),
  boop: () => {
    tone(220, 0.18, "sine", 0, 0.2);
    tone(180, 0.2, "sine", 0.12, 0.2);
  },
  tick: (n: number) => tone(400 + n * 60, 0.12, "triangle"),
  note: (freq: number, dur = 0.35) => tone(freq, dur, "triangle", 0, 0.3),
  flip: () => tone(900, 0.05, "sine", 0, 0.12),
  levelUp: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, "square", i * 0.07, 0.12)),
};
