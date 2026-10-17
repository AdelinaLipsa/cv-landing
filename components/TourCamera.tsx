"use client";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useEffect, useRef } from "react";
import { frame, holePath, PAD, type Rect } from "@/lib/camera";
import { ease, glide, land, slow } from "@/lib/motion";
import s from "./Tour.module.css";

// The guide's camera (docs/superpowers/specs/2026-10-17-guide-motion-research.md §2, §7). It moves a pane's stage
// (its scroll plus one transform) to frame each subject, like a rack focus: the move runs first (pull back to 0.96,
// track, push in), and only once it has landed do the dim and blur come in around the subject. They lift before the
// next move, so backdrop-filter never runs while a stage transforms. While it moves it sets data-camera on the
// viewport: era changes (lib/useEraShift) wait for it to land.

const PULL = 0.96;
const STAGE_PROPS = "transform,transformOrigin,willChange";

// A motion/react spring (mass 1, from rest) as a GSAP ease, with the time it takes to settle.
function spring(id: string, { stiffness: k, damping: c }: { stiffness: number; damping: number }) {
  const dt = 1 / 240, pts: [number, number][] = [];
  let x = 0, v = 0, t = 0;
  while (t < 4 && !(Math.abs(1 - x) < 0.005 && Math.abs(v) < 0.05)) {
    v += (k * (1 - x) - c * v) * dt; x += v * dt; t += dt;
    pts.push([t, x]);
  }
  const every = Math.ceil(pts.length / 80);
  const d = pts.filter((_, i) => i % every === 0).map(([pt, px]) => `L${(pt / t).toFixed(4)},${px.toFixed(4)}`).join("");
  return { ease: CustomEase.create(id, `M0,0${d}L1,1`), duration: t };
}

// One ease per move type, from lib/motion.ts: pull back and the finale's crane on `slow`, push-ins and re-frames on
// `glide`, the finale's settle on `land`, tracking and the focus on the site's `ease` (the curve `track` uses).
let E: { track: gsap.EaseFunction; slow: ReturnType<typeof spring>; glide: ReturnType<typeof spring>; land: ReturnType<typeof spring> } | null = null;
const eases = () => {
  if (E) return E;
  gsap.registerPlugin(CustomEase);
  return (E = {
    track: CustomEase.create("cam-track", `M0,0 C${ease[0]},${ease[1]} ${ease[2]},${ease[3]} 1,1`),
    slow: spring("cam-slow", slow),
    glide: spring("cam-glide", glide),
    land: spring("cam-land", land),
  });
};

