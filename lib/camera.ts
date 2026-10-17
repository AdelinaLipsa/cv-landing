export type Rect = { x: number; y: number; w: number; h: number };

// Scroll delta that centres t in the safe band, and the zoom that fits it (capped at max).
export function frame(t: Rect, view: { w: number; h: number }, safe: { top: number; bottom: number }, max: number) {
  const band = view.h - safe.top - safe.bottom;
  const dy = t.y + t.h / 2 - (safe.top + band / 2);
  const s = Math.min(max, Math.max(1, Math.min(0.8 * band / t.h, 0.86 * view.w / t.w)));
  return { dy, s };
}

// clip-path: path() argument; evenodd cuts t (grown by pad, rounded r) out of the viewport.
export function holePath(view: { w: number; h: number }, t: Rect, r: number, pad: number): string {
  const x0 = t.x - pad, y0 = t.y - pad, x1 = t.x + t.w + pad, y1 = t.y + t.h + pad;
  const rr = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2), arc = `A${rr} ${rr} 0 0 1`;
  return `evenodd, M0 0H${view.w}V${view.h}H0Z M${x0 + rr} ${y0}H${x1 - rr}${arc} ${x1} ${y0 + rr}V${y1 - rr}${arc} ${x1 - rr} ${y1}H${x0 + rr}${arc} ${x0} ${y1 - rr}V${y0 + rr}${arc} ${x0 + rr} ${y0}Z`;
}
