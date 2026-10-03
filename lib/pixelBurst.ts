// A retro pixel burst over an element, after React Bits' PixelTransition: square pixels in the site's colours pop in
// one by one in random order until they cover it, `onCover` swaps what's underneath, then they pop out the same way.
// Used for switching tabs and opening sheets. Resolves when the last pixel is gone.
import { gsap } from "gsap";

const COLORS = ["#17153a", "#3355ff", "#2a2660", "#F5B53F", "#ff7ac6"]; // night, blueprint, deep indigo, broth, naruto
const WEIGHTS = [5, 4, 3, 1, 1]; // mostly night and blue, a few bright sparks

const pick = (i: number) => {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  let r = (h - Math.floor(h)) * total; // a hash: random-looking, but stable per cell, so a pixel never flickers colour
  for (let k = 0; k < COLORS.length; k++) { r -= WEIGHTS[k]; if (r <= 0) return COLORS[k]; }
  return COLORS[0];
};

export function pixelBurst(host: HTMLElement, { cell = 56, step = 0.28, hold = 0.06, z = 30, onCover }: { cell?: number; step?: number; hold?: number; z?: number; onCover?: () => void } = {}) {
  const { width, height } = host.getBoundingClientRect();
  const cols = Math.max(4, Math.ceil(width / cell)), rows = Math.max(3, Math.ceil(height / cell));
  const grid = document.createElement("div");
  Object.assign(grid.style, { position: "absolute", inset: "0", zIndex: String(z), pointerEvents: "none", overflow: "hidden" });
  const w = 100 / cols, h = 100 / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const p = document.createElement("i");
    Object.assign(p.style, { position: "absolute", left: `${c * w}%`, top: `${r * h}%`, width: `${w + 0.2}%`, height: `${h + 0.2}%`, background: pick(r * cols + c), display: "none" });
    grid.append(p);
  }
  host.append(grid);
  const pixels = grid.children;
  const each = step / pixels.length;
  return new Promise<void>((done) => {
    // Browsers pause animation frames in background tabs: finish on a timer too, so a page is never left covered.
    let covered = false, over = false;
    const cover = () => { if (!covered) { covered = true; onCover?.(); } };
    const finish = () => { if (over) return; over = true; cover(); gsap.killTweensOf(pixels); grid.remove(); done(); };
    const safety = setTimeout(finish, (step * 2 + hold) * 1000 + 900);
    gsap.to(pixels, { display: "block", duration: 0, stagger: { each, from: "random" } });
    gsap.delayedCall(step + hold, () => {
      cover();
      gsap.to(pixels, { display: "none", duration: 0, stagger: { each, from: "random" }, onComplete: () => { clearTimeout(safety); finish(); } });
    });
  });
}
