"use client";
import { animate } from "motion/react";
import { useEffect, useRef } from "react";
import s from "./Rewind.module.css";

export const REWIND_S = 1.4;
const NOW = new Date().getFullYear();

// The tape rewinding to 2003 before the guide replays (docs/superpowers/specs/2026-10-17-guide-motion-research.md §6).
// It owns the clock: progress p runs 0 to 1 on an accelerating ease and Shell turns it into the page (lib/direction
// rewindAt, rewindUpto). Over the page: a VCR display (◀◀ REW, a counter rolling Now to 2003) and one tracking-noise
// band, 40px tall, running up twice. The band's displacement filter is on the band only, never the page.
export default function Rewind({ onFrame, onDone }: { onFrame: (p: number) => void; onDone: () => void }) {
  const counter = useRef<HTMLSpanElement>(null);
  const cb = useRef({ onFrame, onDone });
  cb.current = { onFrame, onDone };

  useEffect(() => {
    const run = animate(0, 1, {
      duration: REWIND_S,
      ease: (t) => t ** 1.4,
      onUpdate: (p) => {
        const y = Math.round(NOW - p * (NOW - 2003));
        if (counter.current) counter.current.textContent = y >= NOW ? "NOW" : String(y);
        cb.current.onFrame(p);
      },
      onComplete: () => cb.current.onDone(),
    });
    return () => run.stop();
  }, []);

  return (
    <div className={s.rewind} aria-hidden="true">
      <svg width="0" height="0" className={s.defs}>
        <filter id="rewind-band" x="0" y="0" width="100%" height="100%">
          {/* Long sideways streaks; G is pinned to 0.5 so rows only slide sideways, like a slipping head. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.45" numOctaves="1" seed="3" />
          <feColorMatrix values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" />
          <feDisplacementMap in="SourceGraphic" scale="28" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className={s.osd}>
        <span>◀◀ REW</span>
        <span ref={counter}>NOW</span>
      </div>
      <div className={s.band} />
    </div>
  );
}
