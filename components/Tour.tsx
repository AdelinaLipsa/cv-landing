"use client";
import { useEffect, useRef, useState } from "react";
import { steps, starts, total, stepAt, type Cue } from "@/content/tour";
import { cueAt, wordsShown } from "@/lib/direction";
import { unlock } from "@/lib/achievements";
import s from "./Tour.module.css";
import RBStepper, { Step as RBStep } from "./Stepper";
import TourCamera from "./TourCamera";
import Caption, { asideAt } from "./Caption";
import TourPlayer from "./TourPlayer";

const SPEEDS = [0.5, 1, 1.5, 2];

// holdMs: the clock stays at 0 and the chrome stays hidden while the boot screen pulls back.
export default function Tour({ holdMs, onStep, onCue, onFinish, onClose }: {
  holdMs: number;
  onStep: (i: number) => void;
  onCue: (c: Cue["hot"] | null) => void;
  onFinish: () => void; // played to the end (not stopped): the room's lamp warms when it closes
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
  // It re-renders only when a word comes in (or the aside); the player's playhead is written straight to the DOM.
  const player = useRef<HTMLDivElement>(null);
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
      player.current?.style.setProperty("--p", String(c.t / total));
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
  // Previous: back to this step's start, or to the one before if it has only just begun.
  const prev = () => { const k = stepAt(clock.current.t); seek(starts[Math.max(0, k - (clock.current.t - starts[k] < 1 ? 1 : 0))]); };
  const next = () => seek(starts[Math.min(steps.length - 1, stepAt(clock.current.t) + 1)]);

  // At the end, once the camera has landed (at 1x it already has): her last line holds, the caption and player sink
  // out (Tour.module.css, data-done), and the guide closes 3.2s in, as they go. The page stays built.
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(false);
    if (!finished) return;
    setPlaying(false);
    let id = 0, raf = 0;
    const landed = () => {
      if (document.querySelector("[data-camera]")) { raf = requestAnimationFrame(landed); return; }
      setDone(true);
      onFinish();
      // The achievement toast waits for the player to leave: it drops in at the top, where the player sits.
      id = window.setTimeout(() => { unlock("tour"); onClose(); }, 3200);
    };
    landed();
    return () => { cancelAnimationFrame(raf); clearTimeout(id); };
  }, [finished, onFinish, onClose]);

  // Keys: space pauses, arrows go a step back or on, Esc closes. During the start hold only Esc works.
  // Space on a focused button presses that button. Any manual scroll pauses.
  const api = useRef({ toggle, prev, next, onClose });
  api.current = { toggle, prev, next, onClose };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = api.current;
      if (e.key === "Escape") { a.onClose(); return; }
      if (clock.current.held) return;
      if (e.key === " ") {
        if ((e.target as HTMLElement | null)?.closest?.("button")) return;
        e.preventDefault();
        a.toggle();
      }
      else if (e.key === "ArrowRight") { e.preventDefault(); a.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); a.prev(); }
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
    <div className={s.tour} data-done={done || undefined}>
      <TourCamera target={step.target} pane={step.pane} finale={i === steps.length - 1} paused={!playing && !finished} />
      <Caption step={step} local={local} paused={!playing && !finished} />

      <TourPlayer
        ref={player}
        t={t}
        playing={playing}
        speed={speed}
        onSeek={seek}
        onToggle={toggle}
        onPrev={prev}
        onNext={next}
        onSpeed={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
        onClose={onClose}
      />
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
