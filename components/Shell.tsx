"use client";
import { AnimatePresence, animate, motion, MotionConfig, useMotionValue, useTransform, type Transition } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { glide, track } from "@/lib/motion";
import { useCalm } from "@/lib/useCalm";
import { steps, STAGE } from "@/content/tour";
import Boot from "./Boot";
import EasterEggs from "./EasterEggs";
import Toasts from "./Toasts";
import Clock from "./Clock";
import Cat from "./Cat";
import { unlock } from "@/lib/achievements";
import Arcade from "./Arcade";
import Sheet from "./Sheet";
import Contact from "./Contact";
import dynamic from "next/dynamic";
import type { Snippets } from "./Tour";
import Home from "./panes/Home";
import Work from "./panes/Work";
import Career from "./panes/Career";
import Skills from "./panes/Skills";
import ClickSpark from "./ClickSpark";
import SideRays from "./SideRays";
import SoundToggle from "./SoundToggle";

import s from "./Shell.module.css";

// Only loaded when used.
const Tour = dynamic(() => import("./Tour"), { ssr: false });
const Stepper = dynamic(() => import("./Tour").then((m) => m.Stepper), { ssr: false });
const Terminal = dynamic(() => import("./Terminal"), { ssr: false });

const TABS = ["Home", "Work", "Career", "Skills"] as const;
const BUILT_KEY = "cv-built"; // when the intro was last seen (ms); it shows again after a day
const DAY = 864e5;

export type UI = {
  go: (pane: number) => void;
  sheet: (label: string, body: ReactNode) => void;
  contact: () => void;
  build: () => void;
  terminal: () => void;
  touring: boolean;
  returning: boolean;
  character: boolean;
  era: number;
  stage: number;
};

