"use client";
import { useRef } from "react";
import { useInView } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import Shuffle from "./Shuffle";

// Headings arrive like slot reels (React Bits Shuffle): each letter spins through a few others and lands.
// Hover replays it. Shuffle starts on a window scroll trigger, but the pages here scroll inside their own panes,
// so it only mounts once the heading is really on screen, and fires straight away.
// Calm mode: plain text (Shuffle's own reduced-motion path would leave the heading hidden).
export default function ShuffleHeading({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const calm = useCalm();
  return (
    <span ref={ref} className="shuffle-heading">
      {/* Screen readers get the words once; the per-letter reels are hidden from them (aria-label on a span is ignored) */}
      <span className="sr-only">{text}</span>
      {seen && !calm ? (
        <span aria-hidden="true"><Shuffle text={text} tag="span" shuffleDirection="up" duration={0.45} shuffleTimes={3} stagger={0.035} animationMode="evenodd" scrambleCharset="!<>/[]{}#*01" triggerOnHover threshold={0} rootMargin="0px" /></span>
      ) : (
        <span aria-hidden="true" style={{ visibility: calm ? "visible" : "hidden" }}>{text}</span>
      )}
    </span>
  );
}
