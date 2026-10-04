"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, useInView } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import Image from "next/image";
import { STAGE } from "@/content/tour";
import { ease, land } from "@/lib/motion";
import type { UI } from "../Shell";
import { about, beliefs, origin, profile, ventures } from "@/content/cv";
import { tiles } from "@/content/wall";
import { Card, TileLinks } from "./Work";
import RetroComputer from "../RetroComputer";
import Win98 from "../Win98";
import { LinkedInIcon, WhatsAppIcon } from "../Contact";
import Dock from "../Dock";
import VariableProximity from "../VariableProximity";
import RotatingText from "../RotatingText";
import Counter from "../Counter";
import Mark from "../Mark";
import ShuffleHeading from "../ShuffleHeading";
import Land from "../Land";
import Workbench from "../Workbench";
import { Rich } from "../Keyword";
import EqualizerRing from "../EqualizerRing";
import ThemeToggle from "../ThemeToggle";
import Magnet from "../Magnet";
import DecryptedText from "../DecryptedText";
import ElectricBorder from "../ElectricBorder";
import QuickRead from "../QuickRead";
import GuestbookButton from "../Guestbook";
import RoadmapButton from "../Roadmap";
import p from "./pane.module.css";
import s from "./Home.module.css";

// The Work wall's teaser: three things she built that explain themselves at a glance (her creations only,
// it sits under "Things that didn’t exist"). Same tiles as the Work page.
const preview = ["bite", "decoder", "hookwarden"].map((id) => tiles.find((t) => t.id === id)!);

export const Play = () => (
  <span className={p.playDot}>
    <svg width="9" height="9" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2 13 8l-8.5 4.8z" fill="var(--ink)" /></svg>
  </span>
);

// Off duty pieces rise in one after another as they scroll into view.
const rise = (k: number) => ({ initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.5, ease, delay: k * 0.12 } }) as const;

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

// Off the clock, as tags. All her own words: about[1], the old list, and 2026-10-01.
const OFF = ["Video games", "Anime", "Ramen in the dark", "MMA", "Drawing in Procreate", "Electric guitar", "Cats", "Sewing", `${ventures[0].name}, my streetwear label`];

// Public things only: nothing internal to the current employer.
const dockItems = (ui: UI) => [
  { label: "Change log", icon: <Svg><circle cx="6.5" cy="7" r="1.4" /><circle cx="6.5" cy="12" r="1.4" /><circle cx="6.5" cy="17" r="1.4" /><path d="M10.5 7h8M10.5 12h8M10.5 17h5" /></Svg> },
  { label: "Hookwarden", className: "ink-2", icon: <Mark src="/brand/hookwarden-mark.svg" className="dock-mark-tall" /> },
  { label: "BITE", icon: <Image src="/brand/bite.png" alt="" width={200} height={200} className="dock-logo" /> },
  { label: "Param Decoder", className: "ink", icon: <Svg><path d="M8 5 3.5 12 8 19M16 5l4.5 7L16 19" /><circle cx="12" cy="12" r="2.2" /></Svg> },
].map((d) => ({ ...d, onClick: () => ui.go(1) })).concat(
  // Her streetwear label: opens a short recording of its site, the gate and the hero.
  {
    label: "Ruined Saints", className: "ink", icon: <img src="/brand/ruined-saints.svg" alt="" className="dock-wide" />, onClick: () => ui.sheet(ventures[0].name, (
      <>
        <video className={p.sheetVideo} src="/media/ruined-saints.mp4" poster="/media/ruined-saints.jpg" autoPlay muted loop playsInline aria-label="The Ruined Saints site: the PRAY? gate, then the hero" />
        <p className={p.lede}>{ventures[0].note} {ventures[0].role}, {ventures[0].dates}.</p>
      </>
    ))
  }
);

// 2003 only. Rolls up to 42 like the counters that never meant anything.
function VisitorCounter() {
  const [n, setN] = useState(0);
  useEffect(() => { const id = setTimeout(() => setN(42), 400); return () => clearTimeout(id); }, []);
  return (
    <p className={s.counter} data-tour="counter">
      You are visitor{" "}
      <span className={s.counterDigits}>
        <Counter value={n} places={[100000, 10000, 1000, 100, 10, 1]} fontSize={13} padding={2} gap={0} horizontalPadding={0} borderRadius={0} textColor="#555" fontWeight={400} gradientFrom="transparent" gradientTo="transparent" />
      </span>
      . Best viewed at 800 × 600.
    </p>
  );
}

