"use client";
import { useEffect, useRef, useState } from "react";
import { bus } from "@/lib/audioBus";
import type { Lofi } from "@/lib/lofi";
import { ampScale, bandEdges, bands, glyph, H, W } from "@/lib/ramenamp";
import { useCalm } from "@/lib/useCalm";
import s from "./Win95.module.css";

// RamenAmp: Winamp 2 as it was in 2001, 275 x 116 pixels, in an original skin in the site's colours,
// playing the site's own pixel lofi. Its visualizer window, RamenDrop, is a MilkDrop-style feedback loop.

const TRACK = "1. Adelina - Ramen in the Dark (pixel lofi) (10:00)";
const LENGTH = 600; // the lofi plays ten minutes
type G2 = CanvasRenderingContext2D;
type Rect = [number, number, number, number];

// The skin's colours: the site's ink and broth, Winamp's green LCD.
const K = {
  hi: "#6a64c8", face: "#2f2b6e", lo: "#0b0a1f", key: "#3d3889", keyDown: "#221f55", glyph: "#e6e4f2",
  amber: "#f5b53f", amberDim: "#7a5418", pink: "#ee6e9f", label: "#9d9bc2", lcd: "#2ce02c", ghost: "#0b2a0e", dot: "#1b1940",
};
// Analyser rows, bottom to top: green into yellow into red. Peaks in near-white, the oscilloscope in lilac to white.
const ROWS = Array.from({ length: 16 }, (_, y) => `hsl(${Math.round(120 - (y / 15) * 120)} 90% ${y > 12 ? 55 : 50}%)`);
const OSC = ["#ffffff", "#e6e4f2", "#c9c7ee", "#9d9bc2", "#6b6990"];
const PEAK = "#e6e4f2";

const px = (g: G2, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const text = (g: G2, str: string, x: number, y: number, c: string) => {
  g.fillStyle = c;
  [...str].forEach((ch, i) => glyph(ch).forEach((row, r) => { for (let k = 0; k < 4; k++) if (row[k] === "#") g.fillRect(x + i * 5 + k, y + r, 1, 1); }));
};
// Raised (or pressed) metal: light top-left edge, dark bottom-right, face in between.
const bevel = (g: G2, [x, y, w, h]: Rect, down = false, face = down ? K.keyDown : K.key) => {
  px(g, x, y, w, h, down ? K.lo : K.hi);
  px(g, x + 1, y + 1, w - 1, h - 1, down ? K.hi : K.lo);
  px(g, x + 1, y + 1, w - 2, h - 2, face);
};
const well = (g: G2, r: Rect, face = "#000") => bevel(g, r, true, face);
const sprite = (g: G2, rows: string[], x: number, y: number, pal: Record<string, string>) =>
  rows.forEach((row, j) => [...row].forEach((c, i) => { if (pal[c]) px(g, x + i, y + j, 1, 1, pal[c]); }));

// Seven-segment digits, 9 x 13 like Winamp's, with the unlit segments ghosting through.
const SEG: Record<string, Rect> = { a: [2, 0, 5, 2], b: [7, 1, 2, 5], c: [7, 7, 2, 5], d: [2, 11, 5, 2], e: [0, 7, 2, 5], f: [0, 1, 2, 5], g: [2, 6, 5, 1] };
const DIGITS = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];
const digit = (g: G2, n: number | null, x: number, y: number) => {
  for (const k in SEG) {
    const [sx, sy, w, h] = SEG[k];
    px(g, x + sx, y + sy, w, h, n !== null && DIGITS[n].includes(k) ? K.lcd : K.ghost);
  }
};

// Where everything sits, in Winamp 2's own coordinates.
const L = {
  lcd: [20, 20, 86, 42] as Rect, vis: [24, 43, 76, 16] as Rect, state: [24, 28] as const, time: [36, 26, 64, 13] as Rect,
  title: [109, 23, 157, 11] as Rect, kbps: [109, 39, 19, 9] as Rect, khz: [154, 39, 14, 9] as Rect,
  vol: [107, 57, 68, 13] as Rect, bal: [177, 57, 38, 13] as Rect, eq: [219, 58, 23, 12] as Rect, pl: [242, 58, 23, 12] as Rect,
  seek: [16, 72, 248, 10] as Rect, clutter: [10, 22, 8, 43] as Rect, vbtn: [10, 54, 8, 10] as Rect, close: [264, 3, 9, 9] as Rect,
  prev: [16, 88, 23, 18] as Rect, play: [39, 88, 23, 18] as Rect, pause: [62, 88, 23, 18] as Rect, stop: [85, 88, 23, 18] as Rect,
  next: [108, 88, 22, 18] as Rect, eject: [136, 89, 22, 16] as Rect, shuffle: [164, 89, 47, 15] as Rect, repeat: [210, 89, 28, 15] as Rect,
};
type Key = "prev" | "play" | "pause" | "stop" | "next" | "eject" | "shuffle" | "repeat" | "eq" | "pl";

