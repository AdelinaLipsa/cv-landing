"use client";
import { AnimatePresence, animate, motion, MotionConfig, useMotionValue, useTransform, type Transition } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { glide, track } from "@/lib/motion";
import { useCalm } from "@/lib/useCalm";
import { steps, STAGE } from "@/content/tour";
import Boot from "./Boot";
import Sheet from "./Sheet";
import Contact from "./Contact";
import dynamic from "next/dynamic";
import type { Snippets } from "./Tour";
import Home from "./panes/Home";
import Work from "./panes/Work";
import Career from "./panes/Career";
import Skills from "./panes/Skills";
import ClickSpark from "./ClickSpark";
import SoundToggle from "./SoundToggle";

import s from "./Shell.module.css";

// Only loaded when used.
const Tour = dynamic(() => import("./Tour"), { ssr: false });
const Stepper = dynamic(() => import("./Tour").then((m) => m.Stepper), { ssr: false });
const Terminal = dynamic(() => import("./Terminal"), { ssr: false });

const TABS = ["Home", "Work", "Career", "Skills"] as const;
const BUILT_KEY = "cv-built";

export type UI = {
  go: (pane: number) => void;
  sheet: (label: string, body: ReactNode) => void;
  contact: () => void;
  build: () => void;
  terminal: () => void;
  touring: boolean;
  returning: boolean;
  era: number;
  stage: number;
};

export default function Shell({ code }: { code: Snippets }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [pane, setPane] = useState(0);
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
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [built]);

  useLayoutEffect(() => { x.set(-pane * w); }, [w]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const i = TABS.findIndex((t) => `#${t.toLowerCase()}` === location.hash);
    let stored = false;
    try { stored = localStorage.getItem(BUILT_KEY) === "1"; } catch {}
    setReturning(stored);
    setBuilt(document.documentElement.dataset.built === "1");
    if (i > 0) setPane(i);
    if (location.hash === "#contact") setSheet({ label: "Contact", body: <Contact /> });
  }, []);

  // Easter eggs: a note in devtools, and ` opens a terminal.
  useEffect(() => {
    console.log(
      "%cHi, it’s Adelina.%c\nYou opened devtools, so you’re my kind of person.\nThe whole CV is JSON at /api/cv, and ` opens a terminal.",
      "font: 700 16px sans-serif; color: #3355FF",
      "font: 13px sans-serif; color: #6B6990"
    );
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "`" || t.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      setTerm((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback((i: number, how: Transition = track) => {
    setPane(i);
    animate(x, -i * w, how);
    history.replaceState(null, "", i ? `#${TABS[i].toLowerCase()}` : location.pathname);
  }, [w, x]);
  const goRef = useRef(go);
  goRef.current = go;

  const remember = () => {
    try { localStorage.setItem(BUILT_KEY, "1"); } catch {}
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
      <div ref={viewport} className={s.viewport} data-era={era} data-touring={touring || undefined}>
        <motion.div
          className={s.track}
          style={{ x }}
          drag={touring ? false : "x"}
          dragDirectionLock
          dragMomentum={false}
          dragElastic={0.14}
          dragConstraints={{ left: -(TABS.length - 1) * w, right: 0 }}
          onDragEnd={(_, info) => {
            const projected = x.get() + info.velocity.x * 0.25;
            const i = Math.max(0, Math.min(TABS.length - 1, Math.round(-projected / w)));
            go(i, { ...glide, velocity: info.velocity.x });
          }}
        >
          {panes.map((Pane, i) => (
            <section key={TABS[i]} data-pane className={s.pane} aria-label={TABS[i]} aria-hidden={i !== pane} inert={i !== pane}>
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
        </div>
      </div>
      </ClickSpark>
      </main>

      {touring && <Tour code={code} onStep={onStep} onClose={endTour} />}

      <AnimatePresence>
        {term && <Terminal onClose={() => setTerm(false)} onContact={ui.contact} onWork={() => ui.go(1)} />}
      </AnimatePresence>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} label={sheet?.label ?? ""}>
        {sheet?.body}
      </Sheet>
    </MotionConfig>
  );
}
