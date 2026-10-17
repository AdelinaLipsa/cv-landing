"use client";
import { AnimatePresence, animate, motion, MotionConfig, useMotionValue, useTransform, type Transition } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ease, glide, track } from "@/lib/motion";
import { useCalm } from "@/lib/useCalm";
import { useEraShift } from "@/lib/useEraShift";
import { steps, type BuildKey, type Cue } from "@/content/tour";
import { builtAt, jobOf, resolveBuilt, rewindAt, rewindUpto } from "@/lib/direction";
import Boot from "./Boot";
import EasterEggs from "./EasterEggs";
import Toasts from "./Toasts";
import Clock from "./Clock";
import { unlock } from "@/lib/achievements";
import { fromQuery, type Challenge } from "@/lib/challenge";
import Sheet from "./Sheet";
import Contact from "./Contact";
import dynamic from "next/dynamic";
import Home from "./panes/Home";
import Work from "./panes/Work";
import Career from "./panes/Career";
import Skills from "./panes/Skills";
import ClickSpark from "./ClickSpark";
import SoundToggle from "./SoundToggle";
import Rewind from "./Rewind";

import s from "./Shell.module.css";

// Only loaded when used.
const Tour = dynamic(() => import("./Tour"), { ssr: false });
const Stepper = dynamic(() => import("./Tour").then((m) => m.Stepper), { ssr: false });
const Terminal = dynamic(() => import("./Terminal"), { ssr: false });
const Arcade = dynamic(() => import("./Arcade"), { ssr: false });
const SideRays = dynamic(() => import("./SideRays"), { ssr: false }); // starts after the hero room anyway (lib/stagger)

// A first visit's boot screen: its C64 loads alone, then the room's files follow at low priority (Finale fetches them
// again from the cache once the visitor chooses). A return visit has them preloaded by the layout's head script.
const ROOM_FILES = ["/models/room-preview.webp", "/models/room.glb", "/models/character.glb"];

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
  built: (k: BuildKey) => boolean; // is this piece of the page built yet (always, outside the guide)
  job: string | null; // the career job on screen during the guide
  cue: Cue["hot"] | null; // the thing the guide's words are lighting up
  finale: boolean; // the guide's last step
  ended: boolean; // the guide played to its end and closed (the room's lamp warms); a replay clears it
};

// The light in the room: cooler on Work, branch colours on Career, warm lamp light once Off duty is on screen.
const LIGHT: Record<string, [string, string]> = {
  home: ["#F5B53F", "#3355FF"], room: ["#FFB25E", "#EE6E9F"], work: ["#8FB0FF", "#3355FF"], career: ["#F5B53F", "#EE6E9F"], skills: ["#F5B53F", "#3355FF"],
};

