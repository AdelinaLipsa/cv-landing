"use client";
import { motion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { steps, starts, total, stepAt, type Step } from "@/content/tour";
import { glide, ease } from "@/lib/motion";
import { unlock } from "@/lib/achievements";
import s from "./Tour.module.css";
import RBStepper, { Step as RBStep } from "./Stepper";

const SPEEDS = [0.5, 1, 1.5, 2];
const TYPE_CPS = 28;
const CODE_CPS = 60;

export type Snippets = Record<NonNullable<Step["code"]>, { path: string; text: string }>;

function findTarget(sel: string) {
  for (const el of document.querySelectorAll<HTMLElement>(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

const labelFor = (st: Step) => (typeof st.label === "string" ? st.label : innerWidth >= 1000 ? st.label[1] : st.label[0]);

export default function Tour({ code, onStep, onClose }: {
  code: Snippets;
  onStep: (i: number) => void;
  onClose: () => void;
}) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const clock = useRef({ t: 0, playing: true, speed: 1 });
  clock.current.playing = playing;
  clock.current.speed = speed;

  const i = stepAt(t);
  const step = steps[i];
  const local = t - starts[i];
  const finished = t >= total;

  // Tell the shell which step we're on (it slides panes and restyles eras).
  useEffect(() => { onStep(i); }, [i, onStep]);

  // Scroll the target into view inside its pane, eased by the browser.
  useEffect(() => {
    const id = setTimeout(() => {
      // Only the pane scrolls, vertically. scrollIntoView would also nudge the sliding track sideways.
      const el = findTarget(step.target);
      const pane = el?.closest<HTMLElement>("[data-pane]");
      if (!el || !pane) return;
      const r = el.getBoundingClientRect(), pr = pane.getBoundingClientRect();
      pane.scrollTo({ top: pane.scrollTop + (r.top - pr.top) - (pane.clientHeight - Math.min(r.height, pane.clientHeight)) / 2, behavior: "smooth" });
    }, 400);
    return () => clearTimeout(id);
  }, [step]);

  // The one clock. Speed scales it, so typing, steps and progress stay in sync.
  // It re-renders only when a typed character changes; the progress bar is written straight to the DOM.
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let shown = "";
    const loop = (now: number) => {
      const c = clock.current;
      if (c.playing && c.t < total) {
        c.t = Math.min(total, c.t + (Math.max(0, now - last) / 1000) * c.speed); // first frame can predate `last`
        const k = stepAt(c.t);
        const st = steps[k], local = c.t - starts[k];
        // Typing ends at the line's length (+8 for the web aside), the code at its length: no renders after that.
        const typedN = Math.min(Math.floor(local * TYPE_CPS), st.say.length + 8);
        const codeN = st.code ? Math.min(Math.floor(local * CODE_CPS), code[st.code].text.length) : 0;
        const key = `${k}:${typedN}:${codeN}:${c.t >= total}`;
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

  // Outline, cursor and bubble chase the live target rect on glide springs.
  const ox = useSpring(0, glide), oy = useSpring(0, glide), ow = useSpring(0, glide), oh = useSpring(0, glide);
  const cx = useSpring(0, glide), cy = useSpring(0, glide);
  const bx = useSpring(0, glide), by = useSpring(0, glide);
  const bubble = useRef<HTMLDivElement>(null);
  const [above, setAbove] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    let raf = 0;
    let el: HTMLElement | null = null;
    const frame = () => {
      // Look the target up once per step, again only if it went away (re-render, layout switch).
      let r = el?.isConnected ? el.getBoundingClientRect() : null;
      if (!r || !r.width || !r.height) { el = findTarget(step.target); r = el?.getBoundingClientRect() ?? null; }
      if (el && r) {
        const vw = innerWidth, vh = innerHeight;
        const top = Math.max(r.top, 70), bottom = Math.min(r.bottom, vh - 90);
        const px = Math.min(Math.max(r.left + Math.min(r.width * 0.72, r.width - 12), 10), vw - 30);
        const py = Math.min(Math.max(top + (bottom - top) * 0.6, 80), vh - 110);
        const bw = bubble.current?.offsetWidth ?? 266, bh = bubble.current?.offsetHeight ?? 60;
        const up = py + 26 + bh > vh - 90;
        const set = first.current ? "jump" : "set";
        // Keep the outline and its label on screen, even for full-bleed targets.
        const l = Math.max(r.left - 8, 6), rt = Math.min(r.right + 8, vw - 6);
        ox[set](l); oy[set](r.top - 8); ow[set](rt - l); oh[set](r.height + 16);
        cx[set](px); cy[set](py);
        bx[set](Math.min(Math.max(px + 6, 12), vw - bw - 12));
        by[set](up ? py - 14 - bh : py + 26);
        setAbove(up);
        first.current = false;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [step, ox, oy, ow, oh, cx, cy, bx, by]);

  const typed = !playing && !finished ? "Presentation paused." : step.say.slice(0, Math.floor(local * TYPE_CPS));
  const snippet = step.code ? code[step.code] : null;
  const codeTyped = snippet ? snippet.text.slice(0, Math.floor(local * CODE_CPS)) : "";

  return (
    <div className={s.tour}>
      <motion.div className={s.frame} initial={{ opacity: 0 }} animate={{ opacity: finished ? 0 : 1 }} transition={{ duration: 1.5, ease }} />

      <motion.div className={s.outline} style={{ x: ox, y: oy, width: ow, height: oh }} aria-hidden="true">
        <span className={s.outlineLabel}>{labelFor(step)}</span>
      </motion.div>

      {snippet && (
        <motion.pre key={step.code} className={s.code} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={glide} aria-hidden="true">
          <span className={s.codePath}>{snippet.path}</span>
          {codeTyped}<span className={s.caret} />
        </motion.pre>
      )}

      <motion.div
        ref={bubble}
        className={`${s.bubble} ${above ? s.above : ""}`}
        style={{ x: bx, y: by }}
        aria-live="polite"
      >
        <img src="/adelina.jpg" alt="" className={s.avatar} />
        <span className={s.bubbleText}>
          <span>{typed}<span className={s.caret} /></span>
          {/* The web's history is the aside, shown once her line has finished. */}
          {step.web && playing && local * TYPE_CPS >= step.say.length + 8 && (
            <motion.small className={s.web} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>{step.web}</motion.small>
          )}
        </span>
      </motion.div>

      <motion.div className={s.cursor} style={{ x: cx, y: cy }} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2.5 19.5 12l-6.8 1.6L9.3 20z" fill="#3355FF" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      </motion.div>

      <motion.div className={s.notch} initial={{ y: "-110%" }} animate={{ y: finished ? "-110%" : 0 }} transition={{ duration: 1.4, ease }} role="toolbar" aria-label="Build mode controls">
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
