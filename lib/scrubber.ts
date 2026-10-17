// The tour player's year labels: which ones fit along the track.
// Greedy from the left, at least `gap` px apart. The last one (Now) always stays, so the one before it gives way.
export function fit(xs: number[], gap: number) {
  const keep = xs.map(() => false);
  let last = -Infinity, lastI = -1;
  xs.forEach((x, i) => { if (x - last >= gap) { keep[i] = true; last = x; lastI = i; } });
  const n = xs.length - 1;
  if (n >= 0 && !keep[n]) {
    keep[n] = true;
    if (lastI > 0 && xs[n] - xs[lastI] < gap) keep[lastI] = false;
  }
  return keep;
}