export default function Shell({ character }: { character: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [pane, setPane] = useState(0);
  // Explorer: every tab seen at least once.
  const seen = useRef(new Set<number>([0]));
  useEffect(() => { seen.current.add(pane); if (seen.current.size === TABS.length) unlock("explorer"); }, [pane]);
  const [built, setBuilt] = useState<boolean | null>(null);
  const [returning, setReturning] = useState(false);
  const [enter, setEnter] = useState(0); // ms the page takes to come up around the boot monitor; 0: no entrance
  const [touring, setTouring] = useState(false);
  const [step, setStep] = useState(0);
  const [holdMs, setHoldMs] = useState(0); // the tour waits this long (the boot pull-back) before its clock starts
  const [cue, setCue] = useState<Cue["hot"] | null>(null);
  const [ended, setEnded] = useState(false); // the guide played to its end (Tour's onFinish)
  // The rewind before a replay from the page: the era and step it shows (null: not rewinding). `tape` outlives it by
  // the last era change, which runs fast while it is set (Shell.module.css).
  const [rew, setRew] = useState<{ era: number; upto: number } | null>(null);
  const [tape, setTape] = useState(false);
  const [sheet, setSheet] = useState<{ label: string; body: ReactNode } | null>(null);
  const [term, setTerm] = useState(false);
  const [mood, setMood] = useState("home");
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
    const c = fromQuery(new URLSearchParams(location.search).get("challenge"));
    if (c) { setChallenge(c); setArcade(true); history.replaceState(null, "", location.pathname + location.hash); }
  }, []);

  useEffect(() => {
    if (built !== false) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true; po.disconnect(); clearTimeout(late);
      for (const u of ROOM_FILES) fetch(u, { priority: "low" }).catch(() => {});
    };
    const po = new PerformanceObserver((l) => { if (l.getEntries().some((e) => e.name.endsWith("/c64-monitor.glb"))) go(); });
    po.observe({ type: "resource", buffered: true });
    const late = setTimeout(go, 5000); // no C64 (blocked, failed): don't wait for it
    return () => { done = true; po.disconnect(); clearTimeout(late); };
  }, [built]);

  // The dock's hand-drawn nudges ("click me!", "games!") belong to the first screen; past it they'd sit on the content.
  // The panes scroll, not the window, so listen in the capture phase (scroll doesn't bubble) and read the active one.
  useEffect(() => {
    const onScroll = () => {
      const top = document.querySelector<HTMLElement>("[data-pane][data-active]")?.scrollTop ?? 0;
      document.documentElement.toggleAttribute("data-scrolled", Math.max(top, scrollY) > 200);
      const off = pane === 0 && (document.querySelector('[data-tour="offduty"]')?.getBoundingClientRect().top ?? Infinity) < innerHeight * 0.6;
      setMood(off ? "room" : ["home", "work", "career", "skills"][pane]);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => removeEventListener("scroll", onScroll, { capture: true });
  }, [pane]);

  // Easter egg: ` opens a terminal. The rest live in EasterEggs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "`" || t.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      setTerm((v) => !v);
    };
    // No right-click menu, except where typing needs paste/spellcheck. React's onContextMenu (minesweeper flags) still fires.
    const onMenu = (e: MouseEvent) => { if (!(e.target as Element).closest?.("input, textarea, [contenteditable]")) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", onMenu);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("contextmenu", onMenu); };
  }, []);

  const [arcade, setArcade] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null); // from a shared /c/… link: open the arcade at that game
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
  at.current = { pane, touring: touring || rew !== null };

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

  const play = (hold: number) => {
    setStep(0);
    setHoldMs(hold);
    setTouring(true);
  };

  // From the boot screen the page is already 2003 under the pull-back: the guide waits `hold` for it. From the page,
  // the tape rewinds it to 2003 first. Calm: the chapters in a sheet, once Boot has faded.
  const startTour = (from: "boot" | "page", hold = 0) => {
    showBuilt();
    setEnded(false);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTimeout(() => setSheet({ label: "The build, chapter by chapter", body: <Stepper /> }), hold);
      return;
    }
    setSheet(null);
    // The flat era's Open Sans is only fetched once text uses it; ask for it now so it is ready by 2013.
    document.fonts?.load(`300 1em ${getComputedStyle(document.documentElement).getPropertyValue("--font-flat")}`).catch(() => {});
    if (from === "boot") return play(hold);
    import("./Tour").catch(() => {}); // fetched while the tape runs, so step 1 starts as it stops
    setRew({ era: 3, upto: steps.length - 1 });
    setTape(true);
  };

  const onRewind = useCallback((p: number) => {
    const era = rewindAt(p).era, upto = rewindUpto(p);
    setRew((o) => (o && o.era === era && o.upto === upto ? o : { era, upto }));
  }, []);

  const rewound = () => {
    setRew(null);
    play(0);
    setTimeout(() => setTape(false), 400);
  };

  const onStep = useCallback((i: number) => {
    setStep(i);
    goRef.current(steps[i].pane);
  }, []);

  const finish = useCallback(() => setEnded(true), []);

  const endTour = useCallback(() => {
    setRew(null);
    setTape(false);
    setCue(null);
    setTouring(false);
    remember();
  }, []);

  // The era on screen: it follows the step through an era transition (lib/useEraShift, app/eras.css).
  const guide = touring || rew !== null; // the page is the guide's: the tour, or the rewind before it
  const { era, shift } = useEraShift(viewport, touring ? steps[step].era : rew ? rew.era : null);
  const done = rew ? builtAt(rew.upto) : resolveBuilt(touring, step);
  // The thing the guide's words light, on <html> for what has no `ui` (the theme toggle's pulse).
  useEffect(() => {
    const d = document.documentElement.dataset;
    if (touring && cue) d.cue = cue; else delete d.cue;
  }, [touring, cue]);

  const ui: UI = {
    go: (i) => { if (guide) endTour(); go(i, reduce ? { duration: 0 } : track); },
    sheet: (label, body) => setSheet({ label, body }),
    contact: () => { if (guide) endTour(); setSheet({ label: "Contact", body: <Contact /> }); },
    build: () => (guide ? endTour() : startTour("page")),
    terminal: () => setTerm(true),
    touring: guide,
    returning,
    character,
    era,
    built: (k) => done.has(k),
    job: touring ? jobOf(steps[step]) : null,
    cue: touring ? cue : null,
    finale: touring && step === steps.length - 1,
    ended: ended && !guide,
  };

  const panes = [Home, Work, Career, Skills];

  return (
    <MotionConfig reducedMotion="user">
      {/* Boot stays mounted through its exit, the pull-back, over the page coming up behind it. The tour waits for it. */}
      <AnimatePresence>
        {built !== true && (
          <Boot
            key="boot"
            gate={built === null}
            onBuild={(ms) => { setEnter(ms); startTour("boot", ms); }}
            onSkip={(ms) => { setEnter(ms); remember(); showBuilt(); }}
          />
        )}
      </AnimatePresence>
      {built !== false && <>
      <motion.main
        className="gate-shell"
        initial={enter ? (reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }) : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: enter / 1000, ease }}
      >
      {/* Sparks in broth once the page is built. Not during the build, which is its own show. */}
      <ClickSpark sparkColor={guide || reduce ? "transparent" : "#F5B53F"} sparkSize={9} sparkRadius={18} sparkCount={8} duration={500}>
      <div ref={viewport} className={s.viewport} data-era={era} data-shift={shift} data-touring={guide || undefined} data-rewinding={tape || undefined} style={{ "--from": `${dir * 36}px` } as React.CSSProperties}>
        {/* React Bits SideRays: soft light from the top-right corner, in broth and blueprint. Only once the page is "now". */}
        {era === 3 && !reduce && <div className={s.bg}><SideRays rayColor1={LIGHT[mood][0]} rayColor2={LIGHT[mood][1]} speed={1.2} intensity={2} blend={0.5} opacity={0.8} /></div>}
        <motion.div
          className={s.track}
          style={{ x }}
          drag={guide ? false : "x"}
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
              <div data-stage className={s.stage}><Pane ui={ui} /></div>
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
            <path d="M7 8h10a4 4 0 0 1 3.9 4.9l-1 4.3a2 2 0 0 1-3.4.9L14 16h-4l-2.5 2.1a2 2 0 0 1-3.4-.9l-1-4.3A4 4 0 0 1 7 8z" /><g className={s.gameKeys}><path d="M8 11v3M6.5 12.5h3" /><circle cx="15.5" cy="12" r=".6" /><circle cx="17.5" cy="13.5" r=".6" /></g>
          </svg>
        </button>
        </span>
        </div>
      </div>
      </ClickSpark>
      </motion.main>

      {rew && <Rewind onFrame={onRewind} onDone={rewound} />}
      {touring && <Tour holdMs={holdMs} onStep={onStep} onCue={setCue} onFinish={finish} onClose={endTour} />}
      <EasterEggs contact={ui.contact} terminal={ui.terminal} arcade={() => setArcade(true)} />
      {arcade && <Arcade onClose={() => { setArcade(false); setChallenge(null); }} contact={() => { setArcade(false); ui.contact(); }} challenge={challenge} />}
      <Toasts />
      <Clock />

      <AnimatePresence>
        {term && <Terminal onClose={() => setTerm(false)} onContact={ui.contact} onWork={() => ui.go(1)} />}
      </AnimatePresence>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} label={sheet?.label ?? ""}>
        {sheet?.body}
      </Sheet>
      </>}
    </MotionConfig>
  );
}
