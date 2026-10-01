"use client";
import { useInView } from "motion/react";
import { useId, useRef, useState } from "react";
import { keywords } from "@/content/keywords";
import GradientText from "./GradientText";
import s from "./Keyword.module.css";

// A word worth a second look: a highlighter stroke draws under it once it's read,
// and hover, focus or tap shows the proof behind it.
export function Keyword({ children, proof, i = 0 }: { children: string; proof: string; i?: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const seen = useInView(ref, { once: true, amount: 1 });
  const [open, setOpen] = useState(false);
  const id = useId();
  // Keep the card on screen: shift it left when the word sits near the right edge.
  const place = () => {
    const el = ref.current;
    if (el) el.style.setProperty("--shift", `${Math.min(0, innerWidth - 16 - (el.getBoundingClientRect().left + 256))}px`);
  };
  return (
    <button
      ref={ref}
      type="button"
      className={s.kw}
      data-seen={seen || undefined}
      data-open={open || undefined}
      style={{ "--d": `${0.3 + i * 0.25}s` } as React.CSSProperties}
      aria-describedby={id}
      onMouseEnter={place}
      onFocus={place}
      onClick={() => setOpen((o) => !o)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <GradientText colors={["var(--ink)", "var(--blueprint)", "#ee6e9f", "var(--blueprint)", "var(--ink)"]} animationSpeed={4}>{children}</GradientText>
      <span role="tooltip" id={id} className={s.tip}>{proof}</span>
    </button>
  );
}

const esc = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const lookup = Object.fromEntries(Object.entries(keywords).map(([k, v]) => [k.toLowerCase(), v]));
const re = new RegExp(`(?<!\\w)(${Object.keys(keywords).sort((a, b) => b.length - a.length).map(esc).join("|")})(?!\\w)`, "gi");

// Plain text in, the same text out with its keywords accented. Each keyword once per paragraph.
export function Rich({ text }: { text: string }) {
  const used = new Set<string>();
  let n = 0;
  return (
    <>
      {text.split(re).map((part, i) => {
        const k = part.toLowerCase();
        if (i % 2 === 0 || used.has(k)) return part;
        used.add(k);
        return <Keyword key={i} proof={lookup[k]} i={n++}>{part}</Keyword>;
      })}
    </>
  );
}