const tri = (g: G2, x: number, y: number, dir: 1 | -1, c: string) => { for (let r = 0; r < 7; r++) { const w = Math.min(r, 6 - r) + 1; px(g, dir > 0 ? x : x + 4 - w, y + r, w, 1, c); } };
const GLYPHS: Partial<Record<Key, (g: G2, x: number, y: number) => void>> = {
  prev: (g, x, y) => { px(g, x - 3, y, 1, 7, K.glyph); tri(g, x - 2, y, -1, K.glyph); tri(g, x + 2, y, -1, K.glyph); },
  play: (g, x, y) => tri(g, x - 1, y, 1, K.glyph),
  pause: (g, x, y) => { px(g, x - 2, y, 2, 7, K.glyph); px(g, x + 2, y, 2, 7, K.glyph); },
  stop: (g, x, y) => px(g, x - 2, y + 1, 6, 6, K.glyph),
  next: (g, x, y) => { tri(g, x - 4, y, 1, K.glyph); tri(g, x, y, 1, K.glyph); px(g, x + 4, y, 1, 7, K.glyph); },
  eject: (g, x, y) => { for (let r = 0; r < 4; r++) px(g, x - r, y + r, 1 + r * 2, 1, K.glyph); px(g, x - 3, y + 5, 7, 2, K.glyph); },
};
const BOWL = ["..s..s..s....", ".s..s..s....k", "..s..s..s..k.", ".........kk..", "wwwwwwwwkwwww", "bnnnnnnnnnnnb", ".bbbbbbbbbbb.", ".bbbwpbbbbbb.", "..bbbbbbbbb..", "...ddddddd...", "....ddddd....", "...ddddddd..."];
const BOWL_PAL = { s: K.label, k: K.amber, w: "#f7f6fb", b: K.pink, n: "#f8d98a", p: "#f7f6fb", d: "#a8456f" };

// The parts that never move, painted once.
function paintSkin() {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  for (let y = 0; y < H; y++) px(g, 0, y, W, 1, `hsl(245 ${40 - y * 0.08}% ${(y % 2 ? 22 : 24) - y * 0.06}%)`); // brushed metal
  px(g, 0, 0, W, 1, K.hi); px(g, 0, 0, 1, H, K.hi); px(g, 0, H - 1, W, 1, K.lo); px(g, W - 1, 0, 1, H, K.lo);
  // Title bar: grooves either side of the name, like the original's.
  px(g, 1, 1, W - 2, 13, "#1d1a4a");
  const name = "RAMENAMP", nx = Math.round((W - name.length * 5) / 2);
  for (const y of [4, 6, 8]) { px(g, 20, y, nx - 26, 1, y === 6 ? K.amber : K.amberDim); px(g, nx + name.length * 5 + 4, y, 258 - (nx + name.length * 5 + 4), 1, y === 6 ? K.amber : K.amberDim); }
  text(g, name, nx, 4, K.amber);
  sprite(g, ["..s.s..", "...s.s.", "wwwwwww", "bbbbbbb", ".bbbbb.", "..ddd.."], 6, 4, BOWL_PAL);
  // The LCD, the clutter bar, the title strip and the little info windows.
  well(g, L.lcd);
  for (let y = 0; y < 16; y += 2) for (let x = 1; x < 76; x += 2) px(g, L.vis[0] + x, L.vis[1] + y, 1, 1, K.dot);
  well(g, L.clutter, "#14123a");
  "OAID".split("").forEach((ch, i) => text(g, ch, 12, 24 + i * 8, "#4a4690"));
  well(g, L.title); well(g, L.kbps); well(g, L.khz);
  text(g, "KBPS", 130, 41, K.label); text(g, "KHZ", 170, 41, K.label);
  // Sliders' grooves, the seek groove.
  well(g, [L.vol[0], L.vol[1] + 4, L.vol[2], 5], "#0d0c26");
  well(g, [L.bal[0], L.bal[1] + 4, L.bal[2], 5], "#0d0c26");
  px(g, L.bal[0] + L.bal[2] / 2, L.bal[1] + 2, 1, 2, K.label);
  well(g, L.seek, "#0d0c26");
  sprite(g, BOWL, 253, 91, BOWL_PAL);
  return c;
}

