// RamenAmp's pure bits: the skin's pixel font, the analyser's bands, and the integer zoom that keeps pixels square.

// The skin is drawn at Winamp 2's own size, 275 x 116, and only ever scaled by whole device pixels.
export const W = 275, H = 116;
export function ampScale(cssWidth: number, dpr: number) {
  const d = Math.max(1, dpr);
  return Math.max(1, Math.floor((cssWidth * d) / W)) / d; // CSS px per skin pixel, a whole number of device pixels
}

// 19 bars of 3 px, spaced like hearing (log), each at least one bin wide. The lofi runs through a 1.9 kHz lowpass,
// so measured, everything lives in the first 32 of the 128 bins (up to ~6 kHz); bin 0 holds the kick.
export function bandEdges(bars = 19, bins = 32) {
  const e = [0];
  for (let i = 1; i <= bars; i++) e.push(Math.max(e[i - 1] + 1, Math.round(bins ** (i / bars))));
  return e;
}
export function bands(data: ArrayLike<number>, edges: number[], out: number[]) {
  for (let i = 0; i < edges.length - 1; i++) {
    let m = 0;
    for (let k = edges[i]; k < edges[i + 1] && k < data.length; k++) m = Math.max(m, data[k]);
    out[i] = Math.min(1, (m / 255) ** 0.85 * (1 + i * 0.06)); // tilt up, so the quieter highs still dance
  }
  return out;
}

// 4 x 5 glyphs in a 5 x 6 cell, Winamp's text size. Uppercase only, like the original.
const G: Record<string, string> = {
  A: ".##.|#..#|####|#..#|#..#", B: "###.|#..#|###.|#..#|###.", C: ".###|#...|#...|#...|.###", D: "###.|#..#|#..#|#..#|###.",
  E: "####|#...|###.|#...|####", F: "####|#...|###.|#...|#...", G: ".###|#...|#.##|#..#|.###", H: "#..#|#..#|####|#..#|#..#",
  I: "###.|.#..|.#..|.#..|###.", J: "..##|...#|...#|#..#|.##.", K: "#..#|#.#.|##..|#.#.|#..#", L: "#...|#...|#...|#...|####",
  M: "#..#|####|####|#..#|#..#", N: "#..#|##.#|#.##|#..#|#..#", O: ".##.|#..#|#..#|#..#|.##.", P: "###.|#..#|###.|#...|#...",
  Q: ".##.|#..#|#..#|#.#.|.#.#", R: "###.|#..#|###.|#.#.|#..#", S: ".###|#...|.##.|...#|###.", T: "###.|.#..|.#..|.#..|.#..",
  U: "#..#|#..#|#..#|#..#|.##.", V: "#.#.|#.#.|#.#.|#.#.|.#..", W: "#..#|#..#|####|####|#..#", X: "#..#|#..#|.##.|#..#|#..#",
  Y: "#.#.|#.#.|.#..|.#..|.#..", Z: "####|..#.|.#..|#...|####",
  0: ".##.|#.##|##.#|#..#|.##.", 1: ".#..|##..|.#..|.#..|###.", 2: "###.|...#|.##.|#...|####", 3: "###.|...#|.##.|...#|###.",
  4: "#..#|#..#|####|...#|...#", 5: "####|#...|###.|...#|###.", 6: ".##.|#...|###.|#..#|.##.", 7: "####|...#|..#.|.#..|.#..",
  8: ".##.|#..#|.##.|#..#|.##.", 9: ".##.|#..#|.###|...#|.##.",
  "-": "....|....|###.|....|....", ".": "....|....|....|....|.#..", ":": "....|.#..|....|.#..|....", "(": "..#.|.#..|.#..|.#..|..#.",
  ")": ".#..|..#.|..#.|..#.|.#..", "*": "....|#.#.|.#..|#.#.|....", "/": "...#|..#.|.#..|#...|....", "%": "#..#|..#.|.#..|#...|#..#",
  "'": ".#..|.#..|....|....|....", ",": "....|....|....|.#..|#...", "!": ".#..|.#..|.#..|....|.#..", "?": "###.|...#|.##.|....|.#..",
  "&": ".#..|#.#.|.#..|#.#.|.#.#", "+": "....|.#..|###.|.#..|....", " ": "....|....|....|....|....",
};
export const glyph = (ch: string) => (G[ch.toUpperCase()] ?? G[" "]).split("|");
