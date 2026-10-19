"use client";
import { useEffect, useRef } from "react";
import { hold } from "@/lib/stagger";
import s from "./Finale.module.css";

export type Prop = "phone" | "printer" | "rolodex";
// warm: the guide has ended and the lamp switches warmer (research §7).
type Props = { className?: string; hot: Prop | null; warm?: boolean; onHot: (p: Prop | null) => void; onPick: (p: Prop) => void; onScreen?: () => void };
export type Live = { hot: Prop | null; warm?: boolean; onHot: Props["onHot"]; onPick: Props["onPick"]; onScreen?: () => void };

const NOTES: [Prop, string][] = [["phone", "text me"], ["printer", "print me out"], ["rolodex", "my LinkedIn"]];
// Every clickable thing gets a hotspot: [key, its button's label, the word that shows on hover].
export type Spot = "her" | "Siamese" | "Burmese" | "pc" | "strat" | "phone" | "printer" | "photos";
export const SPOTS: [Spot, string, string][] = [
  ["her", "Say hi to Adelina", "say hi"], ["Siamese", "Pet the Siamese", "pet me"], ["Burmese", "Pet the Burmese", "pet me"],
  ["pc", "Boot Windows 95 on my computer", "boot Win95"], ["strat", "Play her red Stratocaster", "play me"],
  ["phone", "Text me", "text me"], ["printer", "Print my CV", "print my CV"], ["photos", "See the photos on my wall", "my photos"],
];

// Her teenage bedroom, baked in Blender (art/README.md), in the hero. One object for each way in: a Nokia for
// Message me, an inkjet for the PDF, her PC monitor for LinkedIn. Hover a button and its object acts; point at
// an object and its button lights. The preview render shows at once; the live room fades in over it.
export type Bufs = { room: Promise<ArrayBuffer | null>; her: Promise<ArrayBuffer | null> };
export const grab = (url: string) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);

export default function Finale({ className, hot, warm, onHot, onPick, onScreen }: Props) {
  // The preview and both models are preloaded by the layout's head script for a return visit; a first visit fetches
  // them behind the boot screen's C64 (Shell).
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<Live>({ hot, warm, onHot, onPick, onScreen });
  live.current = { hot, warm, onHot, onPick, onScreen };

  useEffect(() => {
    const el = host.current!;
    mark("effect");
    let cleanup = () => {}, started = false, dead = false;
    const release = hold(); // the page's other heavy starts wait for the room (lib/stagger); it isn't on screen: they don't
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) { if (!started) release(); return; }
      if (started) return;
      started = true;
      mark("visible");
      // Both files at once (the preloads already have them in flight), while the scene's code loads; the preview covers the wait.
      const bufs = { room: grab("/models/room.glb"), her: grab("/models/character.glb") };
      const c = await import("./FinaleScene").then((m) => m.mount(el, live, () => !dead, bufs, release)).catch(() => { release(); return () => {}; });
      if (dead) c(); else cleanup = c; // unmounted while it loaded: tidy up straight away
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => { dead = true; release(); io.disconnect(); cleanup(); };
  }, []);

  return (
    <div ref={host} className={`${s.host} ${className ?? ""}`} role="group" aria-label="My teenage bedroom at dusk: rock posters, a window, my guitars, a skateboard, boxing gloves, a corner desk with my PC, a Nokia phone, an inkjet printer, a bed with bookshelves, and my two cats. I'm in it too, sitting on the bed playing guitar and now and then getting up to work at the desk. Everything marked can be clicked: say hi to me, pet a cat, boot my computer into Windows 95, text me from the phone, or print my CV. Drag to look around the room; pinch or double-click to zoom in.">
      <svg className={s.arrows} aria-hidden="true">{NOTES.map(([p]) => <path key={p} data-arrow={p} />)}</svg>
      {NOTES.map(([p, text]) => <span key={p} className={s.note} data-note={p} aria-hidden="true"><span>{text}</span></span>)}
      {SPOTS.map(([k, aria, label], i) => (
        <button key={k} type="button" className={s.spot} data-spot={k} data-off="" aria-label={aria} style={{ "--d": `${-i * 1.37}s` } as React.CSSProperties}>
          <span className={s.dot} aria-hidden="true" /><span className={s.spotLabel} aria-hidden="true"><span>{label}</span></span>
        </button>
      ))}
      <div className={s.ghost} data-ghost aria-hidden="true">
        <span className={s.ripple} data-ripple />
        <svg className={`${s.cursor} ${s.arrow}`} viewBox="0 0 24 30"><path d="M3 2v22l5.6-5.3 3.9 9 3.6-1.6-3.9-8.8h7.8z" /></svg>
        <svg className={`${s.cursor} ${s.finger}`} viewBox="0 0 26 32"><path d="M9 4a2 2 0 0 1 4 0v9.2l1.3-.2a2 2 0 0 1 2.2 1.7l1.2-.1a2 2 0 0 1 2.2 1.8l1.1.1a2 2 0 0 1 2 2V24a7 7 0 0 1-7 7h-3.2a6.5 6.5 0 0 1-5.3-2.8L3.8 22a2 2 0 0 1 3.1-2.5L9 22z" /></svg>
        <span className={s.caption} data-caption />
      </div>
      <span className={s.hint} data-hint aria-hidden="true"><span>drag to look around · double-click to zoom</span></span>
      <button type="button" className={s.reset} data-reset aria-label="Back to the front, zoomed out"><span>zoom out</span></button>
    </div>
  );
}

// A late-2000s phone screen: a status bar, then the envelope, then the message.

export const mark = (n: string) => performance.mark(`room:${n}`);
