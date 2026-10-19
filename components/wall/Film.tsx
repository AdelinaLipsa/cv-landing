"use client";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import { Play } from "./play";
import s from "./film.module.css";

// A Work tile as a short silent film of the tool in use: drawn in code, scripted on a clock. The scene is laid out
// on a fixed stage (w × h px) and fitted to the tile; a camera pushes in on the moment that matters. In the grid a
// film shows its poster frame and plays from the top while hovered; in the viewer it plays with a scrubber.

// The film's clock in seconds, to the script. Keyframes are [time, value]; between two, an ease in-out.
const io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export function at(t: number, keys: [number, number][]) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) return v0 + (v1 - v0) * io((t - t0) / (t1 - t0 || 1));
  }
  return keys[keys.length - 1][1];
}
// 0 → 1 over [a, b], eased; for fades and reveals.
export const span = (t: number, a: number, b: number) => at(t, [[a, 0], [b, 1]]);

// The camera: point (x, y) of the stage at the centre of the frame, zoomed z times.
export type Cam = { x: number; y: number; z: number };

// The cursor, in the site's blueprint blue (the guide's colour): a pointer, with a ring where it clicks.
export function Cursor({ x, y, click }: { x: number; y: number; click?: number }) {
  return (
    <div className={s.cursor} style={{ transform: `translate(${x}px, ${y}px)` }} aria-hidden="true">
      {click !== undefined && click > 0 && click < 1 && <i style={{ scale: 0.4 + click, opacity: 0.7 * (1 - click) }} />}
      <svg width="18" height="22" viewBox="0 0 18 22"><path d="M1.5 1.5v16.2l4.3-4 2.9 6.6 3-1.3-2.9-6.5h6z" fill="var(--blueprint)" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>
    </div>
  );
}

const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

// Script helpers. A click ring, 0..1 over the 0.45 s after a click at `c`; a button pressed at `c`; text typed over [a, b].
export const ring = (t: number, ...clicks: number[]) => {
  for (const c of clicks) if (t >= c && t < c + 0.45) return (t - c) / 0.45;
  return undefined;
};
export const press = (t: number, c: number) => (t >= c && t < c + 0.15 ? 0.92 : 1);
export const typed = (text: string, t: number, a: number, b: number) => text.slice(0, Math.round(at(t, [[a, 0], [b, text.length]])));

// The one word a film says: it lands letter by letter at `start`, underlined in blueprint, holds, then shrinks
// away into (dx, dy) by `end`, the thing it names. Stage coordinates; `size` in px.
export function Word({ t, text, start, end, x, y, size = 38, dx = 0, dy = 0, ink }: {
  t: number; text: string; start: number; end: number; x: number; y: number; size?: number; dx?: number; dy?: number; ink?: boolean;
}) {
  if (t < start - 0.05 || t > end + 0.1) return null;
  const fly = span(t, end - 0.7, end);
  const line = span(t, start, start + 0.7);
  return (
    <div className={s.word} data-ink={ink || undefined} style={{ left: x, top: y, fontSize: size, opacity: 1 - span(t, end - 0.25, end), transform: `translate(${fly * dx}px, ${fly * dy}px) scale(${1 - fly * 0.7})` }} aria-hidden="true">
      {[...text].map((ch, i) => {
        const k = span(t, start + i * 0.06, start + 0.35 + i * 0.06);
        return <span key={i} style={{ opacity: k, translate: `0 ${(1 - k) * size * 0.45}px` }}>{ch}</span>;
      })}
      <i style={{ scale: `${line} 1` }} />
    </div>
  );
}

