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

export function Film({ length, poster, w, h, cam, full, label, children }: {
  length: number;
  poster: number; // the still the grid shows
  w: number;
  h: number;
  cam: (t: number) => Cam;
  full?: boolean; // in the viewer: autoplay, with controls
  label: string;
  children: (t: number) => ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { amount: 0.4 });
  const hover = useContext(Play);
  const calm = useCalm();
  const [fit, setFit] = useState(0);
  const [t, setT] = useState(poster);
  const [paused, setPaused] = useState(false);
  const scrub = useRef(false);
  const playing = !calm && seen && (full ? !paused : hover);

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setFit(Math.min(el.clientWidth / w, el.clientHeight / h)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

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

  // The viewer is a drag-to-dismiss panel (motion listens natively on it): keep a scrub from dragging it.
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const stop = (e: PointerEvent) => e.stopPropagation();
    el.addEventListener("pointerdown", stop);
    return () => el.removeEventListener("pointerdown", stop);
  }, [full, calm]);

  const c = cam(t);
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setT(Math.min(length - 0.01, Math.max(0, ((e.clientX - r.left) / r.width) * length)));
  };

  return (
    <div ref={box} className={s.film} role="img" aria-label={label}>
      <div className={s.stage} style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${fit * c.z}) translate(${w / 2 - c.x}px, ${h / 2 - c.y}px)` }}>
        {children(t)}
      </div>
      {!calm && !full && (
        hover
          ? <i className={s.progress} style={{ scale: `${t / length} 1` }} />
          : <span className={s.badge}><svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true"><path d="M0 0l8 4.5L0 9z" fill="currentColor" /></svg>{clock(length)}</span>
      )}
      {full && !calm && (
        <div ref={bar} className={s.controls}>
          <button type="button" className={s.btn} onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}>
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
            aria-valuemax={length}
            aria-valuenow={Math.round(t)}
            onPointerDownCapture={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrub.current = true; seek(e); }}
            onPointerMove={(e) => { if (scrub.current) seek(e); }}
            onPointerUp={() => { scrub.current = false; }}
            onPointerCancel={() => { scrub.current = false; }}
            onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.stopPropagation(); setT((v) => Math.min(length - 0.01, Math.max(0, v + (e.key === "ArrowRight" ? 1 : -1)))); } }}
          >
            <i style={{ scale: `${t / length} 1` }} />
            <b style={{ left: `${(t / length) * 100}%` }} />
          </div>
          <span className={s.time}>{clock(t)} / {clock(length)}</span>
        </div>
      )}
    </div>
  );
}
