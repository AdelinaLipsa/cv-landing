"use client";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type Ref } from "react";
import { steps, starts, total, stepAt } from "@/content/tour";
import { ease } from "@/lib/motion";
import { fit } from "@/lib/scrubber";
import s from "./TourPlayer.module.css";

// The player is a slim horizontal `git log --graph` of her years (research §8, §9): each chapter is a commit on the
// line, her years are the tagged ones, HEAD is the playhead, and at the fork product branches off and runs to the
// end, like the Career graph. Scrubbing back is a checkout: the page un-builds to that commit. Tour's clock writes
// the playhead and the drawn part of the graph straight to the DOM (`--p`, 0..1, on the root).

const PAD = 8; // the track's inset, so the first commit isn't cut off (keep in step with TourPlayer.module.css)
const Y = { dev: 23, product: 10 } as const;
const COLOR = { dev: "var(--broth)", product: "var(--naruto)" } as const;
const FORK = steps.findIndex((st) => st.builds.includes("career.fork"));
const laneOf = (i: number) => (i > FORK ? "product" : "dev");
const AT = starts.map((x) => x / total); // each chapter's start, 0..1
const YEARS = steps.flatMap((st, i) => (st.year ? [i] : []));
const GAP = 30; // px between year labels

function Graph({ w }: { w: number }) {
  const x = (i: number) => PAD + AT[i] * w;
  const fx = x(FORK), end = PAD + w;
  return (
    <>
      <path d={`M${PAD} ${Y.dev}H${end}`} stroke={COLOR.dev} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d={`M${fx} ${Y.dev}C${fx + 8} ${Y.dev} ${fx + 6} ${Y.product} ${fx + 15} ${Y.product}H${end}`} stroke={COLOR.product} strokeWidth="4" strokeLinecap="round" fill="none" />
      {steps.map((st, i) => (st.year
        ? <circle key={i} cx={x(i)} cy={Y[laneOf(i)]} r={w < 300 ? 3.5 : 4.5} fill={i === FORK ? COLOR.product : COLOR[laneOf(i)]} stroke="var(--blueprint)" strokeWidth="1.5" />
        : <circle key={i} cx={x(i)} cy={Y[laneOf(i)]} r="1.4" fill="var(--blueprint)" />))}
    </>
  );
}