// The marquee text, rendered once to a strip twice its length so it scrolls without a seam.
function paintStrip(str: string) {
  const c = document.createElement("canvas");
  c.width = str.length * 10; c.height = 5;
  const g = c.getContext("2d")!;
  text(g, str + str, 0, 0, K.lcd);
  return c;
}

type Mode = "spectrum" | "oscilloscope" | "off";
const MODES: Mode[] = ["spectrum", "oscilloscope", "off"];

export function Player({ open, close, drag }: { open?: (id: "vis") => void; close?: () => void; drag?: (e: React.PointerEvent) => void }) {
  const [state, setState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [mode, setMode] = useState<Mode>("spectrum");
  const [vol, setVol] = useState(80);
  const [bal, setBal] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [k, setK] = useState(2);
  const lofi = useRef<Lofi | null>(null);
  const t0 = useRef(0);
  const cv = useRef<HTMLCanvasElement>(null);
  const calm = useCalm();
  const live = useRef({ calm, state, mode, vol, bal, shuffle, repeat, remaining: false, down: null as Key | null, msg: "", msgUntil: 0 });
  Object.assign(live.current, { calm, state, mode, vol, bal, shuffle, repeat });
  const said = useRef(false);

  const say = (msg: string) => Object.assign(live.current, { msg, msgUntil: performance.now() + 1800 });
  const level = (p: Lofi, v = live.current.vol, b = live.current.bal) => { p.out.gain.value = (v / 100) ** 2; p.pan.pan.value = b / 100; };

  const stop = () => { lofi.current?.stop(); lofi.current = null; setState("stopped"); };
  const play = async () => {
    if (lofi.current) { await lofi.current.ctx.resume(); setState("playing"); return; }
    const { startLofi } = await import("@/lib/lofi");
    const p = startLofi(() => {
      if (lofi.current !== p) return;
      lofi.current = null; setState("stopped");
      if (live.current.repeat) setTimeout(play, 60);
    });
    lofi.current = p; t0.current = p.ctx.currentTime; level(p);
    setState("playing");
    if (!said.current) { said.current = true; open?.("vis"); } // the first play brings the visuals with it
  };
  const pause = () => { if (lofi.current) { if (state === "paused") play(); else { lofi.current.ctx.suspend(); setState("paused"); } } };
  const restart = () => { stop(); setTimeout(play, 60); };

  const KEYS: [Key, string, () => void][] = [
    ["prev", "Previous", restart], ["play", "Play", play], ["pause", "Pause", pause], ["stop", "Stop", stop], ["next", "Next", restart],
    ["eject", "Eject", () => say("NO DISKS. ONLY RAMEN.")],
    ["shuffle", "Shuffle", () => { setShuffle(!shuffle); say(shuffle ? "SHUFFLE: OFF" : "SHUFFLE: ON. ALL 1 TRACKS."); }],
    ["repeat", "Repeat", () => { setRepeat(!repeat); say(repeat ? "REPEAT: OFF" : "REPEAT: ON"); }],
    ["eq", "Equalizer", () => say("EQ: SEASONED TO TASTE")],
    ["pl", "Playlist", () => say("PLAYLIST: 1 TRACK, NO SKIPS")],
  ];

  // Whole device pixels only: 2x on a desktop, the biggest crisp size that fits a phone.
  useEffect(() => {
    const fit = () => setK(ampScale(innerWidth < 640 ? innerWidth - 12 : 560, devicePixelRatio));
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);

  // One loop draws the whole window: skin, clock, marquee, sliders, and the analyser.
  useEffect(() => {
    const g = cv.current!.getContext("2d")!;
    const skin = paintSkin();
    const marquee = `${TRACK}  ***  `.toUpperCase(), strip = paintStrip(marquee), loop = marquee.length * 5;
    const freq = new Uint8Array(128), wave = new Float32Array(256), edges = bandEdges(), lvl = new Array(19).fill(0);
    const bar = new Array(19).fill(0), peak = new Array(19).fill(0), fall = new Array(19).fill(0);
    let raf = 0, last = performance.now(), oscPeak = 0.0002;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const f = Math.min(4, (now - last) / 16.7); last = now;
      const st = live.current, p = lofi.current, a = bus.analyser, on = st.state === "playing" && !!a;
      g.drawImage(skin, 0, 0);

      // Play state, then the clock (blinking while paused, click for time remaining).
      const [sx, sy] = L.state;
      if (st.state === "playing") tri(g, sx + 2, sy + 1, 1, K.lcd);
      else if (st.state === "paused") { px(g, sx + 1, sy + 1, 2, 7, K.lcd); px(g, sx + 5, sy + 1, 2, 7, K.lcd); }
      else px(g, sx + 1, sy + 2, 6, 6, K.lcd);
      const el = p ? Math.min(LENGTH, Math.floor(p.ctx.currentTime - t0.current)) : 0, tt = st.remaining ? LENGTH - el : el;
      const lit = st.state !== "stopped" && !(st.state === "paused" && Math.floor(now / 500) % 2);
      const n = lit ? [Math.floor(tt / 600) % 10, Math.floor(tt / 60) % 10, Math.floor((tt % 60) / 10), tt % 10] : [null, null, null, null];
      if (lit && st.remaining) px(g, 38, 32, 6, 1, K.lcd);
      [48, 60, 78, 90].forEach((x, i) => digit(g, n[i], x, 26));
      px(g, 72, 29, 2, 2, lit ? K.lcd : K.ghost); px(g, 72, 35, 2, 2, lit ? K.lcd : K.ghost);

      // The analyser.
      const [vx, vy] = L.vis, base = vy + 15;
      if (st.mode === "spectrum") {
        if (on) { a!.getByteFrequencyData(freq); bands(freq, edges, lvl); } else lvl.fill(0);
        for (let i = 0; i < 19; i++) {
          bar[i] = Math.max(lvl[i] * 16, bar[i] - 0.55 * f);
          if (bar[i] >= peak[i]) { peak[i] = bar[i]; fall[i] = 0; } else { fall[i] += 0.022 * f; peak[i] = Math.max(0, peak[i] - fall[i] * f); }
          const h = Math.round(bar[i]), x = vx + i * 4;
          for (let y = 0; y < h; y++) px(g, x, base - y, 3, 1, ROWS[y]);
          if (peak[i] >= 1) px(g, x, base - Math.min(15, Math.round(peak[i]) - 1), 3, 1, PEAK);
        }
      } else if (st.mode === "oscilloscope") {
        // Floats, not bytes: measured, the lofi's waveform swings about 0.0005 (-66 dB), under one step of a byte.
        // And minus the window's mean: 256 samples is 5 ms, so the bass only shifts the whole line; the shape is above it.
        if (on) a!.getFloatTimeDomainData(wave); else wave.fill(0);
        const mean = wave.reduce((x, y) => x + y, 0) / 256;
        let ms = 0;
        for (let i = 0; i < 256; i++) ms += (wave[i] -= mean) ** 2;
        oscPeak = Math.max(Math.sqrt(ms / 256) * 3, 0.0001, oscPeak * (1 - 0.06 * f)); // by RMS: the vinyl crackle's clicks would flatten a peak
        let prev = 0;
        for (let i = 0; i < 76; i++) {
          // Its loudest recent swing reaches 7 of the 8 rows; a square root lifts the quiet detail under the kicks.
          const w = wave[Math.floor((i * 256) / 76)], y = Math.max(-8, Math.min(7, Math.round(-Math.sign(w) * Math.sqrt(Math.abs(w) / oscPeak) * 7)));
          const lo = i ? Math.min(prev, y) : y, hi = i ? Math.max(prev, y) : y;
          for (let r = lo; r <= hi; r++) px(g, vx + i, vy + 8 + r, 1, 1, OSC[Math.min(4, Math.abs(r) >> 1)]);
          prev = y;
        }
      }

      // The scrolling title, or a message for a moment, like Winamp's "VOLUME: 54%".
      const [mx, my, mw] = L.title;
      g.save(); g.beginPath(); g.rect(mx + 2, my + 2, mw - 4, 7); g.clip();
      if (now < st.msgUntil) text(g, st.msg, mx + 2, my + 3, K.lcd);
      else g.drawImage(strip, st.calm ? mx + 2 : -(Math.floor(now / 55) % loop) + mx + 2, my + 3); // still, for reduced motion
      g.restore();
      const playing = st.state !== "stopped";
      text(g, "128", 111, 41, playing ? K.lcd : K.ghost);
      text(g, "44", 156, 41, playing ? K.lcd : K.ghost);
      text(g, "MONO", 210, 41, "#3a3870");
      text(g, "STEREO", 236, 41, playing ? K.lcd : "#3a3870");

      // Volume (its groove turns from green to red as it goes up) and balance.
      const vk = Math.round((st.vol / 100) * (L.vol[2] - 14));
      px(g, L.vol[0] + 1, L.vol[1] + 5, vk + 7, 3, `hsl(${120 - st.vol * 1.2} 80% 42%)`);
      bevel(g, [L.vol[0] + vk, L.vol[1] + 1, 14, 11]); px(g, L.vol[0] + vk + 4, L.vol[1] + 6, 6, 1, K.label);
      const bk = Math.round(((st.bal + 100) / 200) * (L.bal[2] - 14)), mid = L.bal[0] + (L.bal[2] - 14) / 2;
      px(g, Math.min(mid, L.bal[0] + bk) + 7, L.bal[1] + 5, Math.abs(L.bal[0] + bk - mid), 3, `hsl(${120 - Math.abs(st.bal) * 1.2} 80% 42%)`);
      bevel(g, [L.bal[0] + bk, L.bal[1] + 1, 14, 11]); px(g, L.bal[0] + bk + 4, L.bal[1] + 6, 6, 1, K.label);

      // Seek: the thumb rides along while there's a track.
      if (playing) {
        const sk = Math.round((el / LENGTH) * (L.seek[2] - 29));
        bevel(g, [L.seek[0] + sk, L.seek[1], 29, 10], false, K.face);
        for (let i = 0; i < 3; i++) px(g, L.seek[0] + sk + 11 + i * 3, L.seek[1] + 3, 1, 4, K.label);
      }

      // Buttons, pressed while held; toggles light up.
      (["prev", "play", "pause", "stop", "next", "eject"] as Key[]).forEach((key) => {
        const r = L[key], down = st.down === key;
        bevel(g, r, down);
        GLYPHS[key]!(g, r[0] + Math.floor(r[2] / 2) - 1 + (down ? 1 : 0), r[1] + Math.floor((r[3] - 7) / 2) + (down ? 1 : 0));
      });
      bevel(g, L.shuffle, st.down === "shuffle");
      text(g, "SHUFFLE", L.shuffle[0] + 6, L.shuffle[1] + 5, st.shuffle ? K.amber : K.label);
      bevel(g, L.repeat, st.down === "repeat");
      { const [x, y] = L.repeat, c = st.repeat ? K.amber : K.label; px(g, x + 8, y + 4, 12, 1, c); px(g, x + 8, y + 10, 12, 1, c); px(g, x + 8, y + 4, 1, 7, c); px(g, x + 19, y + 4, 1, 7, c); px(g, x + 12, y + 4, 3, 1, st.down === "repeat" ? K.keyDown : K.key); px(g, x + 13, y + 3, 1, 3, c); px(g, x + 14, y + 4, 1, 1, c); }
      for (const key of ["eq", "pl"] as const) {
        const r = L[key];
        bevel(g, r, st.down === key);
        px(g, r[0] + 3, r[1] + 5, 2, 2, "#3a3870");
        text(g, key.toUpperCase(), r[0] + 8, r[1] + 4, K.glyph);
      }
      text(g, "V", 12, 56, K.amber);
      bevel(g, L.close);
      for (let i = 0; i < 5; i++) { px(g, 266 + i, 5 + i, 1, 1, K.glyph); px(g, 270 - i, 5 + i, 1, 1, K.glyph); }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => () => lofi.current?.stop(), []);

  const pct = ([x, y, w, h]: Rect): React.CSSProperties => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%` });
  const hold = (key: Key | null) => () => { live.current.down = key; };
  return (
    <div className={s.amp} style={{ width: W * k, height: H * k, "--k": k } as React.CSSProperties}>
      <canvas ref={cv} width={W} height={H} className={s.ampSkin} aria-hidden="true" />
      <div className={s.ampDrag} style={pct([0, 0, 260, 14])} onPointerDown={drag} />
      <button type="button" className={s.ampHit} style={pct(L.close)} onClick={close} aria-label="Close RamenAmp" />
      <button type="button" className={s.ampHit} style={pct(L.vbtn)} onClick={() => { open?.("vis"); say("VIS: RAMENDROP"); }} aria-label="Open RamenDrop visuals" />
      <button type="button" className={s.ampHit} style={pct(L.time)} onClick={() => { live.current.remaining = !live.current.remaining; }} aria-label="Show time remaining or elapsed" />
      <button type="button" className={s.ampHit} style={pct(L.vis)} onClick={() => setMode(MODES[(MODES.indexOf(mode) + 1) % 3])} aria-label={`Visualizer: ${mode}. Click to change`} />
      {KEYS.map(([key, label, act]) => (
        <button key={key} type="button" className={s.ampHit} style={pct(L[key])} onClick={act} aria-label={label}
          aria-pressed={key === "shuffle" ? shuffle : key === "repeat" ? repeat : undefined}
          onPointerDown={hold(key)} onPointerUp={hold(null)} onPointerLeave={hold(null)} />
      ))}
      <input type="range" className={s.ampRange} style={pct(L.vol)} min={0} max={100} value={vol} aria-label="Volume"
        onChange={(e) => { const v = +e.target.value; setVol(v); if (lofi.current) level(lofi.current, v); say(`VOLUME: ${v}%`); }} />
      <input type="range" className={s.ampRange} style={pct(L.bal)} min={-100} max={100} step={4} value={bal} aria-label="Balance"
        onChange={(e) => { const b = Math.abs(+e.target.value) < 8 ? 0 : +e.target.value; setBal(b); if (lofi.current) level(lofi.current, undefined, b); say(b ? `BALANCE: ${Math.abs(b)}% ${b < 0 ? "LEFT" : "RIGHT"}` : "BALANCE: CENTER"); }} />
      <span className={s.srOnly} aria-live="polite">{state === "playing" ? `Playing ${TRACK.slice(3)}` : state === "paused" ? "Paused" : "Stopped"}</span>
    </div>
  );
}

/* ---------- RamenDrop: the visuals window, a MilkDrop-style feedback loop ---------- */
const PRESETS = ["Broth Tunnel", "Noodle Pull", "Steam Rising"];

const VS = "attribute vec2 p; varying vec2 uv; void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
// Each frame starts from the last one, zoomed, turned and warped, a little darker; then the music draws on top.
const WARP = `precision highp float;
uniform sampler2D prev, snd;
uniform vec2 res;
uniform float t, bass, treb, beat, preset, calm, live;
varying vec2 uv;
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float wave(float x) { return texture2D(snd, vec2(x, 0.25)).r - 0.5; }
float spec(float x) { return texture2D(snd, vec2(x * 0.5, 0.75)).r; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 pal(float h) { h = fract(h) * 3.0;
  vec3 a = vec3(0.93, 0.43, 0.62), b = vec3(0.96, 0.71, 0.25), c = vec3(0.25, 0.38, 1.0);
  return h < 1.0 ? mix(a, b, h) : h < 2.0 ? mix(b, c, h - 1.0) : mix(c, a, h - 2.0); }
void main() {
  float asp = res.x / res.y, m = 1.0 - 0.75 * calm, k = beat * m;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0), q;
  float r = length(p), d, glow = 0.0;
  vec3 ink;
  if (preset < 0.5) {
    q = rot(m * (0.006 + 0.012 * sin(t * 0.21))) * p / (1.0 + m * (0.01 + 0.03 * bass) + 0.05 * k);
    q += m * 0.0025 * vec2(sin(p.y * 9.0 + t), cos(p.x * 9.0 - t * 1.3));
    float s = abs(atan(p.y, p.x)) / 3.14159;
    d = abs(r - (0.2 + 0.06 * bass + 0.05 * k + wave(s) * 0.16));
    ink = pal(t * 0.03 + s * 0.6);
  } else if (preset < 1.5) {
    q = p * vec2(0.982 - m * 0.02 * bass, 0.997);
    q.y += m * 0.004 * sin(p.x * 11.0 + t * 1.7);
    d = abs(p.y - wave(uv.x) * 0.42 - 0.03 * sin(uv.x * 6.28 + t));
    ink = pal(t * 0.04 + uv.x * 0.5);
  } else {
    q = p + m * vec2(0.004 * sin(p.y * 9.0 + t * 1.1) + 0.002 * sin(p.y * 23.0 - t * 2.0), -(0.006 + 0.016 * bass));
    float edge = -0.47 + spec(pow(abs(uv.x - 0.5) * 2.0, 1.2) * 0.22) * 0.45;
    d = abs(p.y - edge);
    glow = step(p.y, edge) * (0.012 + 0.03 * bass);
    ink = pal(t * 0.03 + abs(uv.x - 0.5));
  }
  vec2 su = q / vec2(asp, 1.0) + 0.5;
  vec3 c = texture2D(prev, su).rgb * step(0.0, su.y) * step(su.y, 1.0) * step(0.0, su.x) * step(su.x, 1.0); // nothing smears in from the edges
  c = mix(c, c.brg, 0.012) * (0.95 + 0.035 * calm) - 0.004;
  float line = smoothstep((2.5 + 4.0 * k) / res.y, 0.0, d);
  c += ink * (line * (0.5 + 0.8 * k) + glow);
  c += ink * k * 0.06 * smoothstep(0.7, 0.0, r);
  c += step(0.9995 - 0.01 * treb * m * live, hash(floor(uv * res / 3.0) + floor(t * 24.0))) * vec3(1.0, 0.92, 0.85) * 0.7;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
const SHOW = `precision mediump float;
uniform sampler2D img;
uniform float live, preset;
varying vec2 uv;
void main() {
  vec3 c = texture2D(img, uv).rgb;
  if (preset > 0.5 && preset < 1.5) c = max(c, texture2D(img, vec2(1.0 - uv.x, uv.y)).rgb * 0.7);
  c = max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, 1.5), 0.0); // MilkDrop's colours were never shy
  c *= 1.0 - 0.55 * length(uv - 0.5) * length(uv - 0.5) * 2.0;
  gl_FragColor = vec4(pow(c, vec3(0.9)) * (0.6 + 0.4 * live), 1.0); // dimmer while it waits for music
}`;

export function RamenDrop() {
  const calm = useCalm();
  const [preset, setPreset] = useState(0);
  const [banner, setBanner] = useState(true);
  const [idle, setIdle] = useState(true);
  const [broken, setBroken] = useState(false);
  const stage = useRef<HTMLButtonElement>(null);
  const opts = useRef({ preset, calm });
  opts.current = { preset, calm };

  const pick = (n: number) => { setPreset(((n % PRESETS.length) + PRESETS.length) % PRESETS.length); setBanner(true); };
  useEffect(() => { if (!banner) return; const id = setTimeout(() => setBanner(false), 2600); return () => clearTimeout(id); }, [banner, preset]);

  useEffect(() => {
    // A fresh canvas per mount, so its GL context can be released on unmount (and survive React's dev double-mount).
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    stage.current!.prepend(c);
    const gl = c.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) { setBroken(true); return () => c.remove(); }
    const prog = (fs: string) => {
      const pr = gl.createProgram()!;
      for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]] as const) {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src); gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn("RamenDrop:", gl.getShaderInfoLog(sh));
        gl.attachShader(pr, sh); gl.deleteShader(sh);
      }
      gl.bindAttribLocation(pr, 0, "p"); gl.linkProgram(pr);
      return pr;
    };
    const warp = prog(WARP), show = prog(SHOW);
    if (!gl.getProgramParameter(warp, gl.LINK_STATUS) || !gl.getProgramParameter(show, gl.LINK_STATUS)) { setBroken(true); return () => c.remove(); }
    const u = (pr: WebGLProgram, n: string) => gl.getUniformLocation(pr, n);
    const U = Object.fromEntries(["prev", "snd", "res", "t", "bass", "treb", "beat", "preset", "calm", "live"].map((n) => [n, u(warp, n)]));
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const tex = (w: number, h: number, fmt: number, data: ArrayBufferView | null = null) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, fmt, w, h, 0, fmt, gl.UNSIGNED_BYTE, data);
      return t;
    };
    // The sound as a 256 x 2 texture: the waveform on row one, the spectrum on row two.
    const snd = new Uint8Array(512), sndTex = tex(256, 2, gl.LUMINANCE, snd);
    const bufs = [0, 1].map(() => ({ t: tex(1, 1, gl.RGBA), f: gl.createFramebuffer()! }));
    let w = 0, h = 0, cur = 0;
    const fit = () => {
      const dpr = Math.min(devicePixelRatio, 2), nw = Math.max(1, Math.round(c.clientWidth * dpr)), nh = Math.max(1, Math.round(c.clientHeight * dpr));
      if (nw === w && nh === h) return;
      w = c.width = nw; h = c.height = nh;
      for (const b of bufs) {
        gl.bindTexture(gl.TEXTURE_2D, b.t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, b.t, 0);
        gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };
    const ro = new ResizeObserver(fit);
    ro.observe(c);

    const wave = new Float32Array(256), freq = new Uint8Array(128);
    let raf = 0, last = performance.now(), t = 0, amp = 0.01, bassAvg = 0.3, trebAvg = 0.1, bass = 0, treb = 0, beat = 0, gap = 0, wasLive = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!w || !c.clientWidth) return;
      const dt = Math.min(0.1, (now - last) / 1000), { preset, calm } = opts.current;
      last = now; t += dt * (calm ? 0.3 : 1);
      const a = bus.analyser, on = !!a && a.context.state === "running";
      if (on !== wasLive) { wasLive = on; setIdle(!on); }
      if (on) { a!.getFloatTimeDomainData(wave); a!.getByteFrequencyData(freq); }
      else for (let i = 0; i < 256; i++) { wave[i] = 0.01 * Math.sin(i * 0.045 + t * 0.6) * Math.sin(t * 0.17 + i * 0.01); freq[i >> 1] = 60 + 50 * Math.sin(i * 0.05 - t * 0.4); }
      // Normalise the waveform so a quiet lofi still fills the screen.
      let pk = 0;
      const mean = wave.reduce((x, y) => x + y, 0) / 256; // the bass only shifts a 5 ms window; the shape is above it
      for (let i = 0; i < 256; i++) pk += (wave[i] -= mean) ** 2;
      amp += (Math.max(Math.sqrt(pk / 256) * 3, 0.0001) - amp) * Math.min(1, dt * 3); // RMS, so crackle clicks don't flatten it
      for (let i = 0; i < 256; i++) snd[i] = Math.max(0, Math.min(255, 128 + Math.sign(wave[i]) * Math.sqrt(Math.abs(wave[i]) / amp) * 0.45 * 128));
      snd.set(freq, 256);
      // Bass and treble against their own recent average, so kicks and hats read as jumps. A kick is a beat.
      const lo = (freq[0] + freq[1] + freq[2]) / 765, hi = freq.slice(12, 28).reduce((x, y) => x + y, 0) / (16 * 255); // snare and lead: the highs are above the lowpass
      bassAvg += (lo - bassAvg) * Math.min(1, dt * 1.5); trebAvg += (hi - trebAvg) * Math.min(1, dt * 1.5);
      bass += (Math.max(0, lo - bassAvg) * 4 - bass) * Math.min(1, dt * 12);
      treb = on ? Math.max(0, Math.min(1, (hi - trebAvg) * 12)) : 0;
      gap += dt; beat *= Math.exp(-dt * 5);
      if (on && !calm && lo > bassAvg * 1.12 && lo > 0.5 && gap > 0.25) { beat = 1; gap = 0; }

      gl.bindTexture(gl.TEXTURE_2D, sndTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 2, gl.LUMINANCE, gl.UNSIGNED_BYTE, snd);
      const src = bufs[cur], dst = bufs[1 - cur];
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.f); gl.viewport(0, 0, w, h);
      gl.useProgram(warp);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.t);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, sndTex);
      gl.uniform1i(U.prev, 0); gl.uniform1i(U.snd, 1); gl.uniform2f(U.res, w, h);
      gl.uniform1f(U.t, t); gl.uniform1f(U.bass, Math.min(1, bass)); gl.uniform1f(U.treb, treb); gl.uniform1f(U.beat, beat);
      gl.uniform1f(U.preset, preset); gl.uniform1f(U.calm, calm ? 1 : 0); gl.uniform1f(U.live, on ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(show);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dst.t);
      gl.uniform1i(u(show, "img"), 0); gl.uniform1f(u(show, "live"), on ? 1 : 0); gl.uniform1f(u(show, "preset"), preset);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cur = 1 - cur;
    };
    raf = requestAnimationFrame(frame);
    const lost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); setBroken(true); };
    c.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); c.removeEventListener("webglcontextlost", lost);
      bufs.forEach((b) => { gl.deleteTexture(b.t); gl.deleteFramebuffer(b.f); });
      gl.deleteTexture(sndTex); gl.deleteBuffer(quad); gl.deleteProgram(warp); gl.deleteProgram(show);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      c.remove();
    };
  }, []);

  const keys = (e: React.KeyboardEvent) => {
    const n = "123".indexOf(e.key);
    if (n >= 0) pick(n);
    else if (e.key === "ArrowRight") pick(preset + 1);
    else if (e.key === "ArrowLeft") pick(preset - 1);
    else return;
    e.preventDefault();
  };
  return (
    <button ref={stage} type="button" className={s.drop} onClick={() => pick(preset + 1)} onKeyDown={keys}
      aria-label={`RamenDrop visuals: ${PRESETS[preset]}. Click, arrow keys or 1 to 3 change the preset.`}>
      {banner && <span className={s.dropName} aria-hidden="true">{preset + 1}. {PRESETS[preset]}</span>}
      {(idle || broken) && <span className={s.dropHint} aria-hidden="true">{broken ? "No graphics card in this one. Just broth." : "Press play on RamenAmp"}</span>}
    </button>
  );
}
