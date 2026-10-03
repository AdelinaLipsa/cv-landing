"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { UI } from "../Shell";
import { sections, tiles, type Tile } from "@/content/wall";
import { useMedia } from "@/lib/useMedia";
import Media from "../wall/Media";
import { Play } from "../wall/play";
import BlurText from "../BlurText";
import SpotlightCard from "../SpotlightCard";
import Tilt from "../Tilt";
import DecryptedText from "../DecryptedText";
import { glide } from "@/lib/motion";
import p from "./pane.module.css";
import s from "../wall/wall.module.css";

const DESKTOP = ["(min-width:900px)"];
const TOUCH = ["(hover: none)"];
const ONE = [1];

const BAR = 30; // title bar height for windows, terminals and popups

// Dresses the media as the thing it is. Phones and popups are narrower than the column, on purpose.
function Frame({ tile, children }: { tile: Tile; children: React.ReactNode }) {
  const f = tile.form;
  if (!f) return <>{children}</>;
  return (
    <div className={`${s.frame} ${s[f] ?? ""}`}>
      {(f === "window" || f === "terminal") && <div className={s.bar}><i /><i /><i /><span>{tile.chrome ?? tile.title}</span></div>}
      {f === "popup" && <div className={s.bar}><img src="/brand/bite.png" alt="" width={20} height={20} /><span>{tile.title.split(",")[0]}</span></div>}
      <div className={s.screen}>{children}</div>
    </div>
  );
}

// One card for every tile: the demo, its title, one plain sentence. The demo plays while you hover it
// (always on touch screens). Exported: the Home page teaser shows the very same cards.
export function Card({ tile, h }: { tile: Tile; h: number }) {
  const [hover, setHover] = useState(false);
  const touch = useMedia(TOUCH, ONE, 0) === 1;
  return (
    <Play.Provider value={hover || touch}>
      <Tilt max={5} scale={1.02}>
        <div className={s.card} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <SpotlightCard className={s.spot} spotlightColor="rgba(51, 85, 255, 0.18)">
            <div className={`${s.media} ${tile.form ? s.bare : ""}`} style={{ height: h }}><Frame tile={tile}><Media tile={tile} /></Frame></div>
          </SpotlightCard>
          <div className={s.caption}><b className={s.ctitle}>{tile.title}</b><span className={s.blurb}>{tile.blurb}</span>{tile.outcome && <span className={s.outcome}>{tile.outcome}</span>}</div>
        </div>
      </Tilt>
    </Play.Provider>
  );
}

const slide = {
  enter: (d: number) => ({ x: d * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -48, opacity: 0 }),
};

// Opens on a tile; arrows, ← → and swipes move through whatever the filter shows.
function Viewer({ list, at, onMove, onClose }: { list: Tile[]; at: number; onMove: (to: number) => void; onClose: () => void }) {
  const tile = list[at];
  const [dir, setDir] = useState(0);
  const go = (d: number) => { setDir(d); onMove((at + d + list.length) % list.length); };
  const api = useRef({ go, onClose });
  api.current = { go, onClose };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") api.current.onClose();
      else if (e.key === "ArrowRight") api.current.go(1);
      else if (e.key === "ArrowLeft") api.current.go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const arrow = (d: 1 | -1) => (
    <button type="button" className={`${s.nav} ${d < 0 ? s.prev : s.next}`} onClick={() => go(d)} aria-label={d < 0 ? "Previous" : "Next"}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></svg>
    </button>
  );

  // Portalled: the pane sits inside a transformed track, which would trap position: fixed.
  return createPortal(
    <>
      <motion.div className={s.backdrop} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
      <motion.div
        className={s.viewer}
        role="dialog"
        aria-modal="true"
        aria-label={tile.title}
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={glide}
        drag
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.8, left: 0.35, right: 0.35 }}
        dragMomentum={false}
        onDragEnd={(_, i) => {
          if (i.offset.y > 120 || i.velocity.y > 600) onClose();
          else if (i.offset.x < -80 || i.velocity.x < -500) go(1);
          else if (i.offset.x > 80 || i.velocity.x > 500) go(-1);
        }}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div key={tile.id} className={s.viewerInner} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={glide}>
            <div className={`${s.viewerMedia} ${tile.form === "phone" || tile.form === "popup" ? s.viewerPortrait : ""}`}><Media tile={tile} /></div>
            <div className={s.viewerBody}>
              <div className={s.zoomHead}>
                <h2 className={p.sheetTitle}>{tile.title}</h2>
                <button type="button" className={s.zoomClose} onClick={onClose} aria-label="Close">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <p className={s.viewerGap}>{tile.blurb}</p>
              {(tile.more ?? []).map((m) => <p key={m} className={p.lede}>{m}</p>)}
              {tile.href && <a href={tile.href} target="_blank" rel="noopener" className={p.textLink}><DecryptedText text={tile.href.includes("github.com") ? "See the code" : "Open it"} animateOn="hover" speed={40} maxIterations={8} /></a>}
              {tile.tbc && <p className={p.tbc}>[TBC: {tile.tbc}]</p>}
              <p className={s.count} aria-live="polite">{at + 1} / {list.length}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        {list.length > 1 && <>{arrow(-1)}{arrow(1)}</>}
      </motion.div>
    </>,
    document.body
  );
}

export default function Work(_: { ui: UI }) {
  const [open, setOpen] = useState<number | null>(null);
  const desktop = useMedia(DESKTOP, ONE, 0) === 1;
  const list = sections.flatMap((sec) => tiles.filter((t) => t.section === sec.id)); // the viewer walks them in page order

  return (
    <div className={p.column}>
      <div className={s.head}>
        <h1 className={p.title}><BlurText text="What I built, and what I own" animateBy="words" delay={60} /></h1>
      </div>

      {sections.map((sec) => (
        <section key={sec.id} className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{sec.title}</h2>
            <p className={s.sectionLede}>{sec.lede}</p>
          </div>
          <div className={s.grid}>
            {tiles.filter((t) => t.section === sec.id).map((t, k) => (
              <motion.button
                key={t.id}
                type="button"
                data-key={t.id}
                className={s.tileBtn}
                onClick={() => setOpen(list.indexOf(t))}
                aria-label={`${t.title}: open details`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...glide, delay: k * 0.06 }}
              >
                <Card tile={t} h={desktop ? 300 : 260} />
              </motion.button>
            ))}
          </div>
        </section>
      ))}

      <AnimatePresence>{open !== null && <Viewer key="viewer" list={list} at={open} onMove={setOpen} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}
