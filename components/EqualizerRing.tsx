"use client";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { bus } from "@/lib/audioBus";

// A Winamp-style spectrum wrapped around the photo. Silent, it's the dotted spec ring.
// With the lofi on, every dot grows a bar of pixel segments outward, with a peak cap that falls slowly.
// Bass sits at the top centre, highs run down both sides (mirrored), so the ring stays balanced.
const GAP = 8; // ring distance from the photo
const PITCH = 9; // space between bars along the ring
const DOT = 3; // segment size
const STEP = 5; // segment spacing outward
const SEGS = 5; // tallest bar, in segments
const PAD = GAP + STEP * (SEGS + 2);
const GAIN = 1; // calibration knob: raise if the bars look lazy
const BINS = 16; // ~172 Hz each: past ~2.7 kHz the lowpassed lofi has little left to show
const TILT = 0.8; // gentle boost toward the highs, like a real analyser
const FALL = 3; // peak cap fall speed, segments per second
const COLORS = ["#3355ff", "#3355ff", "#7a5cf0", "#ee6e9f", "#f5b53f", "#f5b53f"]; // low → high, Winamp's green → red in brand colours
const CAP = "#17153a";

type Bar = { x: number; y: number; nx: number; ny: number; bin: number; boost: number; peak: number };

// Points every PITCH px around a rounded rect (centred on 0,0), starting at the top centre, with outward normals.
function ring(w: number, h: number, r: number): Bar[] {
  const sw = w - 2 * r, sh = h - 2 * r, arc = (Math.PI * r) / 2;
  const corner = (cx: number, cy: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)];
  const parts: [number, (t: number) => number[]][] = [
    [sw / 2, (t) => [t, -h / 2, 0, -1]],
    [arc, (t) => corner(sw / 2, -sh / 2, -Math.PI / 2 + t / r)],
    [sh, (t) => [w / 2, -sh / 2 + t, 1, 0]],
    [arc, (t) => corner(sw / 2, sh / 2, t / r)],
    [sw, (t) => [sw / 2 - t, h / 2, 0, 1]],
    [arc, (t) => corner(-sw / 2, sh / 2, Math.PI / 2 + t / r)],
    [sh, (t) => [-w / 2, sh / 2 - t, -1, 0]],
    [arc, (t) => corner(-sw / 2, -sh / 2, Math.PI + t / r)],
    [sw / 2, (t) => [-sw / 2 + t, -h / 2, 0, -1]],
  ];
  const len = parts.reduce((a, [l]) => a + l, 0);
  const n = Math.round(len / PITCH);
  return Array.from({ length: n }, (_, i) => {
    let d = (i * len) / n;
    const [l, f] = parts.find(([l]) => (d < l ? true : ((d -= l), false))) ?? parts[parts.length - 1];
    const [x, y, nx, ny] = f(Math.min(d, l));
    const k = Math.min(i, n - i) / (n / 2); // 0 at the top centre, 1 at the bottom centre
    return { x, y, nx, ny, bin: 1 + Math.round((BINS - 1) * k), boost: 1 + TILT * k, peak: 0 };
  });
}

export default function EqualizerRing({ className }: { className: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = canvas.current, box = el?.parentElement;
    const g = el?.getContext("2d");
    if (!el || !box || !g) return;
    let bars: Bar[] = [], cw = 0, ch = 0, raf = 0, last = 0, still = false;
    const data = new Uint8Array(128);

    const layout = () => {
      const w = box.clientWidth, h = box.clientHeight, r = parseFloat(getComputedStyle(box).getPropertyValue("--r")) || 28;
      cw = w + 2 * PAD; ch = h + 2 * PAD;
      const dpr = devicePixelRatio || 1;
      el.width = cw * dpr; el.height = ch * dpr;
      Object.assign(el.style, { width: `${cw}px`, height: `${ch}px`, left: `${-PAD}px`, top: `${-PAD}px` });
      g.setTransform(dpr, 0, 0, dpr, (cw / 2) * dpr, (ch / 2) * dpr); // origin at the photo's centre
      bars = ring(w + 2 * GAP, h + 2 * GAP, r + 6);
      still = false;
    };

    const dot = (b: Bar, k: number, color: string) => {
      g.fillStyle = color;
      g.fillRect(b.x + b.nx * k * STEP - DOT / 2, b.y + b.ny * k * STEP - DOT / 2, DOT, DOT);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - (last || now)) / 1000);
      last = now;
      const a = reduce ? null : bus.analyser;
      const falling = bars.some((b) => b.peak > 0);
      if (!a && !falling && still) return; // silent and settled: nothing to redraw
      if (a) a.getByteFrequencyData(data);
      g.clearRect(-cw / 2, -ch / 2, cw, ch);
      for (const b of bars) {
        const n = a ? Math.round(Math.min(1, (data[b.bin] / 255) * GAIN * b.boost) * SEGS) : 0;
        g.globalAlpha = 0.7;
        dot(b, 0, COLORS[0]);
        g.globalAlpha = 1;
        for (let k = 1; k <= n; k++) dot(b, k, COLORS[k]);
        b.peak = Math.max(n, b.peak - FALL * dt);
        if (b.peak >= 1 && Math.round(b.peak) >= n) dot(b, Math.round(b.peak) + 1, CAP);
        if (!a && b.peak < 1) b.peak = 0;
      }
      still = !a;
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(box);
    raf = requestAnimationFrame(frame);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [reduce]);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
