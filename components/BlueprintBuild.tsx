"use client";
import { useRef, type RefObject } from "react";
import { useInView } from "motion/react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { useCalm } from "@/lib/useCalm";

if (typeof window !== "undefined") gsap.registerPlugin(DrawSVGPlugin, Flip, useGSAP);

// The guide's section build: blueprint, then fill. Each piece's outline draws first (DrawSVG on a rect with the
// piece's radius, in one overlay SVG that is removed after), then the piece fills in the way its era did:
// 2003 just appears, gloss fades, flat fades quicker, now rises 6px out of a mask. Pieces ripple across their grid.
// Unbuilt pieces keep their space (opacity 0, no pointer events). It waits for the camera: a built piece stays
// hidden until its scope is near the middle of the screen. Every change kills the running build: the latest wins.
// With the guide closed it does nothing, and leaves no inline styles behind.
//
// sel: the outlined pieces (their [data-bp-frame] child, else the piece, gives the outline's rect and radius).
// bare: pieces that only fill, first (section heads). deck: inside each piece, chips dealt out of one stacked deck.

const SVG = "http://www.w3.org/2000/svg";
const CLEAR = "opacity,pointerEvents,transform,clipPath";
const RIPPLE = { grid: "auto", from: "start", amount: 0.4 } as const;
const MASK = "inset(100% -12px -12px -12px)", OPEN = "inset(-12px -12px -12px -12px)"; // sides and foot open: shadows show
const CAMERA = "-10% -30% -10% -30%"; // the middle of the screen: the pane has mostly slid in

type Opts = { touring: boolean; era: number; sel: string; bare?: string; deck?: string; delay?: number };

function fill(tl: gsap.core.Timeline, els: Element[], era: number, at: number) {
  if (!els.length) return;
  if (era === 0) tl.set(els, { opacity: 1 }, at);
  else if (era === 3) tl.fromTo(els, { opacity: 1, y: 6, clipPath: MASK }, { y: 0, clipPath: OPEN, duration: 0.5, ease: "power3.out", clearProps: "transform,clipPath" }, at);
  else tl.to(els, { opacity: 1, duration: era === 1 ? 0.45 : 0.3, ease: era === 1 ? "sine.out" : "power2.out" }, at);
}

// The deck, read with Flip: the chips stacked, a little askew, at the top left of their row under the header.
function deal(chips: HTMLElement[]) {
  const box = chips[0].parentElement!, pos = box.style.position;
  box.style.position = "relative";
  gsap.set(chips, { position: "absolute", left: 0, top: 0, x: (i) => i * 0.8, y: (i) => -i * 0.6, rotation: (i) => ((i * 37) % 9) - 4 });
  const state = Flip.getState(chips);
  gsap.set(chips, { clearProps: "position,left,top,transform" });
  box.style.position = pos;
  return Flip.from(state, { duration: 0.9, ease: "power3.inOut", stagger: { amount: 0.35 }, scale: true });
}

export function useBlueprint(scope: RefObject<HTMLElement | null>, on: boolean, { touring, era, sel, bare, deck, delay = 0 }: Opts) {
  const calm = useCalm();
  const seen = useInView(scope, { margin: CAMERA });
  const st = useRef<"idle" | "hidden" | "built">("idle");
  const run = useRef<gsap.core.Animation | null>(null);
  const overlay = useRef<SVGSVGElement | null>(null);

  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const pieces = [...root.querySelectorAll<HTMLElement>(sel)];
    const bares = bare ? [...root.querySelectorAll<HTMLElement>(bare)] : [];
    const all = [...bares, ...pieces];
    const chips = deck ? [...root.querySelectorAll<HTMLElement>(`${sel} ${deck}`)] : [];
    const stop = () => { run.current?.kill(); run.current = null; overlay.current?.remove(); overlay.current = null; };

    if (!touring) {
      if (st.current !== "idle") { stop(); gsap.set([...all, ...chips], { clearProps: CLEAR }); st.current = "idle"; }
      return;
    }
    if (!on) {
      if (st.current === "hidden") return;
      stop();
      gsap.set(chips, { clearProps: "transform" });
      // Scrubbing back un-builds: a quick fade. At the guide's start the page just empties.
      gsap.set(all, { pointerEvents: "none", clearProps: "transform,clipPath" });
      if (st.current === "built" && !calm) run.current = gsap.to(all, { opacity: 0, duration: 0.2, ease: "power1.in", overwrite: true });
      else gsap.set(all, { opacity: 0 });
      st.current = "hidden";
      return;
    }
    if (st.current === "built") return;
    if (st.current === "idle") { st.current = "built"; return; } // built before the guide got here
    if (!seen && !calm) return; // built, waiting for the camera
    st.current = "built";
    stop();
    if (calm || !all.length) { gsap.set(all, { clearProps: CLEAR }); return; }

    // One overlay for the scope, at its static position; the outlines are measured from it, in unscaled px.
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("aria-hidden", "true");
    Object.assign(svg.style, { position: "absolute", width: "1px", height: "1px", overflow: "visible", pointerEvents: "none", zIndex: "3" });
    root.appendChild(svg);
    overlay.current = svg;
    const o = svg.getBoundingClientRect(), k = root.getBoundingClientRect().width / (root.offsetWidth || 1) || 1;
    const rects = pieces.map((pc) => {
      const f = pc.querySelector<HTMLElement>("[data-bp-frame]") ?? pc;
      const b = f.getBoundingClientRect(), w = b.width / k, h = b.height / k;
      const r = document.createElementNS(SVG, "rect");
      const at = { x: (b.left - o.left) / k + 0.75, y: (b.top - o.top) / k + 0.75, width: Math.max(w - 1.5, 0), height: Math.max(h - 1.5, 0), rx: Math.min(parseFloat(getComputedStyle(f).borderTopLeftRadius) || 0, w / 2, h / 2) };
      for (const [a, v] of Object.entries(at)) r.setAttribute(a, String(v));
      r.setAttribute("fill", "none");
      r.setAttribute("stroke", "var(--blueprint)");
      r.setAttribute("stroke-width", "1.5");
      svg.appendChild(r);
      return r;
    });

    const tl = gsap.timeline({ delay, onComplete: () => { overlay.current?.remove(); overlay.current = null; gsap.set(all, { clearProps: CLEAR }); } });
    fill(tl, bares, era, 0);
    const ripple = gsap.utils.distribute(RIPPLE);
    pieces.forEach((pc, i) => {
      const t = Number(ripple(i, pc, pieces));
      tl.fromTo(rects[i], { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.55, ease: era ? "power2.inOut" : "none" }, t);
      fill(tl, [pc], era, t + 0.4);
      tl.to(rects[i], { opacity: 0, duration: 0.35, ease: "power1.out" }, t + 0.75);
      const own = chips.filter((c) => pc.contains(c));
      if (own.length) tl.add(deal(own), t + 0.85); // Flip renders the deck straight away; the card fills around it
    });
    run.current = tl;
  }, { dependencies: [touring, on, seen, calm] });
}
