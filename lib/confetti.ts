// Canvas confetti burst for right answers.

type Bit = { x: number; y: number; vx: number; vy: number; r: number; c: string; a: number; round: boolean };

const COLORS = ["#ff5d8f", "#ffc93c", "#3ccf91", "#3a8dff", "#9b6bff", "#ff8a3d"];
let bits: Bit[] = [];
let raf = 0;
let canvas: HTMLCanvasElement | null = null;

export function attachConfetti(el: HTMLCanvasElement) {
  canvas = el;
  const size = () => {
    el.width = innerWidth * devicePixelRatio;
    el.height = innerHeight * devicePixelRatio;
  };
  size();
  addEventListener("resize", size);
  return () => removeEventListener("resize", size);
}

export function confetti(n = 90) {
  if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const d = devicePixelRatio;
  for (let i = 0; i < n; i++) {
    bits.push({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 28 * d,
      vy: (-Math.random() * 22 - 6) * d,
      r: (6 + Math.random() * 8) * d,
      c: COLORS[i % COLORS.length],
      a: Math.random() * 6,
      round: Math.random() < 0.5,
    });
  }
  if (!raf) loop();
}

function loop() {
  if (!canvas) return;
  const cx = canvas.getContext("2d")!;
  const d = devicePixelRatio;
  cx.clearRect(0, 0, canvas.width, canvas.height);
  for (const b of bits) {
    b.vy += 0.7 * d;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.99;
    b.a += 0.2;
    cx.save();
    cx.translate(b.x, b.y);
    cx.rotate(b.a);
    cx.fillStyle = b.c;
    if (b.round) {
      cx.beginPath();
      cx.arc(0, 0, b.r / 2, 0, Math.PI * 2);
      cx.fill();
    } else cx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2);
    cx.restore();
  }
  bits = bits.filter((b) => b.y < canvas!.height + 50);
  if (bits.length) raf = requestAnimationFrame(loop);
  else {
    cx.clearRect(0, 0, canvas.width, canvas.height);
    raf = 0;
  }
}
