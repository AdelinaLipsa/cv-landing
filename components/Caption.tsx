"use client";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useLayoutEffect, useRef } from "react";
import { TYPE_CPS, wordsShown } from "@/lib/direction";
import type { Step } from "@/content/tour";
import s from "./Tour.module.css";

// The web's aside comes in half a second after her line's last word.
export const asideAt = (st: Step) => (st.say.length + 14) / TYPE_CPS;

const RISE = { yPercent: 0, duration: 0.45, ease: "expo.out", overwrite: true } as const;

// The guide's lower third (research §3): each word rises from under its own clip when the tour clock reaches it,
// so speed and scrubbing stay in sync (scrubbing back drops words again). Words not reached yet are there, under
// their clips, so the line never reflows.
export default function Caption({ step, local, paused }: { step: Step; local: number; paused: boolean }) {
  const line = useRef<HTMLParagraphElement>(null);
  const words = useRef<Element[]>([]);
  const shown = useRef(0);
  const n = wordsShown(step.say, local);
  const aside = !!step.web && local >= asideAt(step);

  // Split once per line; autoSplit splits again when the font lands or the width changes, keeping what is shown.
  useLayoutEffect(() => {
    gsap.registerPlugin(SplitText);
    shown.current = 0;
    const split = SplitText.create(line.current!, {
      type: "words", mask: "words", autoSplit: true, aria: "none",
      onSplit(self) {
        words.current = self.words;
        gsap.set(self.words, { yPercent: (i: number) => (i < shown.current ? 0 : 110) });
      },
    });
    return () => split.revert();
  }, [step.say]);

  useLayoutEffect(() => {
    words.current.forEach((w, i) => {
      if (i < n && i >= shown.current) gsap.to(w, RISE);
      else if (i >= n && i < shown.current) gsap.set(w, { yPercent: 110, overwrite: true });
    });
    shown.current = n;
  }, [n, step.say]);

  return (
    <div className={s.caption} data-tour-caption>
      <span className={s.who}>
        <img src="/adelina.jpg" alt="" className={s.avatar} />
        <span className={s.name}>{paused ? "Paused" : "Adelina"}</span>
      </span>
      <p key={step.say} ref={line} className={s.line} aria-hidden="true">{step.say}</p>
      {step.web && (
        <span className={s.asideMask} aria-hidden="true">
          <span className={s.aside} data-on={aside || undefined}>{step.web}</span>
        </span>
      )}
      <span className={s.sr} aria-live="polite">{step.say}{step.web ? ` ${step.web}` : ""}</span>
    </div>
  );
}