// The video's own chrome. In the grid: its length, like a thumbnail, and a progress line while it plays. In the
// viewer: the guide's player, small (play, a track to scrub, the time). The viewer is a drag-to-dismiss panel
// (motion listens natively on it), so a press on the controls stops there.
function Chrome({ t, length, hover, full, paused, onToggle, onSeek, onScrub }: {
  t: number; length: number; hover: boolean; full?: boolean; paused: boolean;
  onToggle: () => void; onSeek: (t: number) => void; onScrub: (on: boolean) => void;
}) {
  const bar = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const stop = (e: PointerEvent) => e.stopPropagation();
    el.addEventListener("pointerdown", stop);
    return () => el.removeEventListener("pointerdown", stop);
  }, [full]);
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(Math.min(length - 0.01, Math.max(0, ((e.clientX - r.left) / r.width) * length)));
  };
  const scrub = (on: boolean) => { held.current = on; onScrub(on); };
  if (!full) return hover
    ? <i className={s.progress} style={{ scale: `${t / length} 1` }} />
    : <span className={s.badge}><svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true"><path d="M0 0l8 4.5L0 9z" fill="currentColor" /></svg>{clock(length)}</span>;
  return (
    <div ref={bar} className={s.controls}>
      <button type="button" className={s.btn} onClick={onToggle} aria-label={paused ? "Play" : "Pause"}>
        {paused
          ? <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2 13 8l-8.5 4.8z" fill="currentColor" /></svg>
          : <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" /><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" /></svg>}
      </button>
      <div
        className={s.track}
        role="slider"
        tabIndex={0}
        aria-label="Film position"
        aria-valuemin={0}
        aria-valuemax={Math.round(length)}
        aria-valuenow={Math.round(t)}
        onPointerDownCapture={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrub(true); seek(e); }}
        onPointerMove={(e) => { if (held.current) seek(e); }}
        onPointerUp={() => scrub(false)}
        onPointerCancel={() => scrub(false)}
        onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.stopPropagation(); onSeek(Math.min(length - 0.01, Math.max(0, t + (e.key === "ArrowRight" ? 1 : -1)))); } }}
      >
        <i style={{ scale: `${t / length} 1` }} />
        <b style={{ left: `${(t / length) * 100}%` }} />
      </div>
      <span className={s.time}>{clock(t)} / {clock(length)}</span>
    </div>
  );
}

export function Film({ length, poster, w, h, cam, full, cover, bg, label, children }: {
  length: number;
  poster: number; // the still the grid shows
  w: number;
  h: number;
  cam: (t: number) => Cam;
  full?: boolean; // in the viewer: autoplay, with controls
  cover?: boolean; // fit the stage's width and let the camera pan up and down it (a stage taller than its tile)
  bg?: string; // the film's colour around the stage
  label: string;
  children: (t: number) => ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { amount: 0.4 });
  const hover = useContext(Play);
  const calm = useCalm();
  const [view, setView] = useState({ fit: 0, bw: 0, bh: 0 });
  const [t, setT] = useState(poster);
  const [paused, setPaused] = useState(false);
  const scrub = useRef(false);
  const playing = !calm && seen && (full ? !paused : hover);

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setView({ fit: cover ? el.clientWidth / w : Math.min(el.clientWidth / w, el.clientHeight / h), bw: el.clientWidth, bh: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h, cover]);

  // Hover plays from the top; leaving goes back to the poster, like a video thumbnail.
  useEffect(() => { if (!full) setT(hover && !calm ? 0 : poster); }, [full, hover, calm, poster]);
  useEffect(() => { if (full) setT(calm ? poster : 0); }, [full, calm, poster]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!scrub.current) setT((v) => (v + dt) % length);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, length]);

  // The camera never looks past the stage's edges: what it sees (vw × vh, stage px) stays inside it.
  const { fit } = view;
  const c = cam(t);
  const vw = view.bw / (fit * c.z || 1), vh = view.bh / (fit * c.z || 1);
  const cx = vw >= w ? w / 2 : Math.min(w - vw / 2, Math.max(vw / 2, c.x));
  const cy = vh >= h ? h / 2 : Math.min(h - vh / 2, Math.max(vh / 2, c.y));
  return (
    <div ref={box} className={s.film} data-tall={(h > w && !cover) || undefined} style={bg ? { background: bg } : undefined} role="img" aria-label={label}>
      <div className={s.stage} style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${fit * c.z}) translate(${w / 2 - cx}px, ${h / 2 - cy}px)` }}>
        {children(t)}
      </div>
      {!calm && <Chrome t={t} length={length} hover={hover} full={full} paused={paused} onToggle={() => setPaused((p) => !p)} onSeek={setT} onScrub={(on) => { scrub.current = on; }} />}
    </div>
  );
}

// A real recording with the same chrome: plays from the top on hover in the grid, with controls in the viewer.
export function Clip({ src, poster, length, full, label }: { src: string; poster: string; length: number; full?: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const seen = useInView(ref, { amount: 0.4 });
  const hover = useContext(Play);
  const calm = useCalm();
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const playing = !calm && seen && (full ? !paused : hover);

  useEffect(() => {
    const v = ref.current!;
    if (!playing) { v.pause(); if (!full) { v.currentTime = 0; setT(0); } return; }
    if (!full) v.currentTime = 0;
    v.play().catch(() => {});
    let raf = 0;
    const step = () => { setT(v.currentTime); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, full]);

  return (
    <div className={s.film}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} className={s.clip} />
      {!calm && <Chrome t={t} length={length} hover={hover} full={full} paused={paused} onToggle={() => setPaused((p) => !p)} onSeek={(x) => { ref.current!.currentTime = x; setT(x); }} onScrub={() => {}} />}
    </div>
  );
}
