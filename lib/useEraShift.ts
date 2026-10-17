"use client";
import { useEffect, useState, type RefObject } from "react";
import { flushSync } from "react-dom";

// How the guide moves between eras (docs/superpowers/specs/2026-10-17-guide-motion-research.md §1): each change
// uses the reveal of the era being left. app/eras.css draws them, keyed on data-shift.
export type Shift = "dial" | "undial" | "gloss" | "morph" | "ease";

export function shiftFor(from: number, to: number): Shift {
  if (Math.abs(to - from) !== 1) return "morph";
  const low = Math.min(from, to);
  if (low === 0) return to > from ? "dial" : "undial";
  return low === 1 ? "gloss" : "morph";
}

type Scope = HTMLElement & { startViewTransition?: (update: () => void) => unknown };

// The era on screen trails the era asked for by one View Transition, scoped to `ref` (Chrome 147+:
// Element.startViewTransition), so the rest of the page (the guide's captions) stays live and on top.
// No element-scoped transitions: the tokens ease (data-shift="ease"). A document-wide transition is not used:
// it would lift the viewport over the captions for the length of every change.
// `era` null means the guide is closed: era 3, and entering or leaving the guide snaps (the guide starts at 2003
// from its first frame). Starting a change while one runs skips the running one.
export function useEraShift(ref: RefObject<HTMLElement | null>, era: number | null) {
  const [s, setS] = useState<{ era: number | null; shift?: Shift }>({ era });
  if (era !== s.era && (era === null || s.era === null)) setS({ era }); // snap, before paint

  useEffect(() => {
    if (era === null || s.era === null || era === s.era) return;
    const el = ref.current as Scope | null;
    if (!el?.startViewTransition) { setS({ era, shift: "ease" }); return; }
    const shift = shiftFor(s.era, era);
    el.dataset.shift = shift; // the pseudo-elements read it as the transition starts
    el.startViewTransition(() => flushSync(() => setS({ era, shift })));
  }, [era]); // eslint-disable-line react-hooks/exhaustive-deps

  return { era: s.era ?? 3, shift: s.shift };
}
