"use client";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { steps, starts, total, stepAt, type Cue } from "@/content/tour";
import { cueAt, wordsShown } from "@/lib/direction";
import { ease } from "@/lib/motion";
import { unlock } from "@/lib/achievements";
import s from "./Tour.module.css";
import RBStepper, { Step as RBStep } from "./Stepper";
import TourCamera from "./TourCamera";
import Caption, { asideAt } from "./Caption";

const SPEEDS = [0.5, 1, 1.5, 2];

// holdMs: the clock stays at 0 and the chrome stays hidden while the boot screen pulls back.
export default function Tour({ holdMs, onStep, onCue, onClose }: {
  holdMs: number;
  onStep: (i: number) => void;
  onCue: (c: Cue["hot"] | null) => void;
  onClose: () => void;
}) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [held, setHeld] = useState(holdMs > 0);
  const clock = useRef({ t: 0, playing: true, speed: 1, held: holdMs > 0 });
  clock.current.held = held;
  clock.current.playing = playing;
  clock.current.speed = speed;

  const i = stepAt(t);
  const step = steps[i];
  const local = t - starts[i];
  const finished = t >= total;

  // Tell the shell which step we're on (it slides panes and restyles eras).
  useEffect(() => { onStep(i); }, [i, onStep]);
  useEffect(() => {
    if (!holdMs) return;
    const id = setTimeout(() => setHeld(false), holdMs);
    return () => clearTimeout(id);
  }, [holdMs]);
  const cue = cueAt(step, local);
  useEffect(() => { onCue(cue); }, [cue, onCue]);

  // The one clock. Speed scales it, so captions, steps and progress stay in sync.
  // It re-renders only when a word comes in (or the aside); the progress bar is written straight to the DOM.
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let shown = "";
    const loop = (now: number) => {
      const c = clock.current;
      if (c.playing && !c.held && c.t < total) {
        c.t = Math.min(total, c.t + (Math.max(0, now - last) / 1000) * c.speed); // first frame can predate `last`
        const k = stepAt(c.t);
        const st = steps[k], local = c.t - starts[k];
        const key = `${k}:${wordsShown(st.say, local)}:${local >= asideAt(st)}:${c.t >= total}`;
        if (key !== shown) { shown = key; setT(c.t); }
      }
      if (bar.current) bar.current.style.transform = `scaleX(${c.t / total})`;
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seek = (to: number) => { clock.current.t = Math.max(0, Math.min(total, to)); setT(clock.current.t); };
  const toggle = () => {
    if (finished) { seek(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  };

  // At the end: hold the last line, then close. The page stays built.
  useEffect(() => {
    if (!finished) return;
    unlock("tour");
    setPlaying(false);
    const id = setTimeout(onClose, 3200);
    return () => clearTimeout(id);
  }, [finished, onClose]);

  // Keys: space pauses, arrows seek 5s, Esc closes. Any manual scroll pauses.
  const api = useRef({ toggle, seek, onClose });
  api.current = { toggle, seek, onClose };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = api.current;
      if (e.key === " ") { e.preventDefault(); a.toggle(); }
      else if (e.key === "ArrowRight") a.seek(clock.current.t + 5);
      else if (e.key === "ArrowLeft") a.seek(clock.current.t - 5);
      else if (e.key === "Escape") a.onClose();
    };
    const pause = () => setPlaying(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", pause, { passive: true });
    window.addEventListener("touchmove", pause, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", pause);
      window.removeEventListener("touchmove", pause);
    };
  }, []);

  if (held) return null;
  return (
    <div className={s.tour}>
      <TourCamera target={step.target} pane={step.pane} finale={i === steps.length - 1} paused={!playing && !finished} />
      <Caption step={step} local={local} paused={!playing && !finished} />

      <motion.div className={s.notch} initial={{ y: "-110%" }} animate={{ y: finished ? "-110%" : 0 }} transition={{ duration: 1.4, ease }} role="toolbar" aria-label="Build mode controls" data-tour-player>
        <div className={s.row}>
          <button type="button" className={s.icon} onClick={() => seek(starts[Math.max(0, i - (local < 1 ? 1 : 0))])} aria-label="Previous step">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M12 3.5 5.5 8 12 12.5z" fill="#fff" /><rect x="3" y="3.5" width="2" height="9" rx="1" fill="#fff" /></svg>
          </button>
          <button type="button" className={s.play} onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="#fff" /><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="#fff" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2 13 8l-8.5 4.8z" fill="#fff" /></svg>
            )}
          </button>
          <button type="button" className={s.icon} onClick={() => seek(starts[Math.min(steps.length - 1, i + 1)])} aria-label="Next step">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3.5 10.5 8 4 12.5z" fill="#fff" /><rect x="11" y="3.5" width="2" height="9" rx="1" fill="#fff" /></svg>
          </button>
          <span className={s.title}><b>{step.title}</b><small>{i + 1} of {steps.length}</small></span>
          <button type="button" className={s.speed} onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Change speed">{speed}×</button>
          <button type="button" className={s.icon} onClick={onClose} aria-label="Close the tour">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <span className={s.progress}><span ref={bar} style={{ transform: `scaleX(${t / total})` }} /></span>
      </motion.div>
    </div>
  );
}


// Reduced motion: no build. The chapters become a static stepper (React Bits Stepper).
export function Stepper() {
  return (
    <RBStepper backButtonText="Previous" nextButtonText="Next" stepCircleContainerClassName={s.stepperBox}>
      {steps.map((st, i) => (
        <RBStep key={i}>
          <span className={s.stepperCount}>{st.title}</span>
          <p className={s.stepperSay}>{st.say}</p>
          {st.web && <p className={s.stepperWeb}>{st.web}</p>}
        </RBStep>
      ))}
    </RBStepper>
  );
}
