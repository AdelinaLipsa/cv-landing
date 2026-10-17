// Rain on her window, after Lucas Bebber's rain-on-glass (Codrops, 2015), rebuilt for the outro's three.js pass.
// The sim is pure (map pixels, y down): drops land, grow when others land on them, and once heavy enough run down
// in jerks with a little wobble, shedding tiny droplets behind them and swallowing what they run into.
// paint() draws it into a normal map (R, G: the surface's slope, B: thickness, A: water) that the glass pass in
// components/Window.tsx refracts the street through.

export type RainOpts = {
  w: number; h: number;     // map size, px
  max: number;              // drop pool
  rate: number;             // drops landing per second
  minR: number; maxR: number;
  mist: number;             // tiny droplets per second (painted, not simulated)
  run: boolean;             // false: drops stay put (reduced motion)
};
export type Rain = ReturnType<typeof createRain>;

const TRAIL = 256;
export function createRain(o: RainOpts, rand = Math.random) {
  const n = o.max;
  const s = {
    o, x: new Float32Array(n), y: new Float32Array(n), r: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n),
    trailY: new Float32Array(n), alive: new Uint8Array(n), run: new Uint8Array(n), acc: 0, cursor: 0, rand,
    trail: new Float32Array(TRAIL * 3), trailN: 0, // droplets shed this frame (x, y, r): painted into the mist, never simulated
  };
  return s;
}

const free = (s: Rain) => {
  const n = s.o.max;
  for (let k = 0; k < n; k++) { const i = (s.cursor + k) % n; if (!s.alive[i]) { s.cursor = i + 1; return i; } }
  // full: the smallest of a few resting drops gives way (never one that is running)
  let best = -1;
  for (let k = 0; k < 8; k++) { const i = Math.floor(s.rand() * n); if (!s.run[i] && (best < 0 || s.r[i] < s.r[best])) best = i; }
  return best;
};

export function add(s: Rain, x: number, y: number, r: number) {
  const i = free(s); if (i < 0) return -1;
  s.x[i] = x; s.y[i] = y; s.r[i] = r; s.vx[i] = 0; s.vy[i] = 0; s.trailY[i] = y; s.alive[i] = 1; s.run[i] = 0;
  return i;
}

// a lands on b (or runs into it): one drop with both their water
const merge = (s: Rain, keep: number, gone: number) => {
  s.r[keep] = Math.min(Math.sqrt(s.r[keep] ** 2 + s.r[gone] ** 2), s.o.maxR * 1.6);
  s.alive[gone] = 0; s.run[gone] = 0;
};

export function step(s: Rain, dt: number) {
  const { o, x, y, r, vx, vy, alive, run, rand } = s, n = o.max, k = o.h / 600; // speeds are tuned on a 600 px tall map
  // new drops land; one that lands on another joins it
  s.acc += o.rate * dt;
  while (s.acc >= 1) {
    s.acc--;
    const nx = rand() * o.w, ny = rand() * o.h * 0.97, nr = o.minR + (o.maxR - o.minR) * rand() ** 3;
    const i = add(s, nx, ny, nr); if (i < 0) break;
    for (let j = 0; j < n; j++) {
      if (j === i || !alive[j]) continue;
      const dx = x[j] - nx, dy = y[j] - ny;
      if (dx * dx + dy * dy < (r[j] + nr) ** 2 * 0.64) { merge(s, j, i); break; }
    }
  }
  for (let i = 0; i < n; i++) {
    if (!alive[i]) continue;
    // heavy drops let go: the heavier, the sooner
    if (!run[i]) {
      if (o.run && r[i] > o.maxR * 0.6 && rand() < dt * 0.6 * (r[i] / o.maxR) ** 3) { run[i] = 1; vy[i] = 20 * k; s.trailY[i] = y[i]; }
      continue;
    }
    // run in jerks: speed builds with weight, now and then the drop catches on the glass; a little sideways wobble
    vy[i] += (40 + 200 * (r[i] / o.maxR) ** 2) * k * dt;
    if (rand() < dt * 2.5) vy[i] *= 0.25;
    vy[i] = Math.min(vy[i], 200 * k);
    vx[i] = vx[i] * Math.max(0, 1 - 4 * dt) + (rand() - 0.5) * 200 * k * dt;
    x[i] += vx[i] * dt; y[i] += vy[i] * dt;
    // a trail of tiny droplets, and the drop loses that water
    if (y[i] - s.trailY[i] > r[i] * (0.25 + rand() * 0.35) && s.trailN < TRAIL) {
      s.trailY[i] = y[i];
      const t = s.trailN++ * 3;
      s.trail[t] = x[i] + (rand() - 0.5) * r[i] * 0.5; s.trail[t + 1] = y[i] - r[i] * 1.4; s.trail[t + 2] = r[i] * (0.2 + rand() * 0.2);
      r[i] *= 0.992;
    }
    if (r[i] < o.maxR * 0.35) { run[i] = 0; vy[i] = 0; } // too light to keep going: it stops where it is
    // swallow what's in its path (ahead or beside it, never its own trail)
    for (let j = 0; j < n; j++) {
      if (j === i || !alive[j] || y[j] < y[i] - r[i] * 0.3) continue;
      const dx = x[j] - x[i], dy = y[j] - y[i];
      if (dx * dx + dy * dy < (r[i] + r[j]) ** 2 * 0.64) merge(s, i, j);
    }
    if (y[i] - r[i] > o.h || x[i] < -r[i] || x[i] > o.w + r[i]) { alive[i] = 0; run[i] = 0; }
  }
}

