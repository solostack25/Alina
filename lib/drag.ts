// Finger-friendly drag and drop. A copy of the element follows her finger;
// if the drop isn't accepted it slides back to where it started.
// A touch that barely moves counts as a tap.

type DragOpts = {
  /** Return true if the drop landed somewhere useful. */
  onDrop: (x: number, y: number) => boolean | void;
  onMove?: (x: number, y: number) => void;
  onTap?: () => void;
};

export function dragGhost(e: React.PointerEvent<HTMLElement>, opts: DragOpts) {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  e.preventDefault();
  const source = e.currentTarget;
  const rect = source.getBoundingClientRect();
  const dx = e.clientX - rect.left;
  const dy = e.clientY - rect.top;
  const startX = e.clientX;
  const startY = e.clientY;
  let ghost: HTMLElement | null = null;
  let moved = false;

  const makeGhost = () => {
    const g = source.cloneNode(true) as HTMLElement;
    Object.assign(g.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      zIndex: "50",
      pointerEvents: "none",
      animation: "none",
      transition: "none",
      transform: "scale(1.12)",
      filter: "drop-shadow(0 12px 10px rgba(0,0,0,.25))",
    });
    document.body.appendChild(g);
    source.style.visibility = "hidden";
    return g;
  };

  const move = (ev: PointerEvent) => {
    if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 8) return;
    if (!moved) {
      moved = true;
      ghost = makeGhost();
    }
    ghost!.style.left = `${ev.clientX - dx}px`;
    ghost!.style.top = `${ev.clientY - dy}px`;
    opts.onMove?.(ev.clientX, ev.clientY);
  };

  const up = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    if (!moved || !ghost) {
      opts.onTap?.();
      return;
    }
    const g = ghost;
    const ok = opts.onDrop(ev.clientX, ev.clientY);
    if (ok) {
      g.remove();
      source.style.visibility = "";
      return;
    }
    g.style.transition = "left .25s ease, top .25s ease, transform .25s ease";
    g.style.left = `${rect.left}px`;
    g.style.top = `${rect.top}px`;
    g.style.transform = "scale(1)";
    setTimeout(() => {
      g.remove();
      source.style.visibility = "";
    }, 260);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

export function inside(el: Element | null, x: number, y: number, pad = 0) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
}