function findTarget(root: ParentNode, sel: string) {
  for (const el of root.querySelectorAll<HTMLElement>(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

const num = (el: Element, p: string) => Number(gsap.getProperty(el, p)) || 0;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// A stage's layout box in its pane's content coordinates (scroll-independent), with the transform taken out.
function geo(stage: HTMLElement, pane: HTMLElement) {
  const pr = pane.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  const sx = sr.left - num(stage, "x") - pr.left, sy = sr.top - num(stage, "y") - pr.top + pane.scrollTop;
  const sw = stage.offsetWidth, sh = stage.offsetHeight;
  const maxS = Math.max(0, Math.round(sy + sh + parseFloat(getComputedStyle(pane).paddingBottom) - pane.clientHeight));
  return { sx, sy, sw, sh, maxS, k: num(stage, "scaleX") || 1, x: num(stage, "x"), y: num(stage, "y") };
}

// The safe band: below the player, above the caption (both read from layout, so their entrances don't skew it).
function band() {
  const player = document.querySelector<HTMLElement>("[data-tour-player]");
  const caption = document.querySelector<HTMLElement>("[data-tour-caption]");
  return {
    top: (player ? player.offsetTop + player.offsetHeight : 0) + 16,
    bottom: (caption ? innerHeight - caption.offsetTop : 0) + 24,
  };
}

// Has the subject moved off its framing (the page built or restyled under it)?
function drifted(el: HTMLElement, stage: HTMLElement, pane: HTMLElement) {
  const Q = plan(el, stage, pane);
  const off = Math.abs(Q.S - pane.scrollTop) + Math.abs(Q.final.x - num(stage, "x")) + Math.abs(Q.final.y - num(stage, "y"));
  return off > 24 || Math.abs(Q.final.scale - num(stage, "scaleX")) > 0.03;
}

type Pose = { scale: number; x: number; y: number };
// Scale `k` about point (ox, oy) of the stage, as translate + scale about its top-left corner.
const about = (k: number, ox: number, oy: number): Pose => ({ scale: k, x: (1 - k) * ox, y: (1 - k) * oy });

// Where to scroll and how to pose the stage so `el` sits in the safe band, zoomed to fit.
function plan(el: HTMLElement, stage: HTMLElement, pane: HTMLElement) {
  const g = geo(stage, pane), r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  const p: Rect = { x: (r.left - sr.left) / g.k, y: (r.top - sr.top) / g.k, w: r.width / g.k, h: r.height / g.k };
  const W = pane.clientWidth, H = pane.clientHeight, safe = band();
  const max = matchMedia("(max-width: 640px)").matches ? 1.1 : 1.25;
  const S0 = pane.scrollTop;
  const f = frame({ x: g.sx + p.x, y: g.sy + p.y - S0, w: p.w, h: p.h }, { w: W, h: H }, safe, max);
  const S = clamp(Math.round(S0 + f.dy), 0, g.maxS);
  const bc = safe.top + (H - safe.top - safe.bottom) / 2, cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  // Pose the stage so the subject's centre lands where frame() puts it (the band's centre, or its top for a subject
  // too tall to fit). Sideways the zoom stays about a point inside
  // the stage, so the page never slides off its column; up and down it may go past the scroll's ends (a subject
  // at the foot of a short page still clears the caption).
  const k = f.s;
  const ox = Math.abs(k - 1) < 1e-3 ? 0 : clamp((g.sx + k * cx - W / 2) / (k - 1), 0, g.sw);
  const final = { scale: k, x: (1 - k) * ox, y: f.cy - (g.sy - S) - k * cy };
  return {
    g, S, S0, final, W, H,
    // pulled back about what is centred now, and about the subject (where the track ends)
    pullNow: about(PULL, (W / 2 - g.sx - g.x) / g.k, (bc - (g.sy - S0) - g.y) / g.k),
    pullOn: about(PULL, cx, cy),
  };
}

export default function TourCamera({ target, pane, finale, paused }: { target: string; pane: number; finale: boolean; paused: boolean }) {
  const veil = useRef<HTMLDivElement>(null);
  const cam = useRef<{ tl?: gsap.core.Timeline; stage?: HTMLElement; el?: HTMLElement | null; fixed?: boolean; tries?: number; retry?: number }>({});
  const now = useRef({ target, pane, finale, paused });
  now.current = { target, pane, finale, paused };

  const move = useRef((_mode: "cut" | "glide") => {});
  move.current = (mode) => {
    const c = cam.current, { target, pane: pi, finale } = now.current, e = eases();
    c.tl?.kill();
    cancelAnimationFrame(c.retry ?? 0);
    gsap.killTweensOf(veil.current);
    const vp = document.querySelector<HTMLElement>("[data-era]");
    if (vp) delete vp.dataset.camera;
    const paneEl = document.querySelectorAll<HTMLElement>("[data-pane]")[pi];
    const stage = paneEl?.querySelector<HTMLElement>("[data-stage]");
    const el = paneEl && findTarget(paneEl, target);
    if (!paneEl || !stage || !el || !vp) {
      // A subject that is still being built: look again next frame, for about a second.
      if ((c.tries = (c.tries ?? 0) + 1) < 60) c.retry = requestAnimationFrame(() => move.current(mode));
      return;
    }
    c.tries = 0;
    c.el = el;
    const from = c.stage && c.stage !== stage ? c.stage : null;
    c.stage = stage;
    // Stages left mid-move by an interrupted pane change go back to rest.
    for (const st of document.querySelectorAll<HTMLElement>("[data-stage]")) if (st !== stage && st !== from) gsap.set(st, { clearProps: STAGE_PROPS });

    const P = plan(el, stage, paneEl);
    const tl = gsap.timeline({
      onComplete: () => {
        delete vp.dataset.camera;
        gsap.set(stage, { willChange: "auto" }); // re-rasterises the text sharp at the new scale
        if (from) gsap.set(from, { clearProps: STAGE_PROPS });
        if (now.current.finale) return;
        // The page may still be building under the subject: one quiet re-frame if it moved.
        if (!c.fixed && !now.current.paused && drifted(el, stage, paneEl)) { c.fixed = true; move.current("glide"); return; }
        if (!now.current.paused) c.tl = gsap.timeline().set(veil.current, { clearProps: "backdropFilter" }, 0.3).to(veil.current, { autoAlpha: 1, duration: 0.4, ease: e.track }, 0.3);
      },
    });
    c.tl = tl;
    vp.dataset.camera = "moving";
    gsap.set(stage, { transformOrigin: "0 0", willChange: "transform" });
    // The blur goes at once (only the tint fades): backdrop-filter never runs while anything moves.
    gsap.set(veil.current, { backdropFilter: "none" });
    tl.to(veil.current, { autoAlpha: 0, duration: 0.2 * num(veil.current!, "opacity"), ease: e.track });
    const trackFor = (d: number) => clamp(0.6 + d / 2500, 0.7, 1.4);
    // The push-in frames the subject as it is when the push starts (it may have been building during the move).
    const push = (at?: string) => {
      let Q: ReturnType<typeof plan> | null = null;
      const q = () => (Q ??= plan(el, stage, paneEl));
      tl.to(stage, { scale: () => q().final.scale, x: () => q().final.x, y: () => q().final.y, duration: e.glide.duration, ease: e.glide.ease }, at);
      tl.to(paneEl, { scrollTop: () => q().S, duration: e.glide.duration, ease: e.glide.ease }, "<");
    };

    if (from) {
      // Pane change: the stage on screen pulls back while the shell slides (its own `track`), the next pane arrives
      // already pulled back on its subject, and pushes in over the slide's last fifth.
      const fromPane = from.closest<HTMLElement>("[data-pane]")!;
      const fp = plan(from, from, fromPane); // only its pull-back pose is used
      gsap.set(from, { transformOrigin: "0 0", willChange: "transform" });
      tl.to(from, { ...fp.pullNow, duration: 0.5, ease: e.slow.ease }, 0);
      tl.set(paneEl, { scrollTop: finale ? 0 : P.S }, 0);
      tl.set(stage, finale ? about(PULL, P.g.sw / 2, 0) : P.pullOn, 0);
      const left = () => Math.abs(paneEl.getBoundingClientRect().left - vp.getBoundingClientRect().left);
      const d0 = Math.max(left(), 1);
      tl.addPause(0.5, () => {
        const t0 = performance.now();
        const wait = () => {
          if (c.tl !== tl) return;
          if (left() <= 0.2 * d0 + 0.5 || performance.now() - t0 > 2500) tl.resume();
          else requestAnimationFrame(wait);
        };
        wait();
      });
    } else if (finale) {
      tl.to(stage, { ...about(1, 0, 0), duration: 0.5, ease: e.slow.ease });
      tl.to(paneEl, { scrollTop: 0, duration: trackFor(paneEl.scrollTop), ease: e.track });
    }

    if (finale) {
      // The crane: the whole Home page in frame (top centre), one beat on it, then down into the hero on `land`.
      const fit = clamp(P.H / (P.g.sy + P.g.sh + parseFloat(getComputedStyle(paneEl).paddingBottom)), 0.2, 1);
      tl.to(stage, { ...about(fit, P.g.sw / 2, 0), duration: e.slow.duration, ease: e.slow.ease });
      tl.to(stage, { ...about(1, 0, 0), duration: e.land.duration, ease: e.land.ease }, "+=1.2");
    } else if (from) {
      push();
    } else if (mode === "cut" && Math.abs(P.S - P.S0) > 48) {
      // Same pane, a new subject: pull back, track, push in.
      const d = trackFor(Math.abs(P.S - P.S0));
      tl.to(stage, { ...P.pullNow, duration: 0.5, ease: e.slow.ease });
      tl.to(paneEl, { scrollTop: P.S, duration: d, ease: e.track }, "<0.2");
      tl.to(stage, { ...P.pullOn, duration: d, ease: e.track }, "<");
      push(">-0.15");
    } else {
      // Close by, a resize or a re-frame: one glide.
      tl.to(paneEl, { scrollTop: P.S, duration: e.glide.duration, ease: e.glide.ease });
      tl.to(stage, { ...P.final, duration: e.glide.duration, ease: e.glide.ease }, "<");
    }
  };

  // A new subject: a full move.
  useEffect(() => { cam.current.fixed = false; cam.current.tries = 0; move.current("cut"); }, [target, pane, finale]);

  // Paused: the focus lifts and the page is yours. Play: the camera finds the subject again.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    // The page is the visitor's at once: a move under way stops where it is (play re-frames from there).
    if (paused) {
      cam.current.tl?.kill();
      if (cam.current.stage) gsap.set(cam.current.stage, { willChange: "auto" });
      delete document.querySelector<HTMLElement>("[data-era]")?.dataset.camera;
      gsap.set(veil.current, { backdropFilter: "none" });
      gsap.to(veil.current, { autoAlpha: 0, duration: 0.4, ease: eases().track, overwrite: true });
    }
    else move.current("glide");
  }, [paused]);

  // A resize re-frames in one move.
  useEffect(() => {
    let id = 0;
    const onResize = () => { clearTimeout(id); id = window.setTimeout(() => { if (!now.current.paused) move.current("glide"); }, 200); };
    addEventListener("resize", onResize);
    return () => { removeEventListener("resize", onResize); clearTimeout(id); };
  }, []);

  // An era change (which runs once the camera has landed) restyles the page and can move the subject: once its
  // transition is over (the longest, dial-up, takes 1.44s), re-frame if it moved.
  useEffect(() => {
    const vp = document.querySelector<HTMLElement>("[data-era]");
    if (!vp) return;
    let id = 0;
    const mo = new MutationObserver(() => {
      clearTimeout(id);
      id = window.setTimeout(() => {
        const c = cam.current, pane = c.stage?.closest<HTMLElement>("[data-pane]");
        if (now.current.paused || now.current.finale || vp.dataset.camera || !c.el?.isConnected || !c.stage || !pane) return;
        if (drifted(c.el, c.stage, pane)) move.current("glide");
      }, 1500);
    });
    mo.observe(vp, { attributes: true, attributeFilter: ["data-era"] });
    return () => { mo.disconnect(); clearTimeout(id); };
  }, []);

  // The hole follows the subject's live rect every frame (builds and the zoom move it).
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const v = veil.current, el = cam.current.el;
      if (v && el?.isConnected && v.style.visibility !== "hidden") {
        const r = el.getBoundingClientRect();
        const d = holePath({ w: innerWidth, h: innerHeight }, { x: r.left, y: r.top, w: r.width, h: r.height }, 18, PAD);
        v.style.clipPath = `path(${d.replace(", ", ', "')}")`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // The guide closing leaves the page as it is, unzoomed.
  useEffect(() => () => {
    const c = cam.current;
    c.tl?.kill();
    c.tl = undefined;
    cancelAnimationFrame(c.retry ?? 0);
    for (const st of document.querySelectorAll<HTMLElement>("[data-stage]")) { gsap.killTweensOf(st); gsap.set(st, { clearProps: STAGE_PROPS }); }
    for (const p of document.querySelectorAll<HTMLElement>("[data-pane]")) gsap.killTweensOf(p);
    delete document.querySelector<HTMLElement>("[data-era]")?.dataset.camera;
  }, []);

  return <div ref={veil} className={s.veil} style={{ visibility: "hidden", opacity: 0 }} aria-hidden="true" />;
}
