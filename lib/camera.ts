export type Rect = { x: number; y: number; w: number; h: number };

// Scroll delta and zoom that frame t in the safe band (between safe.top and view.h - safe.bottom), capped at max.
// cy is where t's centre lands. Subjects too tall for the band (with its 14px focus pad) zoom out to fit, down
// to 0.85; past that they sit at the top of the band. Everything else zooms to fit (never below 1), centred.
export const PAD = 14;
export function frame(t: Rect, view: { w: number; h: number }, safe: { top: number; bottom: number }, max: number) {
  const band = view.h - safe.top - safe.bottom;
  const tall = t.h + 2 * PAD > band;
  const s = tall ? Math.max(0.85, Math.min(1, (band - 2 * PAD) / t.h)) : Math.min(max, Math.max(1, Math.min(0.8 * band / t.h, 0.86 * view.w / t.w)));
  const cy = tall && s * t.h + 2 * PAD > band ? safe.top + PAD + s * t.h / 2 : safe.top + band / 2;
  return { dy: t.y + t.h / 2 - cy, s, cy };
}

// clip-path: path() argument; evenodd cuts each t (grown by pad, rounded r) out of the viewport. Holes that would
// overlap (evenodd would fill the overlap again) merge into one around both.
export function holePath(view: { w: number; h: number }, t: Rect | Rect[], r: number, pad: number): string {
  const boxes = [t].flat().map((b) => ({ x0: b.x - pad, y0: b.y - pad, x1: b.x + b.w + pad, y1: b.y + b.h + pad }));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) {
      boxes[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
      boxes.splice(j, 1);
      j = i; // the merged box may now overlap one already passed
    }
  }
  return `evenodd, M0 0H${view.w}V${view.h}H0Z` + boxes.map(({ x0, y0, x1, y1 }) => {
    const rr = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2), arc = `A${rr} ${rr} 0 0 1`;
    return ` M${x0 + rr} ${y0}H${x1 - rr}${arc} ${x1} ${y0 + rr}V${y1 - rr}${arc} ${x1 - rr} ${y1}H${x0 + rr}${arc} ${x0} ${y1 - rr}V${y0 + rr}${arc} ${x0 + rr} ${y0}Z`;
  }).join("");
}