export default function Shell({ code, character }: { code: Snippets; character: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [pane, setPane] = useState(0);
  // Explorer: every tab seen at least once.
  const seen = useRef(new Set<number>([0]));
  useEffect(() => { seen.current.add(pane); if (seen.current.size === TABS.length) unlock("explorer"); }, [pane]);
  const [built, setBuilt] = useState<boolean | null>(null);
  const [returning, setReturning] = useState(false);
  const [touring, setTouring] = useState(false);
  const [step, setStep] = useState(0);
  const [sheet, setSheet] = useState<{ label: string; body: ReactNode } | null>(null);
  const [term, setTerm] = useState(false);
  const reduce = useCalm();
  const x = useMotionValue(0);
  // The pill follows the track itself, so it moves with drags, tabs and tour steps alike.
  const pillX = useTransform(x, (v) => `${w ? (-v / w) * 100 : 0}%`);

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return; // Boot is showing, the shell isn't mounted yet
    setW(el.clientWidth); // now, not on the observer's first callback: until then the drag is clamped to 0
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [built]);

  useLayoutEffect(() => { x.set(-pane * w); }, [w]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const i = TABS.findIndex((t) => `#${t.toLowerCase()}` === location.hash);
    let stored = false;
    try { stored = Date.now() - Number(localStorage.getItem(BUILT_KEY)) < DAY; } catch {}
    setReturning(stored);
    setBuilt(document.documentElement.dataset.built === "1");
    if (i > 0) setPane(i);
    if (location.hash === "#contact") setSheet({ label: "Contact", body: <Contact /> });
  }, []);

  // Easter egg: ` opens a terminal. The rest live in EasterEggs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "`" || t.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      setTerm((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [arcade, setArcade] = useState(false);
  const [dir, setDir] = useState(1); // which side the next page's blocks slide in from
  const go = useCallback((i: number, how: Transition = track) => {
    if (i !== at.current.pane) setDir(i > at.current.pane ? 1 : -1);
    setPane(i);
    animate(x, -i * w, how);
    history.replaceState(null, "", i ? `#${TABS[i].toLowerCase()}` : location.pathname);
  }, [w, x]);
  const goRef = useRef(go);
  goRef.current = go;
  const at = useRef({ pane, touring });
  at.current = { pane, touring };

  // Trackpad sideways swipe (or shift+wheel) turns the page, one pane per gesture.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    let sum = 0, locked = false, idle = 0;
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (at.current.touring || Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      // Leave sideways scrollers inside a pane (code, carousels) alone.
      for (let n = e.target as HTMLElement | null; n && n !== el; n = n.parentElement) {
        if (n.scrollWidth > n.clientWidth && /auto|scroll/.test(getComputedStyle(n).overflowX)) return;
      }
      e.preventDefault(); // stops the browser's back/forward swipe
      clearTimeout(idle);
      idle = window.setTimeout(() => { sum = 0; locked = false; }, 180); // gesture (and its inertia) is over
      if (locked) return;
      sum += dx;
      if (Math.abs(sum) < 60) return;
      const next = Math.max(0, Math.min(TABS.length - 1, at.current.pane + Math.sign(sum)));
      locked = true;
      if (next !== at.current.pane) goRef.current(next, glide);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => { el.removeEventListener("wheel", onWheel); clearTimeout(idle); };
  }, [built]);

  const remember = () => {
    try { localStorage.setItem(BUILT_KEY, String(Date.now())); } catch {}
    setReturning(true);
  };

  const showBuilt = () => {
    document.documentElement.dataset.built = "1";
    setBuilt(true);
  };

  const startTour = () => {
    showBuilt();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSheet({ label: "The build, chapter by chapter", body: <Stepper /> });
      return;
    }
    setSheet(null);
    setStep(0);
    setTouring(true);
  };

  const onStep = useCallback((i: number) => {
    setStep(i);
    goRef.current(steps[i].pane);
  }, []);

  const endTour = useCallback(() => {
    setTouring(false);
    remember();
  }, []);

  const era = touring ? steps[step].era : 3;
  const stage = touring ? steps[step].stage : STAGE.all;

  const ui: UI = {
    go: (i) => { if (touring) endTour(); go(i); },
    sheet: (label, body) => setSheet({ label, body }),
    contact: () => { if (touring) endTour(); setSheet({ label: "Contact", body: <Contact /> }); },
    build: () => (touring ? endTour() : startTour()),
    terminal: () => setTerm(true),
    touring,
    returning,
    character,
    era,
    stage,
  };

  const boot = <Boot onBuild={startTour} onSkip={() => { remember(); showBuilt(); }} />;
  if (built === false) return boot;

  const panes = [Home, Work, Career, Skills];

  return (
    <MotionConfig reducedMotion="user">
      {built === null && <div className="gate-boot">{boot}</div>}
      <main className="gate-shell">
      {/* Sparks in broth once the page is built. Not during the build, which is its own show. */}
      <ClickSpark sparkColor={touring || reduce ? "transparent" : "#F5B53F"} sparkSize={9} sparkRadius={18} sparkCount={8} duration={500}>
      <div ref={viewport} className={s.viewport} data-era={era} data-touring={touring || undefined} style={{ "--from": `${dir * 36}px` } as React.CSSProperties}>
        {/* React Bits SideRays: soft light from the top-right corner, in broth and blueprint. Only once the page is "now". */}
        {era === 3 && !reduce && <div className={s.bg}><SideRays rayColor1="#F5B53F" rayColor2="#3355FF" speed={1.2} intensity={2} blend={0.5} opacity={0.8} /></div>}
        <motion.div
          className={s.track}
          style={{ x }}
          drag={touring ? false : "x"}
          dragDirectionLock
          dragMomentum={false}
          dragElastic={0.14}
          dragConstraints={{ left: -(TABS.length - 1) * w, right: 0 }}
          onDragEnd={(_, info) => {
            // A fifth of the screen, or a flick, turns the page. Halfway felt stuck.
            const dir = info.offset.x < -w * 0.2 || info.velocity.x < -500 ? 1 : info.offset.x > w * 0.2 || info.velocity.x > 500 ? -1 : 0;
            const i = Math.max(0, Math.min(TABS.length - 1, pane + dir));
            go(i, { ...glide, velocity: info.velocity.x });
          }}
        >
          {panes.map((Pane, i) => (
            <section key={TABS[i]} data-pane data-active={i === pane || undefined} className={s.pane} aria-label={TABS[i]} aria-hidden={i !== pane} inert={i !== pane}>
              <Pane ui={ui} />
            </section>
          ))}
        </motion.div>

        <div className={s.chrome}>
        <nav className={s.tabbar} aria-label="Primary">
          <motion.span className={s.pill} style={{ x: pillX }} aria-hidden="true" />
          {TABS.map((t, i) => (
            <button
              key={t}
              type="button"
              className={s.tab}
              aria-current={i === pane ? "page" : undefined}
              onClick={() => ui.go(i)}
            >
              {t}
            </button>
          ))}
        </nav>
        <SoundToggle />
        {/* The arcade, findable: a gamepad next to the sound, with its own hand-drawn nudge */}
        <span className={s.gameWrap}>
        <span className={s.gameNudge} aria-hidden="true">
          <svg width="40" height="36" viewBox="0 0 46 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4c14 2 26 10 30 26" /><path d="M28 26l8 6 3-10" /></svg>
          <span>games!</span>
        </span>
        <button type="button" className={`${s.game} water`} onClick={() => setArcade(true)} aria-label="Open the arcade: three tiny games" title="Arcade: three tiny games">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 8h10a4 4 0 0 1 3.9 4.9l-1 4.3a2 2 0 0 1-3.4.9L14 16h-4l-2.5 2.1a2 2 0 0 1-3.4-.9l-1-4.3A4 4 0 0 1 7 8z" /><path d="M8 11v3M6.5 12.5h3" /><circle cx="15.5" cy="12" r=".6" fill="currentColor" /><circle cx="17.5" cy="13.5" r=".6" fill="currentColor" />
          </svg>
        </button>
        </span>
        </div>
      </div>
      </ClickSpark>
      </main>

      {touring && <Tour code={code} onStep={onStep} onClose={endTour} />}
      <EasterEggs contact={ui.contact} terminal={ui.terminal} />
      {arcade && <Arcade onClose={() => setArcade(false)} />}
      <Toasts />
      <Clock />
      {!touring && <Cat />}

      <AnimatePresence>
        {term && <Terminal onClose={() => setTerm(false)} onContact={ui.contact} onWork={() => ui.go(1)} />}
      </AnimatePresence>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} label={sheet?.label ?? ""}>
        {sheet?.body}
      </Sheet>
    </MotionConfig>
  );
}
