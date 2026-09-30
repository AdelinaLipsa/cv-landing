"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import Image from "next/image";
import { STAGE } from "@/content/tour";
import { land } from "@/lib/motion";
import type { UI } from "../Shell";
import { about, origin, profile, ventures } from "@/content/cv";
import { tiles } from "@/content/wall";
import Label from "../Label";
import Media from "../wall/Media";
import RetroComputer from "../RetroComputer";
import { LinkedInIcon, WhatsAppIcon } from "../Contact";
import Dock from "../Dock";
import VariableProximity from "../VariableProximity";
import RotatingText from "../RotatingText";
import Counter from "../Counter";
import BlurText from "../BlurText";
import HeroCards from "../HeroCards";
import p from "./pane.module.css";
import s from "./Home.module.css";

const preview = ["decoder", "payments", "cs-dashboard"].map((id) => tiles.find((t) => t.id === id)!);

export const Play = () => (
  <span className={p.playDot}>
    <svg width="9" height="9" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.2 13 8l-8.5 4.8z" fill="var(--ink)" /></svg>
  </span>
);

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

// Only things on the CV. Hookwarden and BITE join once Adelina confirms them.
const dockItems = (ui: UI) => [
  { label: "Change log", icon: <Svg><circle cx="6.5" cy="7" r="1.4" /><circle cx="6.5" cy="12" r="1.4" /><circle cx="6.5" cy="17" r="1.4" /><path d="M10.5 7h8M10.5 12h8M10.5 17h5" /></Svg> },
  { label: "CS dashboard", className: "ink-2", icon: <Svg><path d="M4 20V11M9.3 20V5M14.6 20v-7M20 20V8" /></Svg> },
  { label: "Param Decoder", className: "ink", icon: <Svg><path d="M8 5 3.5 12 8 19M16 5l4.5 7L16 19" /><circle cx="12" cy="12" r="2.2" /></Svg> },
  { label: "Ruined Saints", className: "mist", icon: <Svg><ellipse cx="12" cy="7" rx="7" ry="2.6" /><path d="M8 13.5c0 3.5 1.8 6.5 4 6.5s4-3 4-6.5" /></Svg> },
].map((d) => ({ ...d, onClick: () => ui.go(1) }));

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
  const drop = (at: number) => (stage < at ? { "data-drop": "" } : {});
  const buildLabel = touring ? "Stop the build" : ui.returning ? "Replay the build" : "Watch me build it";

  return (
    <div className={`${p.column} ${s.home}`}>
      {touring && era === 0 && <p className={s.construction}>Under construction. Please come back soon!</p>}
      <header className={s.top}>
        <span className={s.mark}><span className={s.monogram}>{profile.initials}</span><span className={s.markName}>{profile.name}</span></span>
        <div className={s.icons}>
          <a href={profile.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" className={s.icon}><LinkedInIcon /></a>
          <button type="button" onClick={ui.contact} aria-label="Message me" className={s.icon}><WhatsAppIcon size={18} /></button>
          <a href={profile.pdf} download className={s.pdf} aria-label="Download CV as PDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" /></svg>
            <span>PDF</span>
          </a>
        </div>
      </header>

      <div className={s.grid}>
        <div className={s.hero} ref={heroRef}>
          <div className={`${p.spec} ${s.portrait}`} data-tour="portrait" data-marks-off={stage < STAGE.portrait || undefined}>
            <Image className={s.photo} src="/adelina.jpg" alt="Adelina Lipșa" width={132} height={132} sizes="(min-width: 1000px) 132px, 96px" priority />
            <span className={`${p.specLabel} ${s.portraitLabel}`}><span className={s.mobileOnly}>96 × 96, radius 28</span><span className={s.desktopOnly}>132 × 132, radius 36</span></span>
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
          <p className={s.role}>
            <b>{profile.role}.</b>{" "}
            <span>
              Full-stack developer before that. Still ships{" "}
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
          <p className={s.about}>{about[0]}</p>
          <div className={s.actions}>
            <button type="button" className={`${p.primary} ${s.buildBtn}`} onClick={ui.build} data-tour="build"><Play />{buildLabel}</button>
            <button type="button" className={p.textLink} onClick={ui.contact}>Message me</button>
          </div>
          {touring && era === 0 && <VisitorCounter />}
          <div className={`${s.dock} ${s.dropper}`} {...drop(STAGE.cards)}>
            <span className={p.muted}>Things I made because they didn’t exist yet</span>
            <Dock items={dockItems(ui)} baseItemSize={60} magnification={92} distance={160} panelHeight={96} dockHeight={96} spring={{ stiffness: 120, damping: 26 }} />
          </div>
        </div>

        {/* Live, not screenshots. */}
        <div className={`${s.cards} ${s.dropper}`} data-tour="cards" {...drop(STAGE.cards)}>
          <HeroCards />
        </div>
      </div>

      <section className={s.preview}>
        <div className={s.previewHead}>
          <h2 className={s.h2}><BlurText text="Things that didn’t exist" animateBy="words" delay={60} /></h2>
          <button type="button" className={s.seeAll} onClick={() => ui.go(1)}>See all</button>
        </div>
        <div className={s.tiles} data-tour="preview">
          {preview.map((t) => (
            <button key={t.id} type="button" className={s.tile} onClick={() => ui.go(1)}>
              <span className={s.media}><Media tile={t} /></span>
              <span className={s.tileTitle}>{t.title}</span>
              <Label kind={t.label} />
            </button>
          ))}
        </div>
      </section>

      <section className={`${s.offDuty} ${s.dropper}`} {...drop(STAGE.offDuty)}>
        <div className={s.offText}>
          <h2 className={s.h2}><BlurText text="Off duty" animateBy="words" delay={60} /></h2>
          {origin.map((o) => <p key={o} className={p.lede}>{o}</p>)}
          <p className={p.lede}>{about[1]}</p>
          <p className={p.lede}>{about[2]}</p>
          <ul className={s.offList}>
            <li><b>{ventures[0].name}</b><span>{ventures[0].note} {ventures[0].role}, {ventures[0].dates}.</span><span className={p.tbc}>[TBC: renders]</span></li>
            <li><b>Sewing</b><span>Sometimes the clothes I’m wearing.</span><span className={p.tbc}>[TBC: photos]</span></li>
            <li><b>Games</b><span>Video games. In the dark. With ramen.</span></li>
          </ul>
          <button type="button" className={s.termBtn} onClick={ui.terminal}>
            <span aria-hidden="true">&gt;_</span> Open the terminal<span className={s.termHint}>, or press `</span>
          </button>
          <p className={s.termNote}>There’s a terminal in here: my career as a git log, the CV as JSON, and a sudo command you should try.</p>
        </div>
        <div className={s.retro} data-tour="retro"><RetroComputer className={s.retroCanvas} /></div>
      </section>
    </div>
  );
}