export default function Home({ ui }: { ui: UI }) {
  const heroRef = useRef<HTMLDivElement>(null);
  // The name's width axis follows the cursor, only where there is a cursor and motion is welcome.
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const q = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    setFine(q.matches);
    const on = () => setFine(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  const { era, stage, touring } = ui;
  const reduce = useCalm();
  // The timeline draws itself the first time it scrolls into view: dot, line down to the next dot, dot…
  const originRef = useRef<HTMLOListElement>(null);
  const originOn = useInView(originRef, { once: true, amount: 0.25 });
  const drop = (at: number) => (stage < at ? { "data-drop": "" } : {});
  const quick = <button type="button" className={`${p.primary} ${s.quick}`} onClick={() => ui.sheet("The 30-second version", <QuickRead contact={ui.contact} />)}><DecryptedText text="Busy? Read the 30-second version →" animateOn="hover" speed={40} maxIterations={8} /></button>;
  const [win98, setWin98] = useState(false); // the retro computer, booted
  const buildLabel = touring ? "Stop the build" : ui.returning ? "Replay the build" : "Watch me build it";

  return (
    <div className={`${p.column} ${s.home}`}>
      {touring && era === 0 && <p className={s.construction}>Under construction. Please come back soon!</p>}
      <header className={s.top}>
        <span className={s.mark}><span className={s.monogram}>{profile.initials}</span><span className={s.markName}>{profile.name}</span></span>
        <div className={s.icons}>
          <Magnet padding={24} magnetStrength={3} disabled={!!reduce}><a href={profile.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" className={`${s.icon} ${s.linkedin} water`}><LinkedInIcon /></a></Magnet>
          <Magnet padding={24} magnetStrength={3} disabled={!!reduce}><button type="button" onClick={ui.contact} aria-label="Message me" className={`${s.icon} ${s.whatsapp} water`}><WhatsAppIcon size={18} /></button></Magnet>
          <ThemeToggle className={`${s.icon} water`} />
          <Magnet padding={24} magnetStrength={3} disabled={!!reduce}><a href={profile.pdf} download className={s.pdf} aria-label="Download CV as PDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" /></svg>
            <span>PDF</span>
          </a></Magnet>
        </div>
      </header>

      <div className={s.grid}>
        <div className={s.hero} ref={heroRef}>
          <div className={s.portrait} data-tour="portrait" data-marks-off={stage < STAGE.portrait || undefined}>
            <EqualizerRing className={s.ring} />
            <Image className={s.photo} src="/adelina.jpg" alt="Adelina Lipșa" width={132} height={132} sizes="(min-width: 1000px) 132px, 96px" priority />
            {/* Dark mode: the night photo on the mountain fades in over the day one */}
            <Image className={`${s.photo} ${s.night}`} src="/adelina-night.jpg" alt="" aria-hidden="true" width={132} height={132} sizes="(min-width: 1000px) 132px, 96px" />
            {touring && <span className={`${p.specLabel} ${s.portraitLabel}`}><span className={s.mobileOnly}>96 × 96, radius 28</span><span className={s.desktopOnly}>132 × 132, radius 36</span></span>}
          </div>
          <motion.h1
            key={touring ? `era-${era}` : "built"}
            className={`${s.name} ${touring ? s.refont : ""}`}
            data-tour="name"
            initial={false}
            animate={stage === STAGE.finale ? { scale: [0.94, 1] } : { scale: 1 }}
            transition={land}
          >
            {fine && !touring ? (
              <VariableProximity
                label={profile.name}
                fromFontVariationSettings="'wdth' 120, 'wght' 700"
                toFontVariationSettings="'wdth' 150, 'wght' 800"
                containerRef={heroRef as RefObject<HTMLElement>}
                radius={140}
                falloff="gaussian"
              />
            ) : profile.name}
          </motion.h1>
          <p className={s.role} data-tour="role">
            <b><Rich text={profile.role} />.</b>{" "}
            <span>
              <Rich text="Also a full-stack developer, still shipping" />{" "}
              <RotatingText
                texts={["code.", "dashboards.", "internal tools."]}
                mainClassName={s.rotate}
                splitLevelClassName={s.rotateSplit}
                staggerFrom="last"
                staggerDuration={0.02}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-110%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 26 }}
                rotationInterval={2800}
                auto={!reduce}
              />
            </span>
          </p>
          <p className={s.about}><Rich text={about[0]} /></p>
          <div className={s.actions}>
            <Magnet padding={40} magnetStrength={4} disabled={!!reduce}><button type="button" className={`${p.primary} ${s.buildBtn}`} onClick={ui.build} data-tour="build"><Play />{buildLabel}</button></Magnet>
            <button type="button" className={s.messageBtn} onClick={ui.contact}><WhatsAppIcon size={17} /><DecryptedText text="Message me" animateOn="hover" speed={40} maxIterations={8} /></button>
          </div>
          {/* Skip the cutscene: the whole CV in 30 seconds, for the busy */}
          {!touring && (
            // The recruiter's shortcut: a live current runs round it (React Bits ElectricBorder). Calm mode: just the button.
            <Magnet padding={40} magnetStrength={4} disabled={!!reduce}>
              {reduce ? quick : (
                <ElectricBorder color="#3355ff" speed={0.8} chaos={0.035} borderRadius={23} className={s.quickWrap}>
                  {quick}
                </ElectricBorder>
              )}
            </Magnet>
          )}
          {touring && era === 0 && <VisitorCounter />}
          <div className={`${s.dock} ${s.dropper}`} {...drop(STAGE.cards)}>
            <Dock items={dockItems(ui)} baseItemSize={60} magnification={92} distance={160} panelHeight={96} dockHeight={96} spring={{ stiffness: 120, damping: 26 }} />
          </div>
        </div>

        {/* Four sides of the job: product, people, operations, build */}
        <div className={`${s.cards} ${s.dropper}`} data-tour="cards" {...drop(STAGE.cards)}>
          <Workbench />
        </div>
      </div>

      <section className={s.preview}>
        <div className={s.previewHead}>
          <h2 className={s.h2}><ShuffleHeading text="Things that didn’t exist" /></h2>
          <button type="button" className={s.seeAll} onClick={() => ui.go(1)}><DecryptedText text="See all" animateOn="hover" speed={40} maxIterations={8} /></button>
        </div>
        <div className={s.tiles} data-tour="preview">
          {preview.map((t, i) => (
            <Land key={t.id} className={s.tileWrap} delay={i * 0.09}>
              <button type="button" className={s.tile} onClick={() => ui.go(1)} aria-label={`${t.title}: see it on the Work tab`}>
                <span className={`${s.media} ${s.teaser}`}><Card tile={t} h={260} /></span>
              </button>
              <TileLinks tile={t} />
            </Land>
          ))}
        </div>
      </section>

      <section className={`${s.offDuty} ${s.dropper}`} {...drop(STAGE.offDuty)}>
        <div className={s.offText} data-tour="offduty">
          <h2 className={s.h2}><ShuffleHeading text="Off duty" /></h2>

          {/* Where it started: the road to the dev branch, on a line that draws itself */}
          <ol ref={originRef} className={s.origin} data-on={originOn || undefined}>
            {origin.map((o, i) => (
              <motion.li key={o.when} style={{ "--i": i } as React.CSSProperties} {...rise(i)}><span className={s.when}>{o.when}</span><p><Rich text={o.text} /></p></motion.li>
            ))}
          </ol>

          {/* Off the clock: one sentence, one row of tags */}
          <Land className={s.offBlock} delay={0.05}>
            <span className={s.offHead}>Off the clock</span>
            <p className={s.offLine}>{about[1]}</p>
            <ul className={s.tags}>{OFF.map((t) => <li key={t}>{t}</li>)}</ul>
            <GuestbookButton open={ui.sheet} />
            <RoadmapButton open={ui.sheet} />
          </Land>

          {/* Things I believe: hover one */}
          <Land className={s.offBlock} delay={0.12}>
            <span className={s.offHead}>Things I believe</span>
            <ul className={s.beliefs}>
              {beliefs.map((b) => <li key={b}><DecryptedText text={b} animateOn="hover" speed={35} maxIterations={10} /></li>)}
            </ul>
          </Land>

          <button type="button" className={s.termLink} onClick={ui.terminal}>
            <span aria-hidden="true">&gt;_</span> psst… there’s a terminal in here<span className={s.termHint}>. Press `</span>
          </button>
        </div>
        <div className={s.retro} data-tour="retro">
          <RetroComputer className={s.retroCanvas} character={ui.character} onScreen={() => setWin98(true)} />
          {!touring && <button type="button" className={s.bootBtn} onClick={() => setWin98(true)}><span aria-hidden="true">▶</span> Boot the old computer</button>}
        </div>
        {win98 && <Win98 onClose={() => setWin98(false)} contact={ui.contact} />}
      </section>
    </div>
  );
}
