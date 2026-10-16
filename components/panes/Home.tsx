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
// import RetroComputer from "../RetroComputer"; // Off duty's computer: the room in the hero has her PC now
import Win95 from "../Win95";
import { LinkedInIcon, WhatsAppIcon } from "../Contact";
import Dock from "../Dock";
import VariableProximity from "../VariableProximity";
import RotatingText from "../RotatingText";
import Counter from "../Counter";
import Mark from "../Mark";
import ShuffleHeading from "../ShuffleHeading";
import Land from "../Land";
// import Workbench from "../Workbench"; // the room took its spot in the hero
import Finale, { type Prop } from "../Finale";
import { Rich } from "../Keyword";
import EqualizerRing from "../EqualizerRing";
import ThemeToggle from "../ThemeToggle";
import Magnet from "../Magnet";
import DecryptedText from "../DecryptedText";
import ElectricBorder from "../ElectricBorder";
import QuickRead from "../QuickRead";
import GuestbookButton from "../Guestbook";
import { sfx } from "@/lib/sfx";
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

// Bucharest's sky through the day: [hour, top colour, horizon colour]. Read between stops, so it changes by the minute.
const SKY: [number, string, string][] = [
  [0, "#0d0e2b", "#2a2456"], [4.5, "#141540", "#3a2f63"], [6, "#4b4a8f", "#e79a8c"], [7.5, "#7d9ad8", "#f6c9a4"],
  [10, "#5e95e6", "#b9d9fb"], [16, "#5a8fe0", "#c4defa"], [18.3, "#6a6fbf", "#f6b27e"], [19.6, "#3e3a82", "#ec7d8f"],
  [21, "#1b1a4a", "#4b3570"], [24, "#0d0e2b", "#2a2456"],
];
const mix = (a: string, b: string, t: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");
const sky = (h: number) => {
  const i = SKY.findIndex(([at]) => at > h), [h0, t0, b0] = SKY[i - 1], [h1, t1, b1] = SKY[i], t = (h - h0) / (h1 - h0);
  return { top: mix(t0, t1, t), bottom: mix(b0, b1, t) };
};
// Sun from 6 to 20, moon the rest of the night: across the window on a low arc.
const orb = (h: number) => {
  const sun = h >= 6 && h < 20, t = sun ? (h - 6) / 14 : ((h + 4) % 24) / 10;
  return { sun, x: 10 + t * 80, y: 70 - Math.sin(Math.PI * t) * 52 };
};
const partOfDay = (h: number) => h < 5 ? "Night" : h < 9 ? "Morning" : h < 12 ? "Late morning" : h < 17 ? "Afternoon" : h < 21 ? "Evening" : "Night";
const STARS = [[12, 18], [24, 40], [33, 12], [47, 30], [58, 14], [71, 36], [80, 10], [90, 26], [64, 52], [18, 58]];

// The end of the page, on the right: a window onto her sky right now (her local time, live), then how to reach her.
function Where() {
  const [now, setNow] = useState<{ h: number; m: number; ahead: number } | null>(null), [copied, setCopied] = useState(false);
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "numeric", minute: "numeric", hourCycle: "h23" });
    const tick = () => {
      const d = new Date(), [h, m] = f.formatToParts(d).filter((x) => x.type !== "literal").map((x) => +x.value);
      const here = d.getHours() * 60 + d.getMinutes();
      const ahead = Math.round((((h * 60 + m - here + 720 + 1440) % 1440) - 720) / 30) / 2; // hours she is ahead of the visitor
      setNow({ h, m, ahead });
    };
    tick(); const id = window.setInterval(tick, 5000); return () => clearInterval(id);
  }, []);
  const copy = () => { void navigator.clipboard?.writeText(profile.email).then(() => { sfx.tink(); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }); };
  const hf = now ? now.h + now.m / 60 : 13.5, c = sky(hf), o = orb(hf), dark = !o.sun || hf > 19.3 || hf < 6.5;
  const gap = !now ? "" : now.ahead === 0 ? "same time as you" : `${Math.abs(now.ahead)}h ${now.ahead > 0 ? "ahead of" : "behind"} you`;
  const row = (k: number) => ({ initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, ease, delay: 0.25 + k * 0.09 } }) as const;
  return (
    <aside className={s.where} aria-label="Where I am">
      <div className={s.sky} style={{ "--top": c.top, "--bottom": c.bottom, "--stars": dark ? 1 : 0 } as React.CSSProperties}>
        <span className={s.stars} aria-hidden="true">{STARS.map(([x, y], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.37}s` }} />)}</span>
        <span className={o.sun ? s.sun : s.moon} style={{ left: `${o.x}%`, top: `${o.y}%` }} aria-hidden="true" />
        <svg className={s.cityBack} viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V22h22V12h16v10h14V6h10v34h12V18h24v22h10V10h8V2h3v8h9v30h14V16h20v24h12V20h18v20h8V8h14v32h10V24h22v16h16V14h12v26h20V18h10v22h16V26h18v14z" /></svg>
        <svg className={s.city} viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40V28h18V20h14v8h10V14h8V8h4v6h8v26h6V24h20v6h12V18h16v22h8V26h10V12l6-4 6 4v28h8V22h22v8h10V16h12v24h6V28h16V20h8v20h10V10h4V4h2v6h4v30h8V24h18v6h12V18h10v22h8V26h14v14h10V20h16v20z" />
          {dark && <g className={s.windows}>{[[40, 18], [62, 30], [112, 24], [178, 20], [224, 26], [250, 30], [296, 22], [318, 30], [364, 26]].map(([x, y]) => <rect key={x} x={x} y={y} width="2.4" height="2.4" />)}</g>}
        </svg>
        <span className={s.grain} aria-hidden="true" />
        <span className={s.status}><i aria-hidden="true" />Open to product roles</span>
        <div className={s.clock}>
          <span className={s.time} role="timer" aria-label={now ? `My time: ${String(now.h).padStart(2, "0")}:${String(now.m).padStart(2, "0")}` : "My time"}>
            <Counter value={now?.h ?? 0} places={[10, 1]} fontSize={40} padding={4} gap={0} horizontalPadding={0} borderRadius={0} textColor="#fff" fontWeight={600} gradientFrom="transparent" gradientTo="transparent" />
            <b aria-hidden="true">:</b>
            <Counter value={now?.m ?? 0} places={[10, 1]} fontSize={40} padding={4} gap={0} horizontalPadding={0} borderRadius={0} textColor="#fff" fontWeight={600} gradientFrom="transparent" gradientTo="transparent" />
          </span>
          <span className={s.skyNote}>{now ? `${partOfDay(hf)} in Bucharest · ${gap}` : "Bucharest"}</span>
        </div>
      </div>
      <dl>
        <motion.div {...row(0)}><dt>Based in</dt><dd>{profile.location}</dd></motion.div>
        <motion.div {...row(1)}><dt>Email</dt><dd>
          <button type="button" onClick={copy} aria-label={`Copy ${profile.email}`} className={copied ? s.copied : undefined}>
            <DecryptedText key={copied ? "y" : "n"} text={copied ? "Copied to clipboard ✓" : profile.email} animateOn={copied ? "view" : "hover"} speed={30} maxIterations={8} sequential={copied} />
          </button>
        </dd></motion.div>
        <motion.div {...row(2)}><dt>Book a call</dt><dd>
          <a href={profile.booking} target="_blank" rel="noopener" className={s.book}><DecryptedText text="30 minutes, on Calendly" animateOn="hover" speed={40} maxIterations={8} /><span aria-hidden="true">↗</span></a>
        </dd></motion.div>
      </dl>
    </aside>
  );
}

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
  { label: "BITE", icon: <Image src="/brand/bite-logo.png" alt="" width={200} height={200} className="dock-logo" /> },
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
  const [win95, setWin95] = useState(false); // the retro computer, booted
  // The room's contact objects and the buttons they belong to: hover one, the other lights.
  const [hot, setHot] = useState<Prop | null>(null);
  const lights = (p: Prop) => ({ onPointerEnter: () => setHot(p), onPointerLeave: () => setHot(null), onFocus: () => setHot(p), onBlur: () => setHot(null), "data-lit": hot === p || undefined });
  const pdfRef = useRef<HTMLAnchorElement>(null), liRef = useRef<HTMLAnchorElement>(null);
  const pick = (p: Prop) => (p === "phone" ? ui.contact() : (p === "printer" ? pdfRef : liRef).current?.click()); // what the button itself does
  const buildLabel = touring ? "Stop the build" : ui.returning ? "Replay the build" : "Watch me build it";

  return (
    <div className={`${p.column} ${s.home}`}>
      {touring && era === 0 && <p className={s.construction}>Under construction. Please come back soon!</p>}
      <header className={s.top}>
        <span className={s.mark}><span className={s.monogram}>{profile.initials}</span><span className={s.markName}>{profile.name}</span></span>
        <div className={s.icons}>
          <Magnet padding={24} magnetStrength={3} disabled={!!reduce}><a ref={liRef} href={profile.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" className={`${s.icon} ${s.linkedin} water`} {...lights("rolodex")}><LinkedInIcon /></a></Magnet>
          <Magnet padding={24} magnetStrength={3} disabled={!!reduce}><button type="button" onClick={ui.contact} aria-label="Message me" className={`${s.icon} ${s.whatsapp} water`} {...lights("phone")}><WhatsAppIcon size={18} /></button></Magnet>
          <ThemeToggle className={`${s.icon} water`} />
          <Magnet padding={24} magnetStrength={3} disabled={!!reduce}><a ref={pdfRef} href={profile.pdf} download className={s.pdf} aria-label="Download CV as PDF" {...lights("printer")}>
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
            <button type="button" className={s.messageBtn} onClick={ui.contact} {...lights("phone")}><WhatsAppIcon size={17} /><DecryptedText text="Message me" animateOn="hover" speed={40} maxIterations={8} /></button>
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

        {/* Her room, baked in Blender. The Workbench that sat here is retired: <Workbench /> */}
        <div className={`${s.cards} ${s.dropper}`} data-tour="cards" {...drop(STAGE.cards)}>
          <Finale hot={hot} onHot={setHot} onPick={pick} onScreen={() => { sfx.wake(); setWin95(true); }} />
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
        {/* The computer moved to the room in the hero: <RetroComputer className={s.retroCanvas} character={ui.character} onScreen={() => setWin95(true)} /> */}
        {!touring && <button type="button" className={s.bootBtn} onClick={() => { sfx.wake(); setWin95(true); }}><span aria-hidden="true">▶</span> Boot the old computer</button>}
        {win95 && <Win95 onClose={() => setWin95(false)} contact={ui.contact} />}
      </section>

      {/* The end of the page: somewhere to go next, the same three ways in as the hero and the 30-second version */}
      <Land className={s.outro} delay={0.05}>
        <div className={s.outroGrid}>
        <div className={s.outroMain}>
          <h2 className={s.h2}><ShuffleHeading text="You made it to the end of the log." /></h2>
          <p className={s.outroLine}>Product roles, full-time or contract. Payments, ops, and internal tools. I reply faster than a 3DS challenge.</p>
          <div className={s.actions}>
            <Magnet padding={40} magnetStrength={4} disabled={!!reduce}><button type="button" className={`${p.primary} ${s.outroBtn} ${s.whatsapp} water`} onClick={ui.contact}><WhatsAppIcon size={17} /><DecryptedText text="Message me" animateOn="hover" speed={40} maxIterations={8} /></button></Magnet>
            <Magnet padding={30} magnetStrength={5} disabled={!!reduce}><a className={`${s.messageBtn} ${s.outroBtn} ${s.pdfFill} water`} href={profile.pdf} download><DecryptedText text="Download the PDF" animateOn="hover" speed={40} maxIterations={8} /><span className={s.dl} aria-hidden="true">↓</span></a></Magnet>
            <Magnet padding={30} magnetStrength={5} disabled={!!reduce}><a className={`${s.messageBtn} ${s.outroBtn} ${s.linkedin} water`} href={profile.linkedin} target="_blank" rel="noreferrer"><LinkedInIcon /><DecryptedText text="LinkedIn" animateOn="hover" speed={40} maxIterations={8} /></a></Magnet>
          </div>
        </div>
        <Where />
        <div className={s.signoff}>
          <span className={s.sig} aria-hidden="true">– Adelina</span>
          <button type="button" className={s.toTop} onClick={(e) => e.currentTarget.closest("[data-pane]")?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}>↑ Back to the top</button>
        </div>
        </div>
      </Land>
    </div>
  );
}
