// The Career graph's pen during the guide, as plain numbers.
// s is how far HEAD has travelled, in rows from the oldest commit: 0 is the oldest row, n - 1 the merge commit at the top,
// -1 nothing drawn yet. Rows are in git log order (newest first), so row i sits at s = n - 1 - i.
// `fork` is the fork node's s: dev runs 0..fork, product leaves the fork (one curved row) and climbs to the merge,
// and the dev line catches up to the merge on the last row.

export const sOf = (i: number, n: number) => n - 1 - i;

// Where the pen stops: the highest built row as an s, or -1. At the fork it goes on 3/4 of the way round the curve,
// so product visibly branches off before its first commit.
export const STUB = 0.75;
export const tipOf = (built: boolean[], fork: number) => {
  const i = built.indexOf(true);
  const s = i < 0 ? -1 : sOf(i, built.length);
  return s === fork ? fork + STUB : s;
};

export function penAt(s: number, fork: number, n: number) {
  const top = n - 1, last = n - 2; // the merge commit; the row under it
  const into = Math.max(0, s - last); // 0..1 across the merge row
  const devRows = s <= fork ? Math.max(0, s) : s <= last ? fork : fork + into * (top - fork);
  return {
    dev: devRows / top, // fraction of the dev line drawn
    prod: Math.max(0, s - fork), // product rows drawn; the first one is the curve out of the fork
    merge: into, // fraction of the merge line
    head: Math.min(1, Math.max(0, s + 1)), // HEAD's opacity: it fades in onto the first commit
    lane: s > fork ? ("product" as const) : ("dev" as const),
  };
}

// The pen's moves from s to `to`, one row at a time, so each commit stamps as the tip reaches it.
// Forward: 0.5s a row, and the merge row takes 0.8s (it lands that long after the commit under it). Back: 0.22s a row.
export function segments(from: number, to: number, n: number) {
  const out: { to: number; dur: number }[] = [];
  let s = from;
  while (Math.abs(to - s) > 1e-9) {
    const up = to > s;
    const next = up ? Math.min(to, Math.floor(s + 1e-9) + 1) : Math.max(to, Math.ceil(s - 1e-9) - 1);
    out.push({ to: next, dur: Math.abs(next - s) * (up ? (next === n - 1 ? 0.8 : 0.5) : 0.22) });
    s = next;
  }
  return out;
}
