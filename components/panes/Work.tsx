"use client";
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useTransform } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { UI } from "../Shell";
import { tiles, type Label as Kind, type Tile } from "@/content/wall";
import dynamic from "next/dynamic";
import { useMedia } from "@/lib/useMedia";
import Media from "../wall/Media";
import Label from "../Label";
import BlurText from "../BlurText";
import SpotlightCard from "../SpotlightCard";
import { drift, glide } from "@/lib/motion";
import p from "./pane.module.css";
import s from "../wall/wall.module.css";

// Masonry brings GSAP; it loads after first paint, the wall is off screen at load anyway.
const Masonry = dynamic(() => import("../Masonry"), { ssr: false });

const FILTERS: ("All" | Kind)[] = ["All", "Built", "Owned", "Analysed"];
const MEDIA_H = { tall: 230, square: 170, land: 140 } as const;
const CAPTION_H = 112;
const DESKTOP = ["(min-width:900px)"];
const ONE = [1];
const RATES = [0.015, 0.035, 0.025]; // per-column parallax, fraction of scroll

function Card({ tile, h }: { tile: Tile; h: number }) {
  return (
    <motion.div layoutId={`tile-${tile.id}`} className={s.card} transition={glide}>
      <SpotlightCard className={s.spot} spotlightColor="rgba(51, 85, 255, 0.18)">
        <div className={s.media} style={{ height: h }}><Media tile={tile} /></div>
      </SpotlightCard>
      <div className={s.caption} style={{ height: CAPTION_H }}>
        {tile.didntExist ? (
          <>
            <span className={s.didnt}>Didn’t exist: {tile.didntExist}</span>
            <span className={s.now}>Now: {tile.now}</span>
          </>
        ) : (
          <span className={s.now}>{tile.title}</span>
        )}
        <Label kind={tile.label} />
      </div>
    </motion.div>
  );
}

function Zoom({ tile, onClose }: { tile: Tile; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portalled: the pane sits inside a transformed track, which would trap position: fixed.
  return createPortal(
    <>
      <motion.div className={s.backdrop} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
      <motion.div
        layoutId={`tile-${tile.id}`}
        className={s.zoom}
        role="dialog"
        aria-modal="true"
        aria-label={tile.title}
        transition={glide}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.06, bottom: 0.8 }}
        dragMomentum={false}
        onDragEnd={(_, i) => (i.offset.y > 120 || i.velocity.y > 600) && onClose()}
      >
        <motion.div layout className={s.zoomMedia}><Media tile={tile} /></motion.div>
        <motion.div layout="position" className={s.zoomBody}>
          <div className={s.zoomHead}>
            <h2 className={p.sheetTitle}>{tile.title}</h2>
            <button type="button" className={s.zoomClose} onClick={onClose} aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <Label kind={tile.label} />
          {(tile.more ?? []).map((m) => <p key={m} className={p.lede}>{m}</p>)}
          {tile.href && <a href={tile.href} target="_blank" rel="noopener" className={p.textLink}>{tile.href.includes("github.com") ? "See the code" : "Open it"}</a>}
          {tile.tbc && <p className={p.tbc}>[TBC: {tile.tbc}]</p>}
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
}

export default function Work(_: { ui: UI }) {
  const root = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [open, setOpen] = useState<Tile | null>(null);
  const desktop = useMedia(DESKTOP, ONE, 0) === 1;
  const reduce = useCalm();
  const scale = desktop ? 1.3 : 1;

  // Parallax reads the pane's own scroll (the pane is the scroll container, not the window).
  const scroll = useMotionValue(0);
  useEffect(() => {
    const pane = root.current?.closest("[data-pane]");
    if (!pane) return;
    const on = () => scroll.set(pane.scrollTop);
    pane.addEventListener("scroll", on, { passive: true });
    return () => pane.removeEventListener("scroll", on);
  }, [scroll]);
  const c0 = useTransform(scroll, (v) => v * RATES[0]);
  const c1 = useTransform(scroll, (v) => v * RATES[1]);
  const c2 = useTransform(scroll, (v) => v * RATES[2]);
  const parallax = reduce ? [] : [c0, c1, c2];

  const shown = tiles.filter((t) => filter === "All" || t.label === filter);
  const w = shown.findIndex((t) => t.wide);
  const toItems = (list: Tile[]) =>
    list.map((t) => ({ id: t.id, label: t.title, height: MEDIA_H[t.shape] * scale + 10 + CAPTION_H, node: <Card tile={t} h={MEDIA_H[t.shape] * scale} /> }));
  const select = (id: string) => setOpen(tiles.find((t) => t.id === id) ?? null);

  return (
    <div ref={root} className={p.column}>
      <div className={s.head}>
        <h1 className={p.title}><BlurText text="Things that didn’t exist" animateBy="words" delay={60} /></h1>
        <p className={p.lede}>Each one started as a gap somebody kept tripping over.</p>
      </div>

      <div className={s.filters} role="radiogroup" aria-label="Filter">
        {FILTERS.map((f) => (
          <button key={f} type="button" role="radio" aria-checked={f === filter} className={s.filter} onClick={() => setFilter(f)}>
            {f !== "All" && <i className={s[`dot${f}`]} aria-hidden="true" />}
            {f}
            {f === filter && <motion.span layoutId="wall-filter" className={s.underline} transition={drift} />}
          </button>
        ))}
      </div>

      <LayoutGroup>
        <motion.div key={filter} className={s.wall} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {w < 0 ? (
            <Masonry items={toItems(shown)} onSelect={select} parallax={parallax} />
          ) : (
            <>
              {w > 0 && <Masonry items={toItems(shown.slice(0, w))} onSelect={select} parallax={parallax} />}
              <button type="button" className={s.wide} data-tour="wide" onClick={() => select(shown[w].id)} aria-label={shown[w].title}>
                <Card tile={shown[w]} h={170 * scale} />
              </button>
              {w < shown.length - 1 && <Masonry items={toItems(shown.slice(w + 1))} onSelect={select} parallax={parallax} />}
            </>
          )}
        </motion.div>

        <AnimatePresence>{open && <Zoom key={open.id} tile={open} onClose={() => setOpen(null)} />}</AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