export default function TourPlayer({ ref, t, playing, speed, onSeek, onToggle, onPrev, onNext, onSpeed, onClose }: {
  ref?: Ref<HTMLDivElement>;
  t: number;
  playing: boolean;
  speed: number;
  onSeek: (t: number) => void;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeed: () => void;
  onClose: () => void;
}) {
  const i = stepAt(t);
  const track = useRef<HTMLDivElement>(null);
  const proxy = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [drag, setDrag] = useState(false);
  const live = useRef({ onSeek, onToggle, playing });
  live.current = { onSeek, onToggle, playing };

  useEffect(() => {
    const el = track.current!;
    const ro = new ResizeObserver(() => setW(Math.max(0, el.clientWidth - 2 * PAD)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tactile scrub: a Draggable on the playhead (through an unseen proxy, so the clock keeps drawing the real one).
  // Press anywhere on the track to take HEAD there; while held the tour pauses; let go and it eases into the nearest
  // chapter, then plays on if it was playing.
  useEffect(() => {
    if (!w) return;
    gsap.registerPlugin(Draggable);
    const snaps = AT.map((p) => p * w);
    const seek = (x: number) => live.current.onSeek(Math.min(total - 1e-3, Math.max(0, (x / w) * total))); // never the very end: that closes the tour
    const px = () => Number(gsap.getProperty(proxy.current, "x")) || 0;
    let resume = false;
    const settle = () => {
      setDrag(false);
      if (resume) live.current.onToggle();
      resume = false;
    };
    const [d] = Draggable.create(proxy.current, {
      type: "x",
      trigger: track.current,
      bounds: { minX: 0, maxX: w },
      onPress(this: Draggable) {
        gsap.killTweensOf(proxy.current);
        const r = track.current!.getBoundingClientRect();
        gsap.set(proxy.current, { x: Math.min(w, Math.max(0, this.pointerX - scrollX - r.left - PAD)) });
        this.update();
        if (live.current.playing) { resume = true; live.current.onToggle(); }
        setDrag(true);
        seek(this.x);
      },
      onDrag(this: Draggable) { seek(this.x); },
      onRelease(this: Draggable) {
        gsap.to(proxy.current, { x: gsap.utils.snap(snaps, this.x), duration: 0.3, ease: "power3.out", onUpdate: () => seek(px()), onComplete: settle });
      },
    });
    return () => { d.kill(); gsap.killTweensOf(proxy.current); };
  }, [w]);

  // Year labels that fit, less the ones HEAD's tag is over (mono: 6.2px a character at 10px, 5.4px at 9px; the
  // arrow isn't in the mono's subsets and its fallback is ~13.7px, so it counts 1.2 characters extra).
  const tag = `HEAD → ${steps[i].title}`;
  const p = Math.min(1, t / total), tagW = (tag.length + 1.2) * 6.2 + 8, tagL = PAD + p * w - p * tagW;
  const labels = fit(YEARS.map((k) => AT[k] * w), GAP).map((on, n) => {
    const k = YEARS[n], lw = (steps[k].year ?? "").length * 5.4, lx = PAD + AT[k] * w - (n === 0 ? 0 : lw / 2);
    return on && (lx + lw < tagL - 3 || lx > tagL + tagW + 3);
  });

  return (
    <motion.div
      ref={ref}
      className={s.player}
      data-tour-player
      data-drag={drag || undefined}
      initial={{ y: "-160%" }}
      animate={{ y: 0 }} /* it leaves with the caption at the end (Tour.module.css) */
      transition={{ duration: 1.4, ease }}
      role="group"
      aria-label="Build mode controls"
    >
      <button type="button" className={s.btn} onClick={onPrev} aria-label="Previous step">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M12 3.5 5.5 8 12 12.5z" fill="currentColor" /><rect x="3" y="3.5" width="2" height="9" rx="1" fill="currentColor" /></svg>
      </button>
      <button type="button" className={`${s.btn} ${s.play}`} onClick={onToggle} aria-label={playing ? "Pause" : "Play"}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" /><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2 13 8l-8.5 4.8z" fill="currentColor" /></svg>
        )}
      </button>
      <button type="button" className={s.btn} onClick={onNext} aria-label="Next step">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3.5 10.5 8 4 12.5z" fill="currentColor" /><rect x="11" y="3.5" width="2" height="9" rx="1" fill="currentColor" /></svg>
      </button>

      <div
        ref={track}
        className={s.track}
        role="slider"
        tabIndex={0}
        aria-label="Tour timeline"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(t)}
        aria-valuetext={steps[i].title}
      >
        {w > 0 && (
          <>
            <svg className={s.svg} aria-hidden="true">
              <g className={s.ahead}><Graph w={w} /></g>
              {YEARS.map((k, n) => labels[n] && (
                <text key={k} x={PAD + AT[k] * w} y="41" textAnchor={n === 0 ? "start" : "middle"} className={s.year}>{steps[k].year}</text>
              ))}
            </svg>
            <svg className={`${s.svg} ${s.done}`} aria-hidden="true"><Graph w={w} /></svg>
          </>
        )}
        <div className={s.head} data-lane={laneOf(i)} aria-hidden="true">
          <span className={s.dot} />
          <span className={s.tag}>{tag}</span>
        </div>
        <div ref={proxy} className={s.proxy} />
      </div>

      <button type="button" className={`${s.btn} ${s.speed}`} onClick={onSpeed} aria-label={`Speed ${speed}×`}>{speed}×</button>
      <button type="button" className={s.btn} onClick={onClose} aria-label="Close the tour">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </motion.div>
  );
}