// ---------- painting the map (browser only) ----------
// One drop, drawn once: a dome's slope in R/G (0.5 = flat), thickness in B, water in A.
export function dropSprite(size = 64) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d")!, img = g.createImageData(size, size), R = size / 2;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const dx = (px + 0.5 - R) / R, dy = (py + 0.5 - R) / R, d = Math.hypot(dx, dy), o = (py * size + px) * 4;
    if (d > 1) continue;
    const e = Math.min(d, 0.999), slope = e ** 1.4; // flatter in the middle, steep at the rim, like a real drop
    img.data[o] = 128 + 127 * (dx / (d || 1)) * slope; img.data[o + 1] = 128 + 127 * (dy / (d || 1)) * slope;
    img.data[o + 2] = 255 * Math.sqrt(1 - e * e); img.data[o + 3] = 255 * Math.min(1, (1 - d) * R * 0.3); // a soft edge
  }
  g.putImageData(img, 0, 0);
  return c;
}

export type Painter = { map: HTMLCanvasElement; mist: HTMLCanvasElement; m: CanvasRenderingContext2D; g: CanvasRenderingContext2D; sprite: HTMLCanvasElement };
export function painter(w: number, h: number): Painter {
  const map = document.createElement("canvas"), mist = document.createElement("canvas");
  map.width = mist.width = w; map.height = mist.height = h;
  return { map, mist, g: map.getContext("2d")!, m: mist.getContext("2d")!, sprite: dropSprite() };
}

// The fine mist: tiny droplets settle all over; a running drop wipes a clear path through them.
export function mist(p: Painter, s: Rain, dt: number) {
  const { m, sprite } = p, { o } = s, k = o.h / 600;
  for (let c = o.mist * dt + s.rand(); c >= 1; c--) {
    const r = (0.9 + s.rand() ** 2 * 2.2) * k;
    m.drawImage(sprite, s.rand() * o.w - r, s.rand() * o.h - r, r * 2, r * 2);
  }
  for (let t = 0; t < s.trailN; t++) { const tr = s.trail[t * 3 + 2]; m.drawImage(sprite, s.trail[t * 3] - tr, s.trail[t * 3 + 1] - tr, tr * 2, tr * 2); }
  s.trailN = 0;
  m.globalCompositeOperation = "destination-out"; m.fillStyle = "#000"; m.beginPath();
  for (let i = 0; i < o.max; i++) if (s.run[i]) { m.moveTo(s.x[i] + s.r[i] * 1.2, s.y[i]); m.arc(s.x[i], s.y[i], s.r[i] * 1.2, 0, Math.PI * 2); }
  m.fill(); m.globalCompositeOperation = "source-over";
}

export function paint(p: Painter, s: Rain) {
  const { g, sprite } = p, { o, x, y, r, vy } = s, k = o.h / 600;
  g.clearRect(0, 0, o.w, o.h);
  g.drawImage(p.mist, 0, 0);
  for (let i = 0; i < o.max; i++) {
    if (!s.alive[i]) continue;
    const st = 1 + Math.min(0.4, vy[i] / (400 * k)); // a running drop stretches a little, heavier at the bottom
    g.drawImage(sprite, x[i] - r[i], y[i] - r[i] * (2 * st - 1), r[i] * 2, r[i] * 2 * st);
  }
}
