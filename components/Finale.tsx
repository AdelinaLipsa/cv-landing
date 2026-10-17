"use client";
import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import type * as T from "three";
import type { Toy } from "@/lib/toyStage";
import { profile } from "@/content/cv";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import s from "./Finale.module.css";

export type Prop = "phone" | "printer" | "rolodex";
// warm: the guide has ended and the lamp switches warmer (research §7).
type Props = { className?: string; hot: Prop | null; warm?: boolean; onHot: (p: Prop | null) => void; onPick: (p: Prop) => void; onScreen?: () => void };
type Live = { hot: Prop | null; warm?: boolean; onHot: Props["onHot"]; onPick: Props["onPick"]; onScreen?: () => void };

const NOTES: [Prop, string][] = [["phone", "text me"], ["printer", "print me out"], ["rolodex", "my LinkedIn"]];
// Each note's text sits in open page space just off the room's silhouette (as a fraction of the canvas, for the
// fixed camera), and its arrow is redrawn every frame to land on the object itself. "rolodex" is her PC monitor, which
// wakes with her LinkedIn card while the LinkedIn button is hovered; the Prop name stays for the wiring.
const LABEL: Record<Prop, [number, number]> = { phone: [0.1, 0.8], printer: [0.36, 0.05], rolodex: [0.8, 0.13] };
const TARGET: Record<Prop, string> = { phone: "PhoneScreen", printer: "PrinterBodyMesh", rolodex: "Screen" };
const PICK_NODE: Record<Prop, string> = { phone: "Phone", printer: "Printer", rolodex: "Monitor" };
// Every clickable thing gets a hotspot: [key, its button's label, the word that shows on hover].
type Spot = "her" | "Siamese" | "Burmese" | "pc" | "strat" | "phone" | "printer" | "photos";
const SPOTS: [Spot, string, string][] = [
  ["her", "Say hi to Adelina", "say hi"], ["Siamese", "Pet the Siamese", "pet me"], ["Burmese", "Pet the Burmese", "pet me"],
  ["pc", "Boot Windows 95 on my computer", "boot Win95"], ["strat", "Play her red Stratocaster", "play me"],
  ["phone", "Text me", "text me"], ["printer", "Print my CV", "print my CV"], ["photos", "See the photos on my wall", "my photos"],
];

// Her teenage bedroom, baked in Blender (art/README.md), in the hero. One object for each way in: a Nokia for
// Message me, an inkjet for the PDF, her PC monitor for LinkedIn. Hover a button and its object acts; point at
// an object and its button lights. The preview render shows at once; the live room fades in over it.
type Bufs = { room: Promise<ArrayBuffer | null>; her: Promise<ArrayBuffer | null> };
const grab = (url: string) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);

export default function Finale({ className, hot, warm, onHot, onPick, onScreen }: Props) {
  // The hero: the preview and both models start downloading with the page, not after it.
  preload("/models/room-preview.webp", { as: "image", fetchPriority: "high" });
  preload("/models/room.glb", { as: "fetch", crossOrigin: "anonymous" });
  preload("/models/character.glb", { as: "fetch", crossOrigin: "anonymous" });
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<Live>({ hot, warm, onHot, onPick, onScreen });
  live.current = { hot, warm, onHot, onPick, onScreen };

  useEffect(() => {
    const el = host.current!;
    mark("effect");
    let cleanup = () => {}, started = false, dead = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      mark("visible");
      // Both files at once (the preloads already have them in flight); the preview covers the wait.
      const c = await mount(el, live, () => !dead, { room: grab("/models/room.glb"), her: grab("/models/character.glb") });
      if (dead) c(); else cleanup = c; // unmounted while it loaded: tidy up straight away
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => { dead = true; io.disconnect(); cleanup(); };
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
function phoneScreen(stage: 0 | 1) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 192;
  const x = c.getContext("2d")!;
  const bg = x.createLinearGradient(0, 0, 0, 192); bg.addColorStop(0, "#cfe8ff"); bg.addColorStop(1, "#7fb2e8");
  x.fillStyle = bg; x.fillRect(0, 0, 256, 192);
  x.fillStyle = "#0b2a55"; x.fillRect(0, 0, 256, 26);
  x.fillStyle = "#e8f3ff";
  for (let i = 0; i < 4; i++) x.fillRect(10 + i * 8, 18 - i * 4, 5, 4 + i * 4); // signal bars
  x.strokeStyle = "#e8f3ff"; x.lineWidth = 2; x.strokeRect(214, 7, 30, 13); x.fillRect(244, 10, 3, 7); x.fillRect(217, 10, 20, 7); // battery
  x.fillStyle = "#0b2a55"; x.textAlign = "center";
  if (stage === 0) {
    x.fillStyle = "#fffdf2"; x.fillRect(84, 52, 88, 58); x.strokeStyle = "#0b2a55"; x.lineWidth = 4; x.strokeRect(84, 52, 88, 58);
    x.beginPath(); x.moveTo(84, 52); x.lineTo(128, 88); x.lineTo(172, 52); x.stroke(); // the envelope
    x.fillStyle = "#0b2a55"; x.font = "bold 24px sans-serif"; x.fillText("1 new message", 128, 150);
  } else {
    x.font = "bold 22px sans-serif"; x.fillText(profile.name.split(" ")[0], 128, 58);
    x.fillStyle = "#fffdf2"; x.fillRect(20, 74, 216, 70); x.strokeStyle = "#0b2a55"; x.lineWidth = 3; x.strokeRect(20, 74, 216, 70);
    x.fillStyle = "#0b2a55"; x.font = "bold 26px sans-serif"; x.fillText("hi! 👋 let’s talk", 128, 120);
  }
  x.fillStyle = "#0b2a55"; x.fillRect(0, 166, 256, 26); x.fillStyle = "#e8f3ff"; x.font = "bold 16px sans-serif";
  x.textAlign = "left"; x.fillText(stage ? "Reply" : "Open", 12, 185); x.textAlign = "right"; x.fillText("Back", 244, 185);
  return c;
}

// Her LinkedIn card in a late-2000s browser window, for the monitor.
function browserScreen() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 320;
  const x = c.getContext("2d")!;
  x.fillStyle = "#3a6ea5"; x.fillRect(0, 0, 512, 320); // the desktop behind the window
  const bar = x.createLinearGradient(0, 8, 0, 34); bar.addColorStop(0, "#5a8fd8"); bar.addColorStop(1, "#1f4f9e");
  x.fillStyle = bar; x.fillRect(8, 8, 496, 26); // title bar
  x.fillStyle = "#fff"; x.font = "bold 14px Tahoma, sans-serif"; x.fillText("Adelina Lipșa | LinkedIn", 16, 26);
  for (const [i, col] of ["#d9534f", "#c9c9c9", "#c9c9c9"].entries()) { x.fillStyle = col; x.fillRect(482 - i * 22, 12, 18, 18); }
  x.fillStyle = "#ece9d8"; x.fillRect(8, 34, 496, 30); // toolbar
  x.fillStyle = "#fff"; x.fillRect(70, 40, 426, 18); x.strokeStyle = "#7f9db9"; x.lineWidth = 1; x.strokeRect(70.5, 40.5, 426, 18);
  x.fillStyle = "#333"; x.font = "13px Tahoma, sans-serif"; x.fillText(`http://www.linkedin.com/${profile.linkedinHandle}`, 76, 54);
  x.fillStyle = "#8a8a8a"; x.fillText("◀  ▶", 16, 55);
  x.fillStyle = "#f3f2ef"; x.fillRect(8, 64, 496, 248); // the page
  x.fillStyle = "#0a66c2"; x.fillRect(8, 64, 496, 6);
  x.fillStyle = "#fff"; x.fillRect(28, 86, 456, 204); x.strokeStyle = "#d6d6d6"; x.strokeRect(28.5, 86.5, 456, 204);
  x.fillStyle = "#c9d6e3"; x.fillRect(48, 106, 96, 96); x.fillStyle = "#8aa4bd"; // the photo slot, a silhouette
  x.beginPath(); x.arc(96, 140, 20, 0, 7); x.fill(); x.fillRect(66, 168, 60, 34);
  x.fillStyle = "#1d1d1d"; x.font = "bold 28px Tahoma, sans-serif"; x.fillText(profile.name, 162, 132);
  x.fillStyle = "#444"; x.font = "18px Tahoma, sans-serif"; x.fillText(profile.role, 162, 162);
  x.fillStyle = "#0a66c2"; x.font = "15px Tahoma, sans-serif"; x.fillText(profile.linkedinHandle, 162, 188);
  x.fillStyle = "#0a66c2"; x.fillRect(162, 222, 120, 36); x.fillStyle = "#fff"; x.font = "bold 17px Tahoma, sans-serif"; x.fillText("Connect", 186, 246);
  return c;
}

// Her PC, awake: a Windows 95 desktop, teal, two icons and the taskbar.
function win95Screen() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 320;
  const x = c.getContext("2d")!;
  x.fillStyle = "#008080"; x.fillRect(0, 0, 512, 320);
  for (const [i, label] of ["My Computer", "Recycle Bin"].entries()) {
    const y = 18 + i * 78;
    x.fillStyle = i ? "#c0c0c0" : "#d4d0c8"; x.fillRect(30, y, 36, 30); x.fillStyle = i ? "#808080" : "#1f4f9e"; x.fillRect(35, y + 5, 26, i ? 22 : 16); // the icon
    x.fillStyle = "#fff"; x.font = "13px Tahoma, sans-serif"; x.textAlign = "center"; x.fillText(label, 48, y + 48);
  }
  x.textAlign = "left";
  x.fillStyle = "#c0c0c0"; x.fillRect(0, 288, 512, 32); x.fillStyle = "#fff"; x.fillRect(0, 288, 512, 2); // the taskbar
  x.fillStyle = "#c0c0c0"; x.fillRect(4, 293, 74, 23); x.strokeStyle = "#fff"; x.lineWidth = 2; x.strokeRect(5, 294, 72, 21); x.strokeStyle = "#404040"; x.beginPath(); x.moveTo(77, 294); x.lineTo(77, 315); x.lineTo(5, 315); x.stroke();
  for (const [i, col] of ["#ff3b30", "#34c759", "#0a84ff", "#ffcc00"].entries()) { x.fillStyle = col; x.fillRect(12 + (i % 2) * 8, 298 + Math.floor(i / 2) * 7, 7, 6); } // the flag
  x.fillStyle = "#000"; x.font = "bold 15px Tahoma, sans-serif"; x.fillText("Start", 32, 311);
  x.fillStyle = "#c0c0c0"; x.fillRect(440, 293, 68, 23); x.strokeStyle = "#808080"; x.strokeRect(441, 294, 66, 21);
  x.fillStyle = "#000"; x.font = "13px Tahoma, sans-serif"; x.fillText("4:20 PM", 452, 309);
  return c;
}

// Page one of the CV, for the paper the printer pushes out.
function cvPage() {
  const c = document.createElement("canvas"); c.width = 210; c.height = 297;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fbfaf4"; x.fillRect(0, 0, 210, 297);
  x.fillStyle = "#17153a"; x.font = "bold 17px sans-serif"; x.fillText(profile.name, 18, 36);
  x.fillStyle = "#0a66c2"; x.font = "11px sans-serif"; x.fillText(profile.role, 18, 54);
  x.fillStyle = "#c9c4b4"; x.fillRect(18, 64, 174, 2);
  for (let y = 82; y < 280; y += 14) { x.fillStyle = y % 70 === 82 % 70 ? "#8f8aa8" : "#cfcbdc"; x.fillRect(18, y, 90 + ((y * 37) % 84), 5); } // the rest, as lines
  return c;
}

// Her records: the real covers of the bands on her walls (/media/records/sleeves.jpg, drawn over tiles 0-6 once it
// loads; the drawn ones below stand in until then), and two bare discs, on one 1536 px sheet of 512 px tiles.
function records() {
  const c = document.createElement("canvas"); c.width = c.height = 1536;
  const x = c.getContext("2d")!; x.scale(3.2, 3.2); // drawn on the old 480 px grid
  const SLEEVES: [string, string, string][] = [ // band, ground, ink
    ["LED ZEPPELIN", "#d9cdb0", "#2a2420"], ["KORN", "#1c2a2e", "#c9d6b8"], ["SLIPKNOT", "#a8241c", "#151515"], ["OZZY", "#2a1838", "#d9c9ef"],
    ["PINK FLOYD", "#0d0d14", "#f2f2f2"], ["SONATA ARCTICA", "#1d3550", "#e8f1fb"], ["NIRVANA", "#e7d9b8", "#3a2a1a"],
  ];
  SLEEVES.forEach(([band, ground, ink], i) => {
    x.save(); x.translate((i % 3) * 160, Math.floor(i / 3) * 160);
    x.fillStyle = ground; x.fillRect(0, 0, 160, 160);
    x.fillStyle = x.strokeStyle = ink; x.lineWidth = 3;
    if (i === 0) { x.beginPath(); x.ellipse(80, 64, 50, 18, -0.15, 0, 7); x.fill(); x.fillRect(118, 50, 14, 6); } // an airship
    if (i === 1) for (let k = 0; k < 14; k++) { x.beginPath(); x.moveTo(20 + k * 9, 20); x.lineTo(40 + k * 7 + (k % 3) * 6, 112); x.stroke(); } // scratches
    if (i === 2) for (let k = 0; k < 22; k++) x.fillRect(22 + k * 5.4, 24, k % 3 ? 2 : 4, 82); // a barcode
    if (i === 3) { x.beginPath(); x.moveTo(80, 58); for (const [px, py] of [[30, 40], [44, 62], [18, 72], [62, 76], [80, 96], [98, 76], [142, 72], [116, 62], [130, 40]]) x.lineTo(px, py); x.closePath(); x.fill(); } // a bat
    if (i === 4) ["#ff4d4d", "#ffb347", "#ffe66b", "#6bd38b", "#5aa9ff", "#a37bff"].forEach((col, k) => { x.strokeStyle = col; x.beginPath(); x.arc(80, 70, 44 - k * 6, 0, 7); x.stroke(); }); // rings
    if (i === 5) { x.beginPath(); x.moveTo(24, 112); x.lineTo(80, 32); x.lineTo(136, 112); x.fill(); x.fillStyle = ground; x.beginPath(); x.moveTo(62, 58); x.lineTo(80, 32); x.lineTo(98, 58); x.lineTo(80, 50); x.fill(); } // a peak
    if (i === 6) { x.beginPath(); x.arc(80, 66, 22, 0, 7); x.fill(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; x.beginPath(); x.moveTo(80 + Math.cos(a) * 30, 66 + Math.sin(a) * 30); x.lineTo(80 + Math.cos(a) * 44, 66 + Math.sin(a) * 44); x.stroke(); } } // a sun
    x.fillStyle = ink; x.font = `900 ${band.length > 10 ? 15 : 22}px Impact, "Arial Black", sans-serif`; x.textAlign = "center"; x.fillText(band, 80, 144);
    x.strokeStyle = "rgba(0,0,0,0.25)"; x.lineWidth = 2; x.strokeRect(1, 1, 158, 158); // worn edges
    x.restore();
  });
  for (const [i, label] of [[7, "#e0563b"], [8, "#f2c14e"]] as const) { // a disc: grooves, a sheen across them, a paper label
    const cx = (i % 3) * 160 + 80, cy = Math.floor(i / 3) * 160 + 80;
    x.fillStyle = "#0b0b0d"; x.fillRect(cx - 80, cy - 80, 160, 160);
    for (let r = 30; r < 79; r += 1.5) { x.strokeStyle = `rgba(255,255,255,${r % 6 < 1.5 ? 0.07 : 0.025})`; x.lineWidth = 0.8; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); }
    const sheen = x.createConicGradient(0.6, cx, cy);
    for (const [at, a] of [[0, 0], [0.06, 0.22], [0.12, 0], [0.5, 0], [0.56, 0.18], [0.62, 0], [1, 0]]) sheen.addColorStop(at, `rgba(255,255,255,${a})`);
    x.fillStyle = sheen; x.beginPath(); x.arc(cx, cy, 79, 0, 7); x.arc(cx, cy, 28, 0, 7, true); x.fill();
    x.fillStyle = label; x.beginPath(); x.arc(cx, cy, 26, 0, 7); x.fill();
    x.fillStyle = "#0b0b0d"; x.beginPath(); x.arc(cx, cy, 2.5, 0, 7); x.fill();
  }
  return c;
}

// Load timings: performance marks always (cheap; read them in any build), a table in dev once she's in.
// Polaroids over her bed: 8.8 × 10.7 cm, a 7.9 cm square window, the fat margin at the bottom (50 px a cm).
// Each shot is drawn into the window, then gets the same film: warmed, blacks lifted, a light leak, vignette, grain.
type Shot = (x: CanvasRenderingContext2D, s: number, h?: number) => void; // s wide, h tall (default square)
const POL = { w: 440, h: 535, m: 22, s: 396 }, WIDE = { w: 540, h: 430, m: 22, s: 496, t: 310 }; // WIDE: an Instax Wide, 10.8 × 8.6 cm
const halo = (x: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string, a: number) => {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(0.55, `rgba(${c},${a * 0.45})`); g.addColorStop(1, `rgba(${c},0)`);
  x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
};
const photo = (img: HTMLImageElement, lift = 0.2, fx = 0.5): Shot => (x, s, h = s) => { // cover-crop; lift/fx: where the slack goes (faces sit a little above centre)
  const nw = img.naturalWidth, nh = img.naturalHeight, cw = Math.min(nw, (nh * s) / h), ch = (cw * h) / s;
  x.drawImage(img, (nw - cw) * fx, (nh - ch) * lift, cw, ch, 0, 0, s, h);
};
const dusk: Shot = (x, s) => { // her city from the window: a lilac-to-peach sky, rooftops, lit windows, bokeh
  const g = x.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, "#2b2556"); g.addColorStop(0.45, "#8a5ea8"); g.addColorStop(0.72, "#f39272"); g.addColorStop(1, "#ffd6a0");
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  halo(x, s * 0.62, s * 0.7, s * 0.3, "255,214,160", 0.8);
  let r = 7;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let i = 0, bx = -10; bx < s; i++) {
    const w = 30 + rnd() * 50, h = s * (0.18 + rnd() * 0.32);
    x.fillStyle = "#231a34"; x.fillRect(bx, s - h, w, h);
    for (let wy = s - h + 10; wy < s - 8; wy += 14) for (let wx = bx + 6; wx < bx + w - 8; wx += 11) if (rnd() < 0.35) { x.fillStyle = rnd() < 0.7 ? "#ffcf86" : "#ff9fb8"; x.fillRect(wx, wy, 5, 7); }
    bx += w + 2;
  }
  for (let i = 0; i < 9; i++) halo(x, rnd() * s, s * (0.55 + rnd() * 0.4), 10 + rnd() * 22, rnd() < 0.5 ? "255,190,120" : "255,150,190", 0.55);
};
const lanterns: Shot = (x, s) => { // ramen in the dark: red paper lanterns outside the shop, out of focus
  x.fillStyle = "#130d18"; x.fillRect(0, 0, s, s);
  halo(x, s * 0.5, s * 0.95, s * 0.6, "120,40,40", 0.5);
  for (const [cx, cy, r] of [[0.28, 0.34, 0.15], [0.68, 0.28, 0.12], [0.86, 0.62, 0.09]] as const) {
    halo(x, cx * s, cy * s, r * s * 2.2, "255,110,60", 0.35);
    x.fillStyle = "#e0482f"; x.beginPath(); x.ellipse(cx * s, cy * s, r * s * 0.8, r * s, 0, 0, Math.PI * 2); x.fill();
    halo(x, cx * s, cy * s, r * s, "255,214,150", 0.9);
    x.strokeStyle = "rgba(90,20,15,0.45)"; x.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { x.beginPath(); x.ellipse(cx * s, cy * s, r * s * 0.8 * Math.abs(k / 2.4), r * s, 0, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = "#2a1410"; x.fillRect(cx * s - r * s * 0.35, cy * s - r * s - 5, r * s * 0.7, 6); x.fillRect(cx * s - r * s * 0.35, cy * s + r * s - 1, r * s * 0.7, 6);
  }
  for (let i = 0; i < 14; i++) halo(x, ((i * 97) % 100) / 100 * s, s * (0.55 + ((i * 37) % 40) / 100), 8 + (i % 4) * 6, "255,200,140", 0.4);
};
const cats: Shot = (x, s) => { // the girls on the windowsill, against the sunset
  const g = x.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, "#5b4a8c"); g.addColorStop(0.55, "#f0937a"); g.addColorStop(1, "#ffd3a1");
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  halo(x, s * 0.5, s * 0.78, s * 0.35, "255,230,180", 0.7);
  x.fillStyle = "#1f1628"; x.fillRect(0, s * 0.82, s, s * 0.18); x.fillRect(s * 0.48, 0, 10, s * 0.82); x.fillRect(0, s * 0.4, s, 8); // sill, mullions
  const cat = (cx: number, h: number, flip: number) => {
    const by = s * 0.82;
    x.beginPath(); x.ellipse(cx, by - h * 0.34, h * 0.26, h * 0.36, 0, 0, Math.PI * 2); x.fill(); // body
    x.beginPath(); x.arc(cx + flip * h * 0.04, by - h * 0.8, h * 0.17, 0, Math.PI * 2); x.fill(); // head
    for (const e of [-1, 1]) { const ex = cx + flip * h * 0.04 + e * h * 0.1; x.beginPath(); x.moveTo(ex - h * 0.07, by - h * 0.86); x.lineTo(ex + e * h * 0.03, by - h * 1.04); x.lineTo(ex + h * 0.07, by - h * 0.88); x.fill(); }
    x.lineWidth = h * 0.07; x.lineCap = "round"; x.strokeStyle = "#1f1628";
    x.beginPath(); x.moveTo(cx - flip * h * 0.2, by - h * 0.06); x.quadraticCurveTo(cx - flip * h * 0.55, by - h * 0.05, cx - flip * h * 0.5, by - h * 0.4); x.stroke(); // tail
  };
  x.fillStyle = "#1f1628"; cat(s * 0.3, s * 0.36, 1); cat(s * 0.7, s * 0.3, -1);
};
// A shot inside its paper frame, with an optional handwritten caption in the bottom margin.
const polaroid = (shot: Shot, caption = "", font = "cursive", k = 1, wide = false) => { // k: resolution; wide: landscape print
  const F = wide ? WIDE : { ...POL, t: POL.s }, s = F.s, t = F.t;
  const c = document.createElement("canvas"); c.width = F.w * k; c.height = F.h * k;
  const x = c.getContext("2d")!;
  x.scale(k, k);
  x.fillStyle = "#f3ecdf"; x.fillRect(0, 0, F.w, F.h);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "120,100,80" : "255,255,255"},0.05)`; x.fillRect(Math.random() * F.w, Math.random() * F.h, 1.5, 1.5); } // paper tooth
  x.save(); x.translate(F.m, F.m); x.beginPath(); x.rect(0, 0, s, t); x.clip();
  shot(x, s, t);
  x.globalCompositeOperation = "soft-light"; x.fillStyle = "rgba(255,170,100,0.45)"; x.fillRect(0, 0, s, t); // warm
  x.globalCompositeOperation = "screen"; x.fillStyle = "rgba(60,36,70,0.32)"; x.fillRect(0, 0, s, t); // faded blacks
  const leak = x.createLinearGradient(s, 0, s * 0.55, t * 0.45); leak.addColorStop(0, "rgba(255,120,60,0.45)"); leak.addColorStop(1, "rgba(255,120,60,0)");
  x.fillStyle = leak; x.fillRect(0, 0, s, t); // a light leak off one corner
  x.globalCompositeOperation = "source-over";
  const v = x.createRadialGradient(s / 2, t / 2, Math.min(s, t) * 0.3, s / 2, t / 2, Math.max(s, t) * 0.75); v.addColorStop(0, "rgba(20,10,25,0)"); v.addColorStop(1, "rgba(20,10,25,0.6)");
  x.fillStyle = v; x.fillRect(0, 0, s, t);
  const d = x.getImageData(F.m * k, F.m * k, s * k, t * k), p = d.data; // device pixels: get/putImageData ignore the transform
  for (let i = 0; i < p.length; i += 4) { const n = (Math.random() - 0.5) * 26; p[i] += n; p[i + 1] += n; p[i + 2] += n; } // grain
  x.putImageData(d, F.m * k, F.m * k);
  x.restore();
  x.strokeStyle = "rgba(60,40,30,0.25)"; x.lineWidth = 1; x.strokeRect(F.m - 0.5, F.m - 0.5, s + 1, t + 1);
  if (caption) { x.fillStyle = "#3a2c4a"; x.font = `42px ${font}`; x.textAlign = "center"; x.fillText(caption, F.w / 2, F.m + t + (F.h - F.m - t) / 2 + 14); }
  return c;
};

const mark = (n: string) => performance.mark(`room:${n}`);
const report = () => {
  if (process.env.NODE_ENV === "production") return;
  const t0 = performance.getEntriesByName("room:effect")[0]?.startTime ?? 0;
  console.table(Object.fromEntries(performance.getEntriesByType("mark").filter((m) => m.name.startsWith("room:")).map((m) => [m.name.slice(5), Math.round(m.startTime - t0)])));
};

async function mount(el: HTMLElement, live: React.RefObject<Live>, alive: () => boolean, bufs: Bufs) {
  const addons = Promise.all([ // fetched alongside the stage, not after it
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
    import("three/examples/jsm/postprocessing/Pass.js"),
  ]);
  const { toyStage } = await import("@/lib/toyStage");
  const toy: Toy = await toyStage(el);
  mark("stage");
  if (!alive()) { toy.dispose(); return () => {}; } // gone before the stage was ready: build nothing
  const { THREE, renderer, scene, camera, reduce, touch } = toy;
  const [{ GLTFLoader }, { MeshoptDecoder }, { UnrealBloomPass }, { FullScreenQuad }] = await addons;
  mark("addons");
  MeshoptDecoder.useWorkers(2); // decode off the main thread
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const parse = (b: ArrayBuffer | null) => (b ? loader.parseAsync(b, "/models/").catch(() => null) : null);
  const herP = bufs.her.then(parse); // her too, alongside the room
  const g = await bufs.room.then(parse);
  mark("room-parsed");
  if (!g) { toy.dispose(); return () => {}; } // offline or blocked: the preview render stays
  const room = g.scene;
  scene.add(room); // in the scene first, so dispose frees it even if we leave now
  if (!alive()) { toy.dispose(); return () => {}; }
  room.updateMatrixWorld(true);
  const node = (name: string) => room.getObjectByName(name)!;

  // Every surface already has its light baked in: show the texture as rendered, no lights, no tone mapping.
  const BLOOM = 1;
  const baked = new Map<T.Material, T.MeshBasicMaterial>();
  const meshes: T.Mesh[] = [];
  room.traverse((o) => {
    if (!(o as T.Mesh).isMesh) return;
    const m = o as T.Mesh, old = m.material as T.MeshStandardMaterial;
    if (/^Shadow(Floor|Bed)/.test(m.name)) { m.visible = false; return; } // her shadow catchers, for Part B
    if (m.name.startsWith("LightShaft")) return;
    if (!baked.has(old)) {
      if (old.map) old.map.colorSpace = THREE.SRGBColorSpace;
      baked.set(old, new THREE.MeshBasicMaterial({ name: old.name, map: old.map, toneMapped: false, transparent: old.transparent, depthWrite: !old.transparent, side: old.side }));
      old.dispose();
    }
    m.material = baked.get(old)!;
    if (m.name.startsWith("Glow_")) m.layers.enable(BLOOM); // window, fairy lights, lamp
    meshes.push(m);
  });

  // The sunset sky is a big plane behind the window; above and beside the cut-away walls it would show as a pale
  // slab. Clip it to the shell's box so it's only seen through the window.
  const sky = node("Glow_WindowMesh") as T.Mesh, shell = new THREE.Box3().setFromObject(node("Room_ShellMesh"));
  sky.material = (sky.material as T.Material).clone();
  sky.material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), shell.max.y), new THREE.Plane(new THREE.Vector3(0, 1, 0), -shell.min.y), new THREE.Plane(new THREE.Vector3(0, 0, 1), -shell.min.z), new THREE.Plane(new THREE.Vector3(0, 0, -1), shell.max.z)];
  renderer.localClippingEnabled = true;



  // The camera Blender rendered from, framed on the room itself: every vertex it draws, seen from the camera, as
  // tangents (x/z, y/z). The lens is fitted to the tighter of width and height and shifted onto it, plus MARGIN all
  // round, so no corner ever touches the canvas edge at any aspect.
  const view = node("View") as T.PerspectiveCamera;
  view.matrixWorld.decompose(camera.position, camera.quaternion, camera.scale);
  camera.near = view.near; camera.far = view.far;
  camera.updateMatrixWorld();
  const MARGIN = 0.06, fit = new THREE.Box2(), c = new THREE.Vector3(), tv = new THREE.Vector2(), toCam = new THREE.Matrix4();
  for (const m of meshes) {
    if (m.name === "Glow_WindowMesh") continue; // the sky plane: only ever seen through the window (clipped above)
    const at = m.geometry.getAttribute("position"), ix = m.geometry.index, n = ix ? ix.count : at.count;
    toCam.multiplyMatrices(camera.matrixWorldInverse, m.matrixWorld);
    for (let i = 0; i < n; i++) { c.fromBufferAttribute(at, ix ? ix.getX(i) : i).applyMatrix4(toCam); fit.expandByPoint(tv.set(c.x / -c.z, c.y / -c.z)); }
  }
  const fitMid = fit.getCenter(new THREE.Vector2()), fitSize = fit.getSize(new THREE.Vector2());
  el.dataset.fit = (fitSize.x / fitSize.y).toFixed(4); // the room's own aspect; the host's CSS matches it

  // Light cone: warm at the window (v = 0), fading along the beam and toward its silhouette, shimmering slowly.
  const shaft = node("LightShaftMesh") as T.Mesh;
  shaft.geometry.computeVertexNormals();
  const glow = { uTime: { value: 0 }, uShimmer: { value: reduce ? 0 : 1 } };
  (shaft.material as T.Material).dispose();
  shaft.material = new THREE.ShaderMaterial({
    uniforms: { ...glow, uWarm: { value: new THREE.Color("#FFB25E").convertLinearToSRGB() }, uDusk: { value: new THREE.Color("#8C7BD8").convertLinearToSRGB() } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime, uShimmer; uniform vec3 uWarm, uDusk; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        float face = pow(abs(dot(normalize(vN), normalize(vV))), 2.5);
        float along = pow(1.0 - vUv.y, 1.3);
        float shim = 1.0 + uShimmer * 0.18 * sin(uTime * 0.6 + vUv.y * 5.0 + 1.5 * sin(vUv.x * 12.566 + uTime * 0.35));
        vec3 col = mix(uWarm, uDusk, vUv.y * 0.55);
        float a = clamp(face * along * shim * 0.5, 0.0, 1.0);
        gl_FragColor = vec4(col * a, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, premultipliedAlpha: true,
  });

  // The beam's frame in world space, from its window end (v = 0) and floor end (v = 1), for the dust.
  const pos = shaft.geometry.getAttribute("position"), uv = shaft.geometry.getAttribute("uv");
  const ends: [T.Vector3[], T.Vector3[]] = [[], []];
  for (let i = 0; i < pos.count; i++) { const v = uv.getY(i); if (v < 0.001 || v > 0.999) ends[v < 0.5 ? 0 : 1].push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(shaft.matrixWorld)); }
  const corners = (pts: T.Vector3[]) => { // a rectangle's corners are its points farthest from the middle
    const mid = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(pts.length), out: T.Vector3[] = [];
    for (const p of [...pts].sort((a, b) => b.distanceTo(mid) - a.distanceTo(mid))) if (out.length < 4 && out.every((q) => q.distanceTo(p) > 0.02)) out.push(p);
    return out;
  };
  const A = corners(ends[0]), B = corners(ends[1]);
  const cA = A.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(0.25), cB = B.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(0.25);
  const diag = A.slice(1).sort((a, b) => b.distanceTo(A[0]) - a.distanceTo(A[0]))[0], [s1, s2] = A.slice(1).filter((p) => p !== diag);
  const ex = s1.clone().sub(A[0]), ey = s2.clone().sub(A[0]), H = new THREE.Vector2(ex.length() / 2, ey.length() / 2);
  ex.normalize(); ey.normalize();
  const nA = ex.clone().cross(ey).normalize(), D = cB.clone().sub(cA), LEN = D.length(); D.normalize();
  const onWindow = (p: T.Vector3) => { const q = p.clone().addScaledVector(D, -p.clone().sub(cA).dot(nA) / D.dot(nA)).sub(cA); return new THREE.Vector2(Math.abs(q.dot(ex)), Math.abs(q.dot(ey))); };
  const HF = B.reduce((h, p) => h.max(onWindow(p)), new THREE.Vector2()); // the beam widens toward the floor

  // Dust: soft motes drifting through the shaft's box, lit only inside the beam, each twinkling to its own beat.
  const box = new THREE.Box3().setFromObject(shaft), size = box.getSize(new THREE.Vector3());
  const COUNT = touch ? 120 : 250, start = new Float32Array(COUNT * 3), phase = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) { start.set([box.min.x + Math.random() * size.x, box.min.y + Math.random() * size.y, box.min.z + Math.random() * size.z], i * 3); phase[i] = Math.random(); }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(start, 3));
  dustGeo.setAttribute("phase", new THREE.BufferAttribute(phase, 1));
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: {
      uTime: glow.uTime, uPx: { value: renderer.getPixelRatio() }, uMin: { value: box.min }, uSize: { value: size },
      uA: { value: cA }, uD: { value: D }, uN: { value: nA }, uEx: { value: ex }, uEy: { value: ey }, uH: { value: H }, uHF: { value: HF }, uLen: { value: LEN },
      uColor: { value: new THREE.Color("#FFE4BC").convertLinearToSRGB() }, // the shaders write display colours straight out
    },
    vertexShader: `attribute float phase; uniform float uTime, uPx, uLen; uniform vec3 uMin, uSize, uA, uD, uN, uEx, uEy; uniform vec2 uH, uHF; varying float vB;
      void main() {
        float k = phase * 6.2832;
        vec3 wander = 0.05 * vec3(sin(uTime * 0.31 + k), sin(uTime * 0.23 + k * 3.0), cos(uTime * 0.27 + k * 5.0));
        vec3 p = uMin + mod(position - uMin + vec3(0.006, -0.012, 0.004) * uTime + wander, uSize);
        float t = dot(p - uA, uD) / uLen;
        vec3 q = p - uD * dot(p - uA, uN) / dot(uD, uN) - uA;
        vec2 h = mix(uH, uHF, clamp(t, 0.0, 1.0));
        vec2 e = 1.0 - smoothstep(h * 0.7, h, abs(vec2(dot(q, uEx), dot(q, uEy))));
        float inside = e.x * e.y * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.8, 1.0, t));
        vB = inside * (0.55 + 0.45 * sin(uTime * (1.2 + phase * 2.5) + k * 7.0)) * (1.0 - 0.5 * t);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.0 + 2.0 * fract(phase * 13.7)) * uPx;
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vB;
      void main() { float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5)) * vB; gl_FragColor = vec4(uColor * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true,
  }));
  dust.frustumCulled = false;
  scene.add(dust);

  // The three contact objects.
  const picks = Object.fromEntries((Object.keys(PICK_NODE) as Prop[]).map((p) => [p, node(PICK_NODE[p])])) as Record<Prop, T.Object3D>;
  const tower = node("Tower");
  const phone = picks.phone, phoneRest = { p: phone.position.clone(), r: phone.rotation.y };
  const printer = picks.printer, printerRest = printer.position.clone(), monitor = picks.rolodex, monitorRest = monitor.scale.clone();
  const lit = (mesh: T.Mesh, canvas: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; // glTF UVs
    return new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: (mesh.material as T.Material).side });
  };
  const phoneMesh = node("PhoneScreenMesh") as T.Mesh, screenMesh = node("ScreenMesh") as T.Mesh;
  // Dark, they show the bake through UV1 (GLTFLoader sets the channel); lit, the canvas goes on the face's own UV0.
  const phoneDark = phoneMesh.material as T.Material, screenDark = screenMesh.material as T.Material;
  const phoneLit = [lit(phoneMesh, phoneScreen(0)), lit(phoneMesh, phoneScreen(1))], screenLit = lit(screenMesh, browserScreen());

  // The paper: page one, sliding out of the front tray.
  const slot = node("PaperSlot");
  const pageTex = new THREE.CanvasTexture(cvPage()); pageTex.colorSpace = THREE.SRGBColorSpace;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.24), new THREE.MeshBasicMaterial({ map: pageTex, toneMapped: false, color: 0xd9c9c4, side: THREE.DoubleSide })); // tinted to sit in the dusk
  paper.geometry.rotateX(-Math.PI / 2).translate(0, 0, 0.17); // lying flat; the slot sits 15 cm inside the body, so out, over half of it shows
  paper.visible = false;
  slot.add(paper);
  meshes.push(paper); // so the bloom pass blacks it out like the rest

  // Polaroids on the wall over her bed, under the shelves and right of where she sits: two clipped to a twine,
  // the rest washi-taped, loosely overlapping. Unlit like the bake, tinted to sit in the dusk.
  // [shot, x, y, tilt°, held by]: back wall's face at z -1.784, bed top ~0.65, the shelves' underside ~1.2.
  const WALL = -1.784, wall = new THREE.Group(), shade = document.createElement("canvas");
  shade.width = shade.height = 64;
  { const x = shade.getContext("2d")!; x.shadowColor = "rgba(20,10,30,0.9)"; x.shadowBlur = 10; x.shadowOffsetX = 200; x.fillRect(-200 + 12, 12, 40, 40); }
  const shadeMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shade), transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false });
  const flat = (w: number, h: number, mat: T.Material, px: number, py: number, z: number, deg: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(px, py, z); m.rotation.z = THREE.MathUtils.degToRad(deg); wall.add(m); meshes.push(m); return m;
  };
  // Eight prints in two loose, overlapping rows (later ones lie on top); "lunch" is a landscape Instax Wide.
  const hung: [string, number, number, number, "clip" | "tape" | ""][] = [
    ["lanterns", 0.83, 1.06, -4, "clip"], ["cats", 0.95, 1.065, 5, "clip"], ["city", 1.07, 1.04, -3, "tape"], ["rock", 1.185, 1.045, 7, "tape"],
    ["lunch", 0.9, 0.905, 3, "tape"], ["summer", 1.025, 0.88, -6, ""], ["saints", 1.14, 0.9, 4, "tape"],
    ["blep", 1.245, 0.89, -5, ""],
  ];
  const WIDE_K = new Set(["lunch"]);
  const faces = new Map<string, T.MeshBasicMaterial>(), framed: T.Mesh[] = []; // framed: the photos, in hung order (hit-tested)
  hung.forEach(([k, px, py, deg, held], i) => {
    const z = WALL + 0.003 + i * 0.0012;
    const [w, h] = WIDE_K.has(k) ? [0.108, 0.086] : [0.088, 0.107];
    flat(w + 0.005, h + 0.005, shadeMat, px + 0.002, py - 0.004, WALL + 0.0015, deg);
    const tex = new THREE.CanvasTexture(document.createElement("canvas")); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xd8c8c6 }); faces.set(k, mat);
    framed.push(flat(w, h, mat, px, py, z, deg));
    const top = new THREE.Vector3(0, h / 2, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(deg));
    if (held === "tape") flat(0.034, 0.013, new THREE.MeshBasicMaterial({ color: ["#e3a9bd", "#a9d3c4", "#c3b3e6"][i % 3], transparent: true, opacity: 0.72, toneMapped: false }), px + top.x, py + top.y, z + 0.0006, deg + (i % 2 ? 9 : -7));
    if (held === "clip") flat(0.007, 0.02, new THREE.MeshBasicMaterial({ color: "#a87c55", toneMapped: false }), px + top.x, py + top.y + 0.004, z + 0.0008, deg);
  });
  const twine = new THREE.CatmullRomCurve3([new THREE.Vector3(0.73, 1.14, WALL + 0.002), new THREE.Vector3(0.87, 1.122, WALL + 0.004), new THREE.Vector3(1.01, 1.142, WALL + 0.002)]);
  const cord = new THREE.Mesh(new THREE.TubeGeometry(twine, 24, 0.0009, 5), new THREE.MeshBasicMaterial({ color: "#b89878", toneMapped: false }));
  wall.add(cord); meshes.push(cord);
  scene.add(wall);
  void (async () => { // her own shots from public/, the rest drawn; the captions in the site's hand (Caveat)
    const load = (src: string) => new Promise<HTMLImageElement | null>((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
    const fam = getComputedStyle(el).getPropertyValue("--font-hand").trim() || "cursive";
    const [[saints, tabby, birman, ivy, lunch, summer, rock, blep]] = await Promise.all([
      Promise.all(["/media/ruined-saints.jpg", ...[1, 2, 3, 4, 5, 6, 7].map((n) => `/media/wall/photo-${n}.jpg`)].map(load)),
      document.fonts.load(`42px ${fam}`).catch(() => null)]);
    if (!alive()) return;
    const shots: Record<string, [Shot, string]> = {
      saints: [saints ? photo(saints, 0.5) : lanterns, "RS"],
      // her own: the tabby asleep, the Birman, her by the ivy with her camera (the drawn shots stay as fallbacks)
      lanterns: [tabby ? photo(tabby, 0.15) : lanterns, tabby ? "sleepy" : "ramen in the dark"], cats: [birman ? photo(birman, 0.35) : cats, "the girls"],
      city: [ivy ? photo(ivy, 0.3) : dusk, ivy ? "golden hour" : ""],
      lunch: [lunch ? photo(lunch, 0.45) : dusk, "sunday lunch"], summer: [summer ? photo(summer, 0.55) : dusk, "summer"],
      rock: [rock ? photo(rock, 0.6, 0.45) : dusk, "out of office"], blep: [blep ? photo(blep, 0.55) : cats, "blep"],
    };
    for (const [k, mat] of faces) { // 2x: crisp when the camera flies in. A fresh texture: a size change can't reuse the old one's storage
      const tex = new THREE.CanvasTexture(polaroid(shots[k][0], shots[k][1], fam, 2, WIDE_K.has(k))); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      mat.map!.dispose(); mat.map = tex; mat.needsUpdate = true;
    }
    if (reduce) window.setTimeout(() => draw()); // no loop: show them once they're painted
  })();
  let lifted = -1, photoOn = -1; // photoOn: the polaroid the camera has flown to
  const liftPhoto = (i: number) => { // the one under the pointer comes off the wall a touch
    if (photoOn >= 0) i = -1; // up close, they stay flat on the wall
    if (i === lifted) return;
    framed.forEach((m, j) => m.scale.setScalar(j === i ? 1.07 : 1)); lifted = i;
    if (reduce) draw();
  };


  // Her computer wakes when pointed at: Win95 powers on from a bright CRT line, the tower's LED lights; it sleeps
  // 1.5 s after the pointer leaves. The LinkedIn button's card wins over it while that button is hovered.
  const desktop = win95Screen(), crt = document.createElement("canvas"), crtX = crt.getContext("2d")!;
  crt.width = desktop.width; crt.height = desktop.height;
  const winLit = lit(screenMesh, crt);
  const ledMesh = node("TowerLEDMesh") as T.Mesh, ledDark = ledMesh.material as T.Material, ledLit = new THREE.MeshBasicMaterial({ color: "#5dff8a", toneMapped: false });
  let pcHover = false, pcOffAt = 0, pcSince = -1, crtP = -1, herAtPc = false; // herAtPc: she's seated at it, so it's on
  const boot = (p: number) => { // p: 0 a bright line across the middle, 1 the whole desktop
    const w = crt.width, h = crt.height, band = Math.max(2, h * (1 - (1 - p) ** 3)), y = (h - band) / 2;
    crtX.fillStyle = "#000"; crtX.fillRect(0, 0, w, h);
    crtX.drawImage(desktop, 0, y, w, band, 0, y, w, band);
    crtX.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - p)})`; crtX.fillRect(0, y, w, band);
    (winLit.map as T.Texture).needsUpdate = true;
  };
  // Hotspots: a cream dot in a breathing pink ring on everything clickable. They're real buttons (focusable; Enter
  // and Space act), they show after the demo, and once two different things have been clicked they settle to 40%.
  const spots = Object.fromEntries([...el.querySelectorAll<HTMLButtonElement>("[data-spot]")].map((b) => [b.dataset.spot, b])) as Record<Spot, HTMLButtonElement>;
  const spotAt: Partial<Record<Spot, T.Object3D>> = { pc: node("Screen"), phone: node("PhoneScreen"), printer: node("PrinterBodyMesh"), photos: framed[1] }; // her, the cats and the Strat join below
  const used = new Set<Spot>(), sv = new THREE.Vector3();
  // Each marker sits just above its object, never on it: the anchor plus a lift to the object's top (metres), then
  // a few px more on screen, so even the 44 px touch target clears it. Her above her cap, the cats above their ears
  // and back, the monitor's top corner, the Strat's headstock, above the phone and the printer.
  const LIFT = Object.fromEntries(Object.entries({ her: [0, 0.36, 0], Siamese: [0, 0.1, 0], Burmese: [0, 0.12, 0], pc: [0.1, 0.19, 0], strat: [0, 0.07, 0], phone: [0, 0.01, 0], printer: [0, 0.13, 0], photos: [0, 0.07, 0] })
    .map(([k, v]) => [k, new THREE.Vector3(...(v as [number, number, number]))])) as Record<Spot, T.Vector3>;
  let wallCut = (_p: T.Vector3) => false; // set by the orbit: on a wall the camera has turned behind
  const placeSpots = () => {
    const up = touch ? 26 : 20;
    for (const [k] of SPOTS) {
      const o = spotAt[k], w = o && o.getWorldPosition(sv).add(LIFT[k]), gone = !!w && wallCut(w), v = w && w.project(camera), off = !v || gone || Math.abs(v.x) > 0.97 || Math.abs(v.y) > 0.9;
      spots[k].toggleAttribute("data-off", off);
      const side = k === "phone" ? up + 4 : 0; // the phone sits in front of the printer: beside it, not above
      if (v && !off) spots[k].style.transform = `translate(${((v.x + 1) / 2) * el.clientWidth - side}px, ${((1 - v.y) / 2) * el.clientHeight - (side ? 0 : up)}px)`;
    }
  };

  // The demo, once a visit: about 1.2 s after the room is live, a ghost cursor glides in from the edge to her and
  // clicks (she reacts for real), glides on to the computer (it wakes), and goes; ~4 s. Any input in the room ends it.
  const ghost = el.querySelector<HTMLElement>("[data-ghost]")!, caption = el.querySelector<HTMLElement>("[data-caption]")!;
  const ripple = el.querySelector<HTMLElement>("[data-ripple]")!, cursors = [...el.querySelectorAll<SVGElement>("[data-ghost] svg")];
  const SAY = touch ? "tap anything in my room" : "click anything in my room";
  el.toggleAttribute("data-touch", touch);
  let demo: "wait" | "run" | "done" = (() => { try { return sessionStorage.getItem("room-demo") === "1" ? "done" : "wait"; } catch { return "wait"; } })();
  let demoT = 0, liveAt = -1, typed = -1, herStill = () => false, herChest: T.Object3D | null = null; // the cursor clicks her chest
  const gp = new THREE.Vector2(), ga = new THREE.Vector2(), gb = new THREE.Vector2(), g0 = new THREE.Vector2();
  const finishDemo = () => {
    if (demo === "run") { ghost.removeAttribute("data-on"); pointPc(false); }
    demo = "done";
    el.toggleAttribute("data-spots", true);
    try { sessionStorage.setItem("room-demo", "1"); } catch {}
  };
  if (demo === "done") el.toggleAttribute("data-spots", true);
  const screenOf = (o: T.Object3D, out: T.Vector2) => { const v = o.getWorldPosition(sv).project(camera); return out.set(((v.x + 1) / 2) * el.clientWidth, ((1 - v.y) / 2) * el.clientHeight); };
  const tap = () => { // the cursor presses and a ring ripples off its tip
    for (const c of cursors) c.animate([{ scale: 1 }, { scale: 0.85 }, { scale: 1 }], { duration: 260, easing: "ease-out" });
    ripple.animate([{ transform: "translate(-50%, -50%) scale(0.2)", opacity: 0.9 }, { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 }], { duration: 700, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" });
  };
  const glide = (from: T.Vector2, to: T.Vector2, u: number) => { // eased, along a bow that lifts toward the middle
    const e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2, cx = (from.x + to.x) / 2, cy = Math.min(from.y, to.y) - 0.12 * el.clientHeight;
    gp.set((1 - e) ** 2 * from.x + 2 * (1 - e) * e * cx + e * e * to.x, (1 - e) ** 2 * from.y + 2 * (1 - e) * e * cy + e * e * to.y);
  };
  const runDemo = (t: number, dt: number) => {
    if (demo === "done" || !herChest) return;
    if (demo === "wait") {
      if (liveAt < 0) { if ("live" in el.dataset) liveAt = t; return; }
      if (t - liveAt < 1.2 || !herStill()) return;
      demo = "run"; demoT = 0; caption.textContent = ""; typed = -1; ghost.setAttribute("data-on", "");
    }
    const prev = demoT; demoT += dt;
    const her = screenOf(herChest, ga), pc = screenOf(spotAt.pc!, gb);
    if (demoT < 0.9) glide(g0.set(el.clientWidth * (her.x > el.clientWidth / 2 ? 0.12 : 0.88), el.clientHeight * 0.9), her, demoT / 0.9); // in from the room's far edge
    else if (demoT < 2.4) gp.copy(her);
    else if (demoT < 3.2) glide(her, pc, (demoT - 2.4) / 0.8);
    else gp.copy(pc);
    if (prev < 0.9 && demoT >= 0.9) { tap(); poke(); }
    if (prev < 3.2 && demoT >= 3.2) pointPc(true);
    if (prev < 3.4 && demoT >= 3.4) ghost.setAttribute("data-out", "");
    if (demoT >= 4) { ghost.removeAttribute("data-out"); finishDemo(); return; }
    const n = Math.min(SAY.length, Math.floor(Math.max(0, demoT - 0.15) * 34)); // the caption types in
    if (n !== typed) { typed = n; caption.textContent = SAY.slice(0, n); }
    ghost.style.transform = `translate(${gp.x.toFixed(1)}px, ${gp.y.toFixed(1)}px)`;
    ghost.toggleAttribute("data-left", gp.x > 0.55 * el.clientWidth); // the caption reads on the side with room
  };
  const stillDemo = () => { // reduced motion: the cursor sits by her with the caption for 3 s, then fades
    if (demo !== "wait" || !herChest) return;
    demo = "run"; caption.textContent = SAY;
    const p = screenOf(herChest, gp);
    ghost.style.transform = `translate(${p.x + 24}px, ${p.y + 10}px)`; ghost.setAttribute("data-on", "");
    ghost.toggleAttribute("data-left", p.x > 0.55 * el.clientWidth);
    window.setTimeout(() => { if (demo === "run") finishDemo(); }, 3000);
  };
  const cancelDemo = () => { if (demo !== "done") finishDemo(); }; // any input in the room: it never plays, or stops at once

  let hoverHer = (_h: unknown) => {}; // her and the cats brighten under the pointer, once they're in
  let spin: T.Object3D | null = null; // the record on her turntable, once it's in
  const pointPc = (on: boolean) => { if (pcHover && !on) pcOffAt = performance.now() / 1000 + 1.5; pcHover = on; };

  const heat: Record<Prop, number> = { phone: 0, printer: 0, rolodex: 0 }, PROPS = Object.keys(heat) as Prop[];
  let pointer: Prop | null = null, since = 0, wasHot: Prop | null = null;

  // Which object is under the pointer.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  type Who = "her" | "Siamese" | "Burmese";
  let who = (_r: T.Raycaster): Who | null => null, poke = () => {}, tickHer: ((dt: number) => void) | null = null, dropHer = () => {}; // filled in once she loads
  let photoAt = 0; // which polaroid hit() last found
  const hit = (e: PointerEvent): Prop | "tower" | "strat" | "photo" | Who | null => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const w = who(ray); if (w) return w; // she's in front of the desk: she wins over the objects behind her
    const ph = ray.intersectObjects(framed)[0]; // nearest first: the one on top where they overlap
    if (ph && !wallCut(ph.point)) { photoAt = framed.indexOf(ph.object as T.Mesh); return "photo"; }
    if (ray.intersectObject(strat).length) return "strat";
    for (const p of Object.keys(picks) as Prop[]) if (ray.intersectObject(picks[p], true).length) return p;
    return ray.intersectObject(tower, true).length ? "tower" : null;
  };
  const spotOf = (h: ReturnType<typeof hit>): Spot | null => (h === "rolodex" || h === "tower" ? "pc" : h === "photo" ? "photos" : h);
  let spotHover: Spot | null = null;
  const hoverSpot = (k: Spot | null) => { // pointing at an object lights its hotspot (bigger ring, its word)
    if (k === spotHover) return;
    if (spotHover) spots[spotHover].removeAttribute("data-hover");
    if (k) spots[k].setAttribute("data-hover", "");
    spotHover = k;
  };
  const touched = (k: Spot | null) => { if (!k) return; used.add(k); if (used.size >= 2) el.toggleAttribute("data-quiet", true); };
  const act = (k: Spot) => { // what each hotspot does: the same as clicking its object
    sfx.wake(); // first, inside the click, so the browser lets every sound play
    if (k === "her") poke();
    else if (k === "strat") riff();
    else if (k === "Siamese" || k === "Burmese") pet([k]);
    else if (k === "pc") live.current.onScreen?.();
    else if (k === "photos") focusPhoto(1);
    else live.current.onPick(k);
    cancelDemo(); touched(k);
  };
  const onSpot = (e: Event) => act((e.currentTarget as HTMLElement).dataset.spot as Spot);
  for (const b of Object.values(spots)) b.addEventListener("click", onSpot);
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && !onButton(e)) cancelDemo();
    if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) { // pinch: zoom by the spread, about the midpoint
      e.stopPropagation(); // the first finger already started the pane's drag; this cuts it off (pointerup still bubbles, so it snaps back)
      const [[ax, ay], [bx, by]] = [...touches.values()], d = Math.hypot(ax - bx, ay - by);
      if (pinch) zoomAt(want.z * (d / pinch), (ax + bx) / 2, (ay + by) / 2);
      pinch = d; return;
    }
    if (drag && want.z > 1.01) { panBy(e.clientX - drag[0], e.clientY - drag[1]); drag = [e.clientX, e.clientY]; }
    if (orbitDrag && down) {
      if (!orbiting && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { orbiting = true; el.setPointerCapture(e.pointerId); hint.removeAttribute("data-on"); }
      if (orbiting) { // ~220° across the room's width; on touch only sideways (up and down scrolls the page)
        e.stopPropagation();
        const k = (Math.PI * 1.2) / Math.max(el.clientWidth, 1), dth = -(e.clientX - orbitDrag.x) * k, dph = e.pointerType === "touch" ? 0 : -(e.clientY - orbitDrag.y) * k;
        const dt = Math.max((e.timeStamp - orbitDrag.t) / 1000, 1 / 240);
        orbit.th += dth; orbit.ph += dph; placeCam();
        const cap = (v: number) => THREE.MathUtils.clamp(v, -3, 3); // a flick coasts at most ~35°
        orbitVel.th = cap(orbitVel.th * 0.6 + (dth / dt) * 0.4); orbitVel.ph = cap(orbitVel.ph * 0.6 + (dph / dt) * 0.4);
        orbitDrag = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      }
    }
    const h = orbiting ? null : spotHit(e.target) ?? hit(e); // over a hotspot it's its object, so the object lights with it
    aim(h);
    el.style.cursor = h ? "pointer" : (drag || orbiting) ? "grabbing" : "grab";
  };
  // A hotspot stands for its object: pointing at (or focusing) either lights both, the same way.
  const spotHit = (t: EventTarget | null): ReturnType<typeof hit> => {
    const k = (t as Element).closest?.<HTMLElement>("[data-spot]")?.dataset.spot as Spot | undefined;
    return k === "pc" ? "tower" : k === "photos" ? "photo" : k ?? null;
  };
  const aim = (h: ReturnType<typeof hit>) => {
    const p = h === "phone" || h === "printer" ? h : null; // pointing at the computer lights nothing: it's Win95
    pointPc(h === "rolodex" || h === "tower");
    hoverHer(h); hoverSpot(spotOf(h)); liftPhoto(h === "photo" ? photoAt : -1);
    if (p !== pointer) { pointer = p; live.current.onHot(p); }
    if (reduce) placeNotes(live.current.hot ?? pointer); // no loop: the notes follow the pointer here
  };
  const onLeave = () => aim(null);
  const onFocus = (e: FocusEvent) => aim(spotHit(e.target)), onBlur = () => aim(null);
  for (const b of Object.values(spots)) { b.addEventListener("focus", onFocus); b.addEventListener("blur", onBlur); }
  // Her computer, monitor or tower, always boots Win95; LinkedIn opens only from its own button.
  // A click is a left press and release on the same object without dragging: right-clicks and drags do nothing.
  let down: { h: ReturnType<typeof hit>; x: number; y: number } | null = null;
  const onButton = (e: Event) => !!(e.target as Element).closest?.("[data-reset], [data-spot]"); // the zoom-out button and the hotspots are their own
  const onDown = (e: PointerEvent) => {
    cancelDemo();
    if (onButton(e)) return;
    if (e.pointerType === "touch") touches.set(e.pointerId, [e.clientX, e.clientY]);
    e.stopPropagation(); // a drag, pinch or pan on the room is the room's, not a swipe to the next page
    if (touches.size > 1) { down = drag = null; orbitDrag = null; orbiting = false; pinch = 0; return; } // a pinch is never a click
    down = e.button === 0 ? { h: hit(e), x: e.clientX, y: e.clientY } : null;
    if (down && want.z > 1.01) { drag = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId); }
    else if (down) { orbitDrag = { x: e.clientX, y: e.clientY, t: e.timeStamp }; oGlide = null; orbitVel.th = orbitVel.ph = 0; }
  };
  const onCancel = (e: PointerEvent) => {
    touches.delete(e.pointerId); pinch = 0; drag = down = null;
    if (orbitDrag && (reduce || e.timeStamp - orbitDrag.t > 80)) orbitVel.th = orbitVel.ph = 0; // held still before letting go: no coast
    orbitDrag = null; orbiting = false;
  };
  const onUp = (e: PointerEvent) => {
    if (onButton(e)) return;
    const d = down;
    onCancel(e);
    const h = hit(e);
    if (!d || d.h !== h || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return; // a drag or pan never clicks
    if (!h && photoOn >= 0) return unzoom(); // up at a photo, a click off it flies back out
    if (h) sfx.wake(); // first, inside the click, so the browser lets every sound play
    touched(spotOf(h));
    if (e.pointerType !== "mouse" && spotOf(h)) { hoverSpot(spotOf(h)); window.setTimeout(() => hoverSpot(null), 2000); } // no hover on touch: a tap shows its word
    if (h === "her") poke();
    else if (h === "strat") riff();
    else if (h === "Siamese" || h === "Burmese") pet([h]);
    else if (h === "photo") focusPhoto(photoAt);
    else if (h === "tower" || h === "rolodex") live.current.onScreen?.();
    else if (h) live.current.onPick(h as Prop);
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onCancel);

  // The notes: text pinned in open space, a hand-drawn arrow bowing from it onto the object, redrawn every frame.
  // The hot one brightens; the others step back.
  const anchors = Object.fromEntries((Object.keys(TARGET) as Prop[]).map((p) => [p, node(TARGET[p])])) as Record<Prop, T.Object3D>;
  const notes = [...el.querySelectorAll<HTMLElement>("[data-note]")], at = new THREE.Vector3();
  const arrows = Object.fromEntries([...el.querySelectorAll<SVGPathElement>("[data-arrow]")].map((a) => [a.dataset.arrow, a])) as Record<Prop, SVGPathElement>;
  // A note's text at (lx, ly), its arrow bowing onto (tx, ty).
  const pin = (nd: HTMLElement, arrow: SVGPathElement, lx: number, ly: number, tx: number, ty: number) => {
    nd.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -50%)`;
    const dx = tx - lx, dy = ty - ly, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const sx = lx + ux * Math.min(56, d / 3), sy = ly + uy * 18, ex = tx - ux * 5, ey = ty - uy * 5; // leave the text, stop short of the tip
    const cx = (sx + ex) / 2 - uy * d * 0.18, cy = (sy + ey) / 2 + ux * d * 0.18; // a hand-drawn bow
    const ax = ex - cx, ay = ey - cy, al = Math.hypot(ax, ay) || 1, hx = (ax / al) * 10, hy = (ay / al) * 10; // the head follows the curve's end
    const head = (a: number) => `${ex - hx * Math.cos(a) + hy * Math.sin(a)} ${ey - hy * Math.cos(a) - hx * Math.sin(a)}`;
    arrow.setAttribute("d", `M${sx} ${sy}Q${cx} ${cy} ${ex} ${ey}M${head(0.5)}L${ex} ${ey}L${head(-0.5)}`);
  };
  const placeNotes = (hot: Prop | null = null) => {
    const W = el.clientWidth, H = el.clientHeight;
    el.toggleAttribute("data-any", !!hot);
    for (const nd of notes) {
      const p = nd.dataset.note as Prop, v = anchors[p].getWorldPosition(at).project(camera);
      const tx = ((v.x + 1) / 2) * W, ty = ((1 - v.y) / 2) * H, seen = Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
      // its contact button hovered, or the object itself while its hotspot isn't up to name it (one word, not two)
      const named = p === pointer && "spots" in el.dataset && !spots[p === "rolodex" ? "pc" : p].hasAttribute("data-off");
      const show = seen && p === hot && !named;
      nd.toggleAttribute("data-show", show); arrows[p].toggleAttribute("data-show", show);
      pin(nd, arrows[p], LABEL[p][0] * W, LABEL[p][1] * H, tx, ty);
      nd.toggleAttribute("data-hot", p === hot); arrows[p].toggleAttribute("data-hot", p === hot);
    }
    placeSpots();
  };

  const pose = (t: number, hot: Prop | null) => {
    // Phone: buzzes in bursts, 0.4 s on, 0.3 s off, with the message coming up after the first burst. Big enough to
    // read from across the room (a few px): it skitters on the desk, twists and hops, like a Nokia on vibrate.
    const buzz = reduce ? 0 : heat.phone * ((t - since) % 0.7 < 0.4 ? 1 : 0);
    phone.position.set(phoneRest.p.x + Math.sin(t * 95) * 0.007 * buzz, phoneRest.p.y + Math.abs(Math.sin(t * 61)) * 0.003 * buzz, phoneRest.p.z + Math.cos(t * 83) * 0.007 * buzz);
    phone.rotation.y = phoneRest.r + Math.sin(t * 70) * 0.14 * buzz;
    phoneMesh.material = hot === "phone" ? phoneLit[reduce || t - since > 0.9 ? 1 : 0] : phoneDark;
    const pc = pcHover || herAtPc || (!reduce && t < pcOffAt);
    if (!pc) pcSince = crtP = -1;
    else {
      if (pcSince < 0) pcSince = t;
      const p = reduce ? 1 : Math.min(1, (t - pcSince) / 0.25); // ~250 ms power-on
      if (p !== crtP) { boot(p); crtP = p; }
    }
    screenMesh.material = hot === "rolodex" ? screenLit : pc ? winLit : screenDark;
    monitor.scale.copy(monitorRest).multiplyScalar(1 + (crtP >= 0 && crtP < 1 ? Math.sin(crtP * Math.PI) * 0.025 : 0)); // the CRT thunks on: a tiny swell
    ledMesh.material = pc ? ledLit : ledDark;
    // Printer: page one slides out of the front tray, the body shuddering line by line while it feeds.
    const feed = reduce ? 0 : heat.printer > 0.02 && heat.printer < 0.97 ? 1 : 0, line = Math.floor(t * 14) % 2;
    printer.position.set(printerRest.x + (line - 0.5) * 0.005 * feed, printerRest.y + Math.abs(Math.sin(t * 47)) * 0.003 * feed, printerRest.z);
    paper.visible = heat.printer > 0.02;
    paper.position.z = (heat.printer - 1) * 0.3; // from inside the body out over the tray
  };

  // Selective bloom: the glowing meshes alone, everything else black so it still hides what's behind it, blurred
  // at half size (quarter on phones) and added over the normal frame. Alpha stays premultiplied.
  const glowRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.5, 0);
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const add = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tBloom: { value: bloom.renderTargetsHorizontal[0].texture } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D tBloom; varying vec2 vUv; void main() { vec3 c = texture2D(tBloom, vUv).rgb; gl_FragColor = vec4(c, max(c.r, max(c.g, c.b))); \n#include <colorspace_fragment>\n }",
    // Only where the room is drawn (dst alpha), and alpha untouched: off the silhouette a halo over the light page reads as a pale box.
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.DstAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  }));
  const keep = new Map<T.Mesh, T.Material | T.Material[]>(), clear = new THREE.Color(), screens = [...phoneLit, screenLit, winLit];
  const smear = new THREE.Group(); // her wave's afterimages (filled in once she loads): never in the bloom pass
  scene.add(smear);
  const draw = () => {
    for (const m of meshes) {
      const glows = m.layers.isEnabled(BLOOM) || (m === screenMesh && m.material !== screenDark) || (m === phoneMesh && m.material !== phoneDark) || (m === ledMesh && m.material === ledLit);
      if (!glows) { keep.set(m, m.material); m.material = black; }
    }
    shaft.visible = dust.visible = smear.visible = false;
    for (const m of screens) m.color.setScalar(0.1); // a lit screen only haloes; full strength it bleaches to white
    renderer.getClearColor(clear); const alpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.needsUpdate = true; // once a frame, not once per pass
    renderer.setRenderTarget(glowRT); renderer.clear(); renderer.render(scene, camera);
    bloom.render(renderer, null as unknown as T.WebGLRenderTarget, glowRT, 0, false);
    renderer.setRenderTarget(null); renderer.setClearColor(clear, alpha);
    for (const [m, mt] of keep) m.material = mt;
    keep.clear();
    shaft.visible = dust.visible = smear.visible = true;
    for (const m of screens) m.color.setScalar(1);
    renderer.render(scene, camera);
    renderer.autoClear = false; add.render(renderer); renderer.autoClear = true;
  };

  // Petting a cat: a purr, the achievement (it unlocks once), and a few hearts floating up off it.
  let catAt = (_k: "Siamese" | "Burmese"): T.Object3D | null => null;
  const pet = (cats: ("Siamese" | "Burmese")[]) => {
    const found = cats.map(catAt).filter((c) => c) as T.Object3D[];
    if (!found.length) return;
    sfx.purr(); unlock("cat");
    for (const c of found) float(c, "♥♥♥♥", "#EE6E9F");
  };
  // A few small glyphs floating up off a thing in the room (hearts off a cat, notes off the guitar), ~1.2 s; or,
  // as `s.sung`, one slow note drifting up and swaying while she sings, ~2 s, on its own random drift and tilt.
  const float = (o: T.Object3D, glyphs: string, color: string, cls = s.heart) => {
    const v = o.getWorldPosition(at).project(camera);
    [...glyphs].forEach((g, i) => {
      const h = document.createElement("span");
      h.className = cls; h.textContent = g; h.style.color = color; h.setAttribute("aria-hidden", "true");
      if (cls !== s.heart) h.style.cssText += `--dx:${(Math.random() * 2 - 1) * 26}px;--r:${(Math.random() * 2 - 1) * 18}deg;animation-duration:${1.6 + Math.random() * 0.6}s`;
      h.style.left = `${((v.x + 1) / 2) * el.clientWidth + (i - (glyphs.length - 1) / 2) * 12}px`; h.style.top = `${((1 - v.y) / 2) * el.clientHeight}px`;
      h.style.animationDelay = `${i * 0.12}s`;
      h.addEventListener("animationend", () => h.remove());
      el.appendChild(h);
    });
  };
  // Her red Strat by the window is baked into the furniture, so a box stands in for it for clicks: a power-chord
  // riff, and notes float up off it.
  const strat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.0, 0.42), black);
  strat.position.set(-1.46, 0.72, 0.62); strat.rotation.y = 0.35; strat.updateMatrixWorld();
  const stratBody = new THREE.Object3D(), stratHead = new THREE.Object3D(); // where the notes float from; where its marker hangs
  stratBody.position.set(-1.43, 0.55, 0.66); stratBody.updateMatrixWorld(); stratHead.position.set(-1.53, 1.18, 0.49); stratHead.updateMatrixWorld();
  const riff = () => { sfx.riff(); float(stratBody, "♪♫♪", "#ff9ec0"); };
  spotAt.strat = stratHead;
  const onKonami = () => pet(["Siamese", "Burmese"]); // the Konami code calls the cats

  // Zoom, the room's own (the page never zooms): 1x is the framed view, up to 3x toward the pointer, by pinch,
  // ctrl/⌘-wheel or double-click. Zoomed, a drag pans, kept inside the framed view. Done with the lens, so it stays sharp.
  let FH = 1; // the framed view's half-height, in tangents
  const AXES = ["z", "x", "y"] as const;
  const zoom = { z: 1, x: 0, y: 0 }, want = { z: 1, x: 0, y: 0 };
  const lens = () => {
    const a = camera.aspect, h = FH / zoom.z, cx = fitMid.x + zoom.x, cy = fitMid.y + zoom.y, n = camera.near;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h));
    camera.projectionMatrix.makePerspective(n * (cx - h * a), n * (cx + h * a), n * (cy + h), n * (cy - h), n, camera.far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  };
  const frameLens = () => { FH = (Math.max(fitSize.y, fitSize.x / camera.aspect) * (1 + 2 * MARGIN)) / 2; clampPan(want); clampPan(zoom); lens(); };
  const clampPan = (v: typeof zoom) => {
    const r = 1 - 1 / v.z, X = FH * camera.aspect * r, Y = FH * r;
    v.x = THREE.MathUtils.clamp(v.x, -X, X); v.y = THREE.MathUtils.clamp(v.y, -Y, Y);
  };
  const resetBtn = el.querySelector<HTMLButtonElement>("[data-reset]")!;
  const settle = () => {
    clampPan(want);
    const zoomed = want.z > 1.01;
    el.toggleAttribute("data-zoomed", zoomed);
    resetBtn.firstElementChild!.textContent = zoomed ? "zoom out" : "back to the front";
    el.style.touchAction = zoomed ? "none" : ""; // zoomed, one finger pans the room instead of the page
    if (!zoomed && document.activeElement === resetBtn) resetBtn.blur(); // it's about to hide
    if (reduce) { Object.assign(zoom, want); lens(); draw(); placeNotes(live.current.hot ?? pointer); } // no easing: it jumps
  };
  // Orbit: a drag on the bare room turns the camera round it, all the way about the vertical and 10-80° from
  // overhead, at the hero distance, keeping the hero shot's aim relative to the room's centre; it coasts a little
  // after the release and stays where it's left. The cut-away walls are single-sided, so from behind the near ones
  // aren't drawn. Every turn refits the lens on the shell (the room's extent), corrected so the hero angle frames
  // exactly as before. The zoom-out button, Esc or a double-click glide back to the front.
  const pivot = shell.getCenter(new THREE.Vector3()), UP = new THREE.Vector3(0, 1, 0), lookM = new THREE.Matrix4();
  const hero = new THREE.Spherical().setFromVector3(camera.position.clone().sub(pivot));
  const aimOff = new THREE.Quaternion().setFromRotationMatrix(lookM.lookAt(camera.position, pivot, UP)).invert().multiply(camera.quaternion);
  const shellMesh = node("Room_ShellMesh") as T.Mesh, sp = shellMesh.geometry.getAttribute("position");
  const shellPts = new Float32Array(sp.count * 3);
  for (let i = 0; i < sp.count; i++) c.fromBufferAttribute(sp, i).applyMatrix4(shellMesh.matrixWorld).toArray(shellPts, i * 3);
  const shellFit = () => {
    fit.makeEmpty();
    for (let i = 0; i < shellPts.length; i += 3) { c.fromArray(shellPts, i).applyMatrix4(camera.matrixWorldInverse); if (c.z < -1e-3) fit.expandByPoint(tv.set(c.x / -c.z, c.y / -c.z)); }
    fit.getCenter(fitMid); fit.getSize(fitSize);
  };
  const heroMid = fitMid.clone(), heroSize = fitSize.clone();
  shellFit();
  const fixMid = heroMid.clone().sub(fitMid), fixSize = heroSize.clone().divide(fitSize);
  fitMid.copy(heroMid); fitSize.copy(heroSize);
  // From outside a wall its face isn't drawn (single-sided), but what hangs on it would float: posters' tape, the
  // polaroids, the skirting, the window. So a wall the camera is behind also drops everything within 3 cm of its
  // inner face above the floor (30 cm for the shell's own bake: curtains, rod, sill, fairy lights), and anything
  // beyond it (its rim, the floor slab under it). Walls: inner faces at x and z = shell min + 0.25 m.
  const cut = { uCutA: { value: 0 }, uCutB: { value: 0 } }, WALL_X = shell.min.x + 0.25, WALL_Z = shell.min.z + 0.25;
  for (const mt of new Set(meshes.flatMap((m) => [m.material].flat()))) {
    if ((mt as T.ShaderMaterial).isShaderMaterial) continue;
    const band = mt.name === "Baked_Shell" ? 0.3 : 0.03, X = WALL_X.toFixed(3), Z = WALL_Z.toFixed(3), XB = (WALL_X + band).toFixed(3), ZB = (WALL_Z + band).toFixed(3);
    mt.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, cut);
      sh.vertexShader = "varying vec3 vCutW;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\nvCutW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = `uniform float uCutA, uCutB; varying vec3 vCutW;\n` + sh.fragmentShader.replace("void main() {", `void main() {\n  bool up = vCutW.y > 0.03; if ((uCutA > 0.5 && (vCutW.x < ${X} || (up && vCutW.x < ${XB}))) || (uCutB > 0.5 && (vCutW.z < ${Z} || (up && vCutW.z < ${ZB})))) discard;`);
    };
    mt.needsUpdate = true;
  }
  const PH0 = THREE.MathUtils.degToRad(10) - hero.phi, PH1 = THREE.MathUtils.degToRad(80) - hero.phi;
  wallCut = (p) => (cut.uCutA.value > 0 && p.x < WALL_X + 0.15) || (cut.uCutB.value > 0 && p.z < WALL_Z + 0.15);
  const orbit = { th: 0, ph: 0 }, orbitVel = { th: 0, ph: 0 }, osph = new THREE.Spherical();
  let orbitDrag: { x: number; y: number; t: number } | null = null, orbiting = false, turned = false;
  let oGlide: { a: typeof orbit; b: typeof orbit; t0: number; then?: () => void } | null = null;
  const placeCam = () => {
    orbit.ph = THREE.MathUtils.clamp(orbit.ph, PH0, PH1);
    osph.set(hero.radius, hero.phi + orbit.ph, hero.theta + orbit.th);
    camera.position.setFromSpherical(osph).add(pivot);
    camera.quaternion.setFromRotationMatrix(lookM.lookAt(camera.position, pivot, UP)).multiply(aimOff);
    camera.updateMatrixWorld();
    cut.uCutA.value = camera.position.x < WALL_X ? 1 : 0; cut.uCutB.value = camera.position.z < WALL_Z ? 1 : 0;
    shellFit(); fitMid.add(fixMid); fitSize.multiply(fixSize); frameLens();
    turned = Math.abs(Math.atan2(Math.sin(orbit.th), Math.cos(orbit.th))) > 0.01 || Math.abs(orbit.ph) > 0.01;
    el.toggleAttribute("data-turned", turned);
    resetBtn.firstElementChild!.textContent = want.z > 1.01 ? "zoom out" : "back to the front";
    if (reduce) { draw(); placeNotes(live.current.hot ?? pointer); }
  };
  const orbitTo = (b: typeof orbit, then?: () => void) => { // a glide, ~0.6 s ease-in-out; reduced motion jumps
    orbit.th = Math.atan2(Math.sin(orbit.th), Math.cos(orbit.th)); // the short way round
    orbitVel.th = orbitVel.ph = 0;
    if (reduce) { Object.assign(orbit, b); placeCam(); then?.(); return; }
    oGlide = { a: { ...orbit }, b, t0: performance.now() / 1000, then };
  };
  const orbitHome = (then?: () => void) => { if (turned || oGlide) orbitTo({ th: 0, ph: 0 }, then); else then?.(); };
  const orbitStep = (t: number, dt: number) => { // in the loop: a glide, or coasting after a release
    if (oGlide) {
      const g = oGlide, u = Math.min(1, (t - g.t0) / 0.6), e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
      orbit.th = g.a.th + (g.b.th - g.a.th) * e; orbit.ph = g.a.ph + (g.b.ph - g.a.ph) * e;
      if (u >= 1) { oGlide = null; placeCam(); g.then?.(); return; }
    } else if (!orbitDrag && (orbitVel.th || orbitVel.ph)) {
      orbit.th += orbitVel.th * dt; orbit.ph += orbitVel.ph * dt;
      const k = 0.92 ** (dt * 60); orbitVel.th *= k; orbitVel.ph *= k;
      if (Math.hypot(orbitVel.th, orbitVel.ph) < 0.02) orbitVel.th = orbitVel.ph = 0;
    } else return;
    placeCam();
  };
  const zoomAt = (z: number, cx: number, cy: number) => { // keeps the point under (cx, cy) where it is
    const r = el.getBoundingClientRect(), nx = ((cx - r.left) / r.width) * 2 - 1, ny = 1 - ((cy - r.top) / r.height) * 2, a = camera.aspect;
    const h = FH / zoom.z, px = zoom.x + nx * h * a, py = zoom.y + ny * h;
    flight = null; photoOn = -1;
    want.z = THREE.MathUtils.clamp(z, 1, Math.max(3, zoom.z)); // up at a photo, a pinch can't snap back to 3x
    const h2 = FH / want.z;
    want.x = px - nx * h2 * a; want.y = py - ny * h2;
    settle();
  };
  // A flight: the camera glides (ease-in-out, ~0.7 s) instead of the 150 ms snap; the view's centre moves in step
  // with how far it has zoomed, so the target homes in as it grows. Any wheel, pinch or pan takes over at once.
  let flight: { a: typeof zoom; b: typeof zoom; t0: number } | null = null;
  const fly = (to: typeof zoom) => {
    Object.assign(want, to); settle();
    if (!reduce) flight = { a: { ...zoom }, b: { ...want }, t0: performance.now() / 1000 };
  };
  const flown = (t: number) => { // in the loop, while flying
    const f = flight!, u = Math.min(1, (t - f.t0) / 0.7), e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
    zoom.z = f.a.z * (f.b.z / f.a.z) ** e;
    const span = 1 / f.a.z - 1 / f.b.z, k = Math.abs(span) > 1e-6 ? (1 / f.a.z - 1 / zoom.z) / span : e;
    zoom.x = f.a.x + (f.b.x - f.a.x) * k; zoom.y = f.a.y + (f.b.y - f.a.y) * k;
    if (u >= 1) flight = null;
  };
  // A polaroid fills most of the view, centred: up to ~70x, well past the 3x a pinch reaches.
  const pv = new THREE.Vector3();
  const focusPhoto = (i: number): void => {
    if (turned || oGlide) return orbitHome(() => focusPhoto(i)); // up at a photo is from the front: turn back first
    i = (i + framed.length) % framed.length;
    photoOn = i; liftPhoto(-1);
    const v = framed[i].getWorldPosition(pv).applyMatrix4(camera.matrixWorldInverse), d = -v.z, { width: w, height: h } = (framed[i].geometry as T.PlaneGeometry).parameters;
    const fill = hung[i][0] === "blep" ? 0.5 : 0.82; // blep's source is 310 px wide: closer, it goes soft
    fly({ z: Math.min((FH * 2 * fill * d) / h, (FH * 2 * camera.aspect * fill * d) / w), x: v.x / d - fitMid.x, y: v.y / d - fitMid.y });
  };
  const unzoom = () => {
    orbitHome();
    if (photoOn >= 0) { photoOn = -1; fly({ z: 1, x: 0, y: 0 }); return; }
    flight = null; Object.assign(want, { z: 1, x: 0, y: 0 }); settle();
  };
  const panBy = (dx: number, dy: number) => { // client pixels; the drag moves the room with the pointer
    const h = (2 * FH) / zoom.z / el.clientHeight;
    flight = null; zoom.z = want.z;
    want.x -= dx * h; want.y += dy * h; clampPan(want); zoom.x = want.x; zoom.y = want.y; // no ease: it follows the hand
    if (reduce) settle(); else lens();
  };
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // a plain wheel scrolls the page; a trackpad pinch arrives with ctrlKey
    e.preventDefault();
    zoomAt(want.z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
  };
  const onDbl = (e: MouseEvent) => {
    if (onButton(e) || hit(e as PointerEvent)) return; // on an object its click already acted: double-click zooms only on bare room
    if (want.z > 1.01 || turned) unzoom(); else zoomAt(2, e.clientX, e.clientY); // turned: back to the front first
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && (want.z > 1.01 || turned)) unzoom();
    else if (photoOn >= 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); focusPhoto(photoOn + (e.key === "ArrowLeft" ? -1 : 1)); }
    else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && want.z <= 1.01 && el.contains(document.activeElement)) { // a hotspot focused: turn the room
      e.preventDefault(); orbitTo({ th: Math.atan2(Math.sin(orbit.th), Math.cos(orbit.th)) + (e.key === "ArrowLeft" ? 1 : -1) * (Math.PI / 8), ph: orbit.ph });
    }
  };
  const touches = new Map<number, [number, number]>();
  let drag: [number, number] | null = null, pinch = 0;
  const hint = el.querySelector<HTMLElement>("[data-hint]")!;
  let hinted = false, hintT = 0;
  const onEnter = (e: PointerEvent) => { // the first hover only, then it fades
    if (hinted || e.pointerType !== "mouse") return;
    hinted = true; hint.toggleAttribute("data-on", true);
    hintT = window.setTimeout(() => hint.removeAttribute("data-on"), 3000);
  };
  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("dblclick", onDbl);
  window.addEventListener("keydown", onKey);
  el.addEventListener("keydown", cancelDemo);
  window.addEventListener("cv:cat", onKonami);
  resetBtn.addEventListener("click", unzoom);

  const resize = () => {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    frameLens();
    const px = renderer.getDrawingBufferSize(new THREE.Vector2()).multiplyScalar(touch ? 0.5 : 1);
    glowRT.setSize(px.x, px.y); bloom.setSize(px.x, px.y);
    draw(); placeNotes();
  };
  // Warm the GPU before the first frame (shaders in parallel, textures uploaded), so it doesn't stall.
  await renderer.compileAsync(scene, camera).catch(() => {});
  for (const m of meshes) { const map = (m.material as T.MeshBasicMaterial).map; if (map) renderer.initTexture(map); }
  mark("warm");
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();
  // The canvas fades in over the preview once she's in too (the preview has her on the bed), or after 1.2 s
  // without her; then she fades in on her own.
  let herIn = () => {};
  void Promise.race([new Promise<void>((r) => (herIn = r)), new Promise((r) => setTimeout(r, 1200))]).then(() => {
    if (!alive()) return;
    el.dataset.live = "";
    mark("live");
  });

  const ease = (from: number, to: number, dt: number, rate = 7) => from + (to - from) * (1 - Math.exp(-dt * rate));
  // The lamp warming at the guide's end: the bake lifts ~+0.15 toward the lamp's amber (blue barely moves, so it
  // reads warmer, not washed out), her live light and the glows with it. ~1.2s to settle. The sky outside stays.
  let warmth = 0;
  const exposure = renderer.toneMappingExposure, glowK = bloom.strength, bake = [...baked.values()];
  const lampTo = (w: number) => {
    warmth = w;
    for (const m of bake) m.color.setRGB(1 + 0.15 * w, 1 + 0.09 * w, 1 + 0.02 * w);
    renderer.toneMappingExposure = exposure * (1 + 0.15 * w);
    bloom.strength = glowK * (1 + 0.35 * w);
  };
  toy.run((t, dt) => {
    const w = live.current.warm ? 1 : 0;
    if (warmth !== w) lampTo(Math.abs(w - warmth) < 1e-3 ? w : ease(warmth, w, dt, 2.5));
    const hot = live.current.hot ?? pointer;
    if (hot !== wasHot) { since = t; wasHot = hot; }
    for (const p of PROPS) heat[p] = ease(heat[p], p === hot ? 1 : 0, dt, p === "printer" ? 2.5 : 7);
    glow.uTime.value = t;
    pose(t, hot);
    tickHer?.(dt);
    if (spin) spin.rotation.y -= dt * (100 / 3) * (Math.PI / 30); // 33⅓ rpm, clockwise from above
    runDemo(t, dt);
    orbitStep(t, dt);
    if (zoom.z !== want.z || zoom.x !== want.x || zoom.y !== want.y) { // ~150 ms ease
      if (flight) flown(t);
      else for (const k of AXES) zoom[k] = Math.abs(want[k] - zoom[k]) < 1e-4 ? want[k] : ease(zoom[k], want[k], dt, 20);
      lens();
    }
    draw();
    placeNotes(hot);
    return false; // drawn above, with the bloom
  });
  // Reduced motion: no loop. Redraw a still pose whenever the hot object changes; the screens just light up.
  let wasPc = false;
  const still = reduce ? setInterval(() => {
    const hot = live.current.hot ?? pointer;
    if (hot === wasHot && pcHover === wasPc) return;
    wasHot = hot; wasPc = pcHover;
    for (const p of PROPS) heat[p] = p === hot ? 1 : 0;
    pose(0, hot); draw(); placeNotes(hot);
  }, 100) : 0;
  if (reduce) { pose(0, null); draw(); }

  // Her, the guitar, the chair and the cats: not baked, so lit live to sit in the dusk. They arrive after the
  // room has drawn and fade in, so the hero stays fast. Same world space as room.glb.
  const free = (root: T.Object3D) => root.traverse((o) => {
    const m = o as T.SkinnedMesh;
    if (!m.isMesh) return;
    m.geometry.dispose(); m.skeleton?.dispose();
    for (const mt of [m.material].flat()) { for (const v of Object.values(mt)) if ((v as T.Texture)?.isTexture) (v as T.Texture).dispose(); mt.dispose(); }
  });
  const addHer = (c: { scene: T.Group; animations: T.AnimationClip[] }) => {
    const char = c.scene, clip = (n: string) => c.animations.find((a) => a.name === n)!;
    for (const top of char.children) { const o = room.getObjectByName(top.name); if (o) o.visible = false; } // room.glb's own chair, etc.

    // Dusk light for her alone (the room is baked and unlit): a cool fill, the window's warm key casting the
    // only shadows, and the desk lamp's warm spill.
    const hemi = scene.children.find((o) => (o as T.HemisphereLight).isHemisphereLight) as T.HemisphereLight;
    const key = scene.children.find((o) => (o as T.DirectionalLight).isDirectionalLight) as T.DirectionalLight;
    hemi.color.set("#9a8ee0"); hemi.groundColor.set("#5a3a40"); hemi.intensity = 0.8;
    scene.environmentIntensity = 0.25;
    key.color.set("#FFB25E"); key.intensity = 3.2;
    const [win, floor] = cA.y > cB.y ? [cA, cB] : [cB, cA]; // down the beam, from the window
    key.position.copy(win).addScaledVector(win.clone().sub(floor).normalize(), 2); key.target.position.copy(floor); scene.add(key.target);
    key.castShadow = true;
    const sc = key.shadow.camera; sc.left = sc.bottom = -2.5; sc.right = sc.top = 2.5; sc.near = 0.1; sc.far = 8; sc.updateProjectionMatrix();
    key.shadow.mapSize.setScalar(touch ? 512 : 1024); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
    const lamp = new THREE.PointLight("#FFC07A", 1.6, 3.5);
    node("Glow_Lamp").getWorldPosition(lamp.position);
    scene.add(lamp);
    // Her camera and her Cowon iAudio U3 with its earbuds on wing B's free right end, and her record player on the
    // floor between the Strat's amp cable and the skateboard (Sketchfab, CC BY: art/README.md). Not in the bake, so
    // they're lit like her. [file, sized by this node, to this many metres, at, yaw, standing on (y)]
    const PROPS: [string, string, number, [number, number], number, number][] = [
      ["camera", "Camera_01_Camera_01_body_0", 0.13, [-0.72, -1.62], 0.55, 0.75],     // lens toward the room
      ["mp3", "Korpus_low_Material_0", 0.076, [-0.9, -1.4], -Math.PI / 4, 0.75],     // screen toward the room
      ["turntable", "Object_4", 0.42, [-1.55, 1.1], -1.92, 0],                        // front toward the room, back to the wall
    ];
    for (const [file, ref, size, [x, z], ry, top] of PROPS) void grab(`/models/${file}.glb`).then(parse).then((p) => {
      if (!p || !alive()) return;
      const o = p.scene;
      o.getObjectByName("Plane")?.removeFromParent(); // the U3's product-shot floor
      const s = new THREE.Box3().setFromObject(o.getObjectByName(ref)!).getSize(new THREE.Vector3());
      o.scale.setScalar(size / Math.max(s.x, s.y, s.z)); o.rotation.y = ry;
      o.position.set(x, 0, z); o.updateMatrixWorld(true);
      o.position.y = top - new THREE.Box3().setFromObject(o).min.y; // standing on the desk or the floor
      const disc = o.getObjectByName("Object_18"); // the record ("Until I Found You") turns at 33⅓ rpm
      if (disc) { const c = new THREE.Box3().setFromObject(disc).getCenter(new THREE.Vector3()); spin = new THREE.Group(); spin.position.copy(o.worldToLocal(c)); o.add(spin); spin.attach(disc); }
      o.traverse((m) => { if ((m as T.Mesh).isMesh) { m.castShadow = true; meshes.push(m as T.Mesh); } }); // the bloom pass blacks them out too
      scene.add(o);
      if (reduce) draw();
    });
    // Her records, spread on the floor in front of the player as if she'd been flipping through them, short of the rug
    // and her way to the desk. [sheet tile (sleeve 0-6, disc 7-8), x, z, yaw, the disc slid half out of it (tile)]
    const sheetCanvas = records(), sheet = new THREE.CanvasTexture(sheetCanvas); sheet.colorSpace = THREE.SRGBColorSpace; sheet.anisotropy = 4;
    const covers = new Image(); covers.decoding = "async";
    covers.onload = () => { sheetCanvas.getContext("2d")!.setTransform(1, 0, 0, 1, 0, 0); sheetCanvas.getContext("2d")!.drawImage(covers, 0, 0, 1536, 1024, 0, 0, 1536, 1024); sheetCanvas.getContext("2d")!.drawImage(covers, 0, 1024, 512, 512, 0, 1024, 512, 512); sheet.needsUpdate = true; if (reduce) draw(); };
    covers.src = "/media/records/sleeves.jpg"; // the seven sleeves: Led Zeppelin IV, Korn, Slipknot, Blizzard of Ozz, Dark Side, Ecliptica, Unplugged
    const sleeveMat = new THREE.MeshStandardMaterial({ map: sheet, roughness: 0.75 }), discMat = new THREE.MeshStandardMaterial({ map: sheet, roughness: 0.3 });
    const tile = (g: T.BufferGeometry, i: number) => { const uv = g.getAttribute("uv"); for (let k = 0; k < uv.count; k++) uv.setXY(k, ((i % 3) + uv.getX(k)) / 3, 1 - (Math.floor(i / 3) + 1 - uv.getY(k)) / 3); return g; };
    const RECORDS: [number, number, number, number, number?][] = [
      [0, -1.2, 0.98, 0.3], [4, -1.04, 1.16, -0.25], [8, -0.93, 0.95, 0], [5, -1.24, 1.38, 0.9],
      [2, -0.9, 1.33, -0.6, 7], [3, -1.08, 1.45, 0.15], [6, -0.86, 1.1, 0.5],
    ];
    const piled: [number, number, number][] = []; // x, z, top of each record down so far
    for (const [t, x, z, ry, out] of RECORDS) {
      const thick = t > 6 ? 0.002 : 0.003, rec = new THREE.Group();
      rec.add(new THREE.Mesh(t > 6 ? tile(new THREE.CylinderGeometry(0.15, 0.15, thick, 48), t) : tile(new THREE.BoxGeometry(0.314, thick, 0.314), t), t > 6 ? discMat : sleeveMat));
      if (out !== undefined) { const d = new THREE.Mesh(tile(new THREE.CylinderGeometry(0.15, 0.15, 0.002, 48), out), discMat); d.position.x = 0.14; rec.add(d); } // slid half out
      const under = Math.max(0.0035, ...piled.filter(([px, pz]) => Math.hypot(px - x, pz - z) < 0.3).map(([, , top]) => top)); // above the floor, or on the ones under it
      rec.position.set(x, under + thick / 2 + 0.0012, z); rec.rotation.set(under > 0.004 ? 0.006 : 0, ry, under > 0.004 ? -0.005 : 0); // resting on another: a hair of tilt
      piled.push([x, z, under + thick + 0.0012]);
      rec.traverse((m) => { if ((m as T.Mesh).isMesh) { m.receiveShadow = true; meshes.push(m as T.Mesh); } });
      scene.add(rec);
    }
    renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false;
    const catchers = ["ShadowFloorMesh", "ShadowBedMesh"].map((n) => room.getObjectByName(n) as T.Mesh);
    for (const m of catchers) { (m.material as T.Material).dispose(); m.material = new THREE.ShadowMaterial({ color: "#1d1433", opacity: 0, depthWrite: false }); m.receiveShadow = m.visible = true; }

    const mats = new Map<T.Material, [boolean, number]>(); // each one's own transparency and opacity, for the fade
    for (const top of char.children) top.traverse((o) => {
      const m = o as T.Mesh;
      if (!m.isMesh) return;
      m.castShadow = !/^(Siamese|Burmese)/.test(top.name);
      m.frustumCulled = false; // skinned bounds are her bind pose; she walks out of them
      meshes.push(m); // the bloom pass blacks her out like the room
      for (const mt of [m.material].flat()) {
        // The export lost the denim (its texture), leaving bare white jeans. Patch only that case: a fixed export skips this.
        const sm = mt as T.MeshStandardMaterial;
        if (/^jeans/.test(mt.name) && !sm.map && sm.color.getHex() === 0xffffff) sm.color.set("#2f4f8f");
        if (!mats.has(mt)) mats.set(mt, [mt.transparent, mt.opacity]);
      }
    });
    let fade = 0;
    const setFade = (f: number) => { for (const [mt, [, op]] of mats) mt.opacity = op * f; for (const m of catchers) (m.material as T.ShadowMaterial).opacity = 0.4 * f; };
    // Warm the opaque shaders first, so ending the fade doesn't hitch; the faded ones compile while she's invisible.
    void renderer.compileAsync(char, camera, scene).catch(() => {}).then(() => {
      if (!alive()) { free(char); key.shadow.dispose(); lamp.dispose(); return; }
      fade = reduce || !("live" in el.dataset) ? 1 : 0; // not live yet: the canvas's own fade-in brings her in
      if (fade < 1) for (const mt of mats.keys()) { mt.transparent = true; mt.needsUpdate = true; }
      setFade(fade);
      scene.add(char);
      if (fade === 1) draw(); // into the canvas before it shows
      mark("her-in"); herIn(); report();

      // The day: three strums on the bed, up to the desk and back (ToDesk), round again. Clicks wave.
      const herMix = new THREE.AnimationMixer(char), F = 1 / 24;
      const once = (n: string) => { const a = herMix.clipAction(clip(n)); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; return a; }; // clamped on its last frame, which the next clip starts on
      const strum = herMix.clipAction(clip("Strum")), day = herMix.clipAction(clip("ToDesk")), bed = once("ReactBed"), desk = once("ReactDesk");
      const td = clip("ToDesk"); // ReactDesk leaves the guitar alone: hold it where ToDesk has it at the desk
      const hold = herMix.clipAction(new THREE.AnimationClip("GuitarHold", td.duration, td.tracks.filter((k) => k.name.startsWith("Guitar."))));
      const cats = ["Siamese", "Burmese"].map((cat) => {
        const m = new THREE.AnimationMixer(char);
        for (const a of c.animations) if (a.name.startsWith(cat + "_") && a.name !== "Burmese_Stretch") m.clipAction(a).play();
        return m;
      });
      // Now and then the Burmese stretches out, paws forward and chin up, then curls back to sleep: every 25-45 s,
      // her sleep loops crossfade out for the ~4.3 s stretch and back in after; no Zzz while she's up.
      const bm = cats[1], stretch = bm.clipAction(clip("Burmese_Stretch")), zzz = char.getObjectByName("Burmese_Z");
      const sleeps = [bm.clipAction(clip("Burmese_Loop"))];
      stretch.setLoop(THREE.LoopOnce, 1);
      let stretchIn = 25 + Math.random() * 20, back = false;
      const tickStretch = (dt: number) => {
        if (stretch.isRunning()) {
          if (!back && stretch.time > stretch.getClip().duration - 0.5) { back = true; for (const a of sleeps) { a.reset().play(); a.crossFadeFrom(stretch, 0.5, false); } }
          return;
        }
        if (zzz) zzz.visible = true;
        if ((stretchIn -= dt) > 0) return;
        stretchIn = 25 + Math.random() * 20;
        back = false; stretch.reset().play(); for (const a of sleeps) stretch.crossFadeFrom(a, 0.35, false);
        if (zzz) zzz.visible = false;
      };
      let state: "strum" | "day" | "bed" | "desk" = "strum", now: T.AnimationAction = strum, inState = 0, queued = false, resume = 0;
      const go = (next: typeof state, to: T.AnimationAction, fadeS: number, at = 0) => {
        to.reset().play(); to.time = at; to.crossFadeFrom(now, fadeS, false);
        state = next; now = to; inState = 0;
      };
      strum.play();
      let sing = 1; // seconds to the next sung note
      // The wave runs longer than it was baked: her arm holds up while one baked cycle replays EXTRA more times
      // (the swing itself is drawn on top, in cartoon()). [cycle start, cycle end], frames of ReactBed / ReactDesk.
      const WAVE = { bed: [33, 43], desk: [41, 49] }, EXTRA = 3;
      let encore = 0;
      const pep = () => {
        if (state !== "bed" && state !== "desk") return;
        const a = state === "bed" ? bed : desk, [c0, c1] = WAVE[state];
        if (encore > 0 && a.time / F >= c1) { a.time -= (c1 - c0) * F; encore--; }
      };

      const bone = (n: string) => char.getObjectByName(n)!;
      const hips = bone("DEF-spineseg0"), head = bone("DEF-spine006"), feet = [bone("DEF-footL"), bone("DEF-footR")];
      const strumHand = bone("DEF-handR"), guitar = bone("Guitar"); // where her sung notes come from
      const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3();
      const near = (r: T.Ray, a: T.Object3D, b: T.Object3D, rad: number, reach = 0) => {
        a.getWorldPosition(pa); b.getWorldPosition(pb);
        if (reach) pb.add(pc.subVectors(pb, pa).setLength(reach)); // the head bone starts at the neck
        return r.distanceSqToSegment(pa, pb) < rad * rad;
      };
      // Skinned meshes don't raycast reliably: a capsule from hips to head, and one down each leg. The cats are rigid.
      const catRoots = { Siamese: bone("Siamese"), Burmese: bone("Burmese") };
      who = (rc) => {
        if (fade < 0.5) return null;
        if (near(rc.ray, hips, head, 0.2, 0.2) || feet.some((f) => near(rc.ray, hips, f, 0.13))) return "her";
        for (const k of ["Siamese", "Burmese"] as const) if (rc.intersectObject(catRoots[k], true).length) return k;
        return null;
      };
      catAt = (k) => catRoots[k];
      Object.assign(spotAt, { her: bone("DEF-spine006"), Siamese: bone("Siamese_Head"), Burmese: bone("Burmese_Body") });
      herChest = bone("DEF-spine003seg0");

      // Under the pointer, her or a cat warms a touch, so it reads as clickable.
      const glowOf = (root: T.Object3D) => { const out = new Set<T.MeshStandardMaterial>(); root.traverse((o) => { const m = o as T.Mesh; if (m.isMesh) for (const mt of [m.material].flat()) out.add(mt as T.MeshStandardMaterial); }); return [...out].map((mt) => [mt, mt.emissive.clone(), mt.emissiveIntensity] as const); };
      const glows = { her: glowOf(bone("Her")), Siamese: glowOf(catRoots.Siamese), Burmese: glowOf(catRoots.Burmese) };
      let warmOn: keyof typeof glows | null = null;
      const warm = new THREE.Color("#ffb25e");
      hoverHer = (h) => {
        const next = h === "her" || h === "Siamese" || h === "Burmese" ? h : null;
        if (next === warmOn) return;
        if (warmOn) for (const [mt, e, i] of glows[warmOn]) { mt.emissive.copy(e); mt.emissiveIntensity = i; }
        if (next) for (const [mt] of glows[next]) { mt.emissive.copy(warm); mt.emissiveIntensity = 0.07; }
        warmOn = next;
        if (reduce) draw();
      };

      herStill = () => { const t = day.time; return state === "strum" || (state === "day" && (t < 47 * F || t > 600 * F || (t >= 232 * F && t <= 506 * F))); };

      if (reduce) { // a still: her first strum, the cats at rest; a click shows the wave for 2 s
        herMix.update(0); for (const m of cats) m.update(0); draw(); placeNotes(); stillDemo();
        let wave = 0;
        poke = () => {
          if (wave) return;
          sfx.hello(); strum.stop(); bed.reset().play(); bed.time = 1.25; herMix.update(0); draw();
          wave = window.setTimeout(() => { wave = 0; bed.stop(); strum.play(); herMix.update(0); draw(); }, 2000);
        };
        dropHer = () => { clearTimeout(wave); herMix.stopAllAction(); herMix.uncacheRoot(char); for (const m of cats) { m.stopAllAction(); m.uncacheRoot(char); } };
      } else {
        poke = () => { if (state !== "bed" && state !== "desk") queued = true; };

        // The wave, cartoon: while her hand is up, a fast continuous swing replaces the baked one (a sine, so the hand
        // passes through every point of the arc each frame, never jumping end to end), the wrist trailing it, the
        // hand stretching on the fast pass, her head tilting into it. Her DEF bones are flat under Her, so it's all done in Her's space:
        // the forearm and hand turn rigidly about the elbow (75%) and the whole arm about the shoulder (25%).
        const arm = [bone("DEF-upper_armRseg0"), bone("DEF-upper_armRseg1"), bone("DEF-upper_armRseg2"), bone("DEF-upper_armR001seg0"), bone("DEF-upper_armR001seg1"), bone("DEF-upper_armR001seg2")];
        const fore = ["", "001"].flatMap((h) => [0, 1, 2].map((i) => bone(`DEF-forearmR${h}seg${i}`))), hand = bone("DEF-handR");
        fore.push(hand); arm.push(...fore); // the fingers ride on the hand
        const shL = bone("DEF-upper_armLseg0"), shR = arm[0], elbow = fore[0];
        const up = new THREE.Vector3(), right = new THREE.Vector3(), fwd = new THREE.Vector3(), fa = new THREE.Vector3(), pv = new THREE.Vector3(), rq = new THREE.Quaternion();
        let env = 0, mid = 0, ang = 0, vel = 0, phase = 0, bent = false;
        const HZ = 2.6, ARC = 0.72; // full swings a second, radians a side (~41°)
        // The mixer only writes a bone when its keyed value changes, so each edit is undone before the next update.
        const touched = [...arm, head], rest = touched.map((b) => [b.position.clone(), b.quaternion.clone(), b.scale.clone()] as const);
        const unbend = () => { if (bent) touched.forEach((b, i) => { b.position.copy(rest[i][0]); b.quaternion.copy(rest[i][1]); b.scale.copy(rest[i][2]); }); bent = false; };
        const turn = (bones: T.Object3D[], about: T.Vector3, axis: T.Vector3, a: number) => {
          rq.setFromAxisAngle(axis, a); pv.copy(about);
          for (const b of bones) { b.position.sub(pv).applyQuaternion(rq).add(pv); b.quaternion.premultiply(rq); }
        };
        const cartoon = (dt: number) => {
          up.subVectors(head.position, hips.position).normalize();
          right.subVectors(shR.position, shL.position); right.addScaledVector(up, -right.dot(up)).normalize();
          fwd.crossVectors(up, right); // +angle about fwd swings the arm toward her right
          fa.subVectors(hand.position, elbow.position).normalize();
          const baked = Math.atan2(fa.dot(right), fa.dot(up)), raised = state === "bed" || state === "desk" ? THREE.MathUtils.smoothstep(fa.dot(up), 0.15, 0.45) : 0; // hand above the elbow
          if (env < 0.01 && raised > 0) { mid = baked; ang = baked; vel = 0; phase = 0; } // a fresh wave starts from her pose
          env += (raised - env) * Math.min(1, dt * 12);
          if (env < 0.01) { for (const gh of ghost) for (const g of gh.ms) g.visible = false; return; }
          touched.forEach((b, i) => { rest[i][0].copy(b.position); rest[i][1].copy(b.quaternion); rest[i][2].copy(b.scale); }); bent = true;
          mid += (baked - mid) * Math.min(1, dt * 0.8); // the middle of her swing, wherever she holds the arm
          phase += Math.min(dt, 0.05) * Math.PI * 2 * HZ;
          const s = Math.sin(phase), swing = mid + ARC * s;
          const want = baked + raised * (swing - baked), was = ang; // as her arm comes down, back to the baked one
          ang = want; vel = dt > 0 ? (ang - was) / dt : 0;
          const extra = env * THREE.MathUtils.clamp(ang - baked, -1, 1);
          turn(fore, elbow.position, fwd, extra * 0.75);
          turn(arm, shR.position, fwd, extra * 0.25);
          turn([hand], hand.position, fwd, env * THREE.MathUtils.clamp(-vel * 0.03, -0.35, 0.35)); // the wrist trails the swing
          const k = 1 + env * Math.min(0.18, Math.abs(vel) * 0.012); // and the hand stretches on the fast pass
          hand.scale.y *= k; hand.scale.x /= Math.sqrt(k); hand.scale.z /= Math.sqrt(k);
          turn([head], head.position, fwd, env * (0.14 + 0.07 * s)); // her head tilts into it
          turn([head], head.position, right, -env * 0.09 * s * s); // and bobs at each end
          ghosts(dt);
        };

        // Smear frames: the last few poses of the waving forearm and hand, pale lavender, fading in ~0.13 s. Each
        // one shows only as far as the hand has since moved, so they bloom on the fast swings and vanish at the holds.
        const isArm = (n: string) => n.startsWith("DEF-forearmR") || n === "DEF-handR" || /^DEF-(f_|thumb|palm).*R$/.test(n);
        const parts: { m: T.SkinnedMesh; geo: T.BufferGeometry }[] = [];
        bone("Her").traverse((o) => {
          const m = o as T.SkinnedMesh;
          if (!m.isSkinnedMesh) return;
          const g = m.geometry, si = g.getAttribute("skinIndex"), sw = g.getAttribute("skinWeight"), on = m.skeleton.bones.map((b) => isArm(b.name));
          const army = (v: number) => { let w = 0; for (let c = 0; c < 4; c++) if (on[si.getComponent(v, c)]) w += sw.getComponent(v, c); return w >= 0.5; };
          const idx: number[] = [], n = g.index ? g.index.count : g.getAttribute("position").count;
          for (let i = 0; i < n; i += 3) {
            const t = [0, 1, 2].map((j) => (g.index ? g.index.getX(i + j) : i + j));
            if (t.every(army)) idx.push(...t);
          }
          if (!idx.length) return;
          const geo = new THREE.BufferGeometry(); // her own buffers, fewer triangles
          for (const a of ["position", "normal", "skinIndex", "skinWeight"]) if (g.getAttribute(a)) geo.setAttribute(a, g.getAttribute(a));
          geo.setIndex(idx); parts.push({ m, geo });
        });
        const GHOSTS = 5, LIFE = 0.09, ghost = Array.from({ length: GHOSTS }, () => {
          const mat = new THREE.MeshBasicMaterial({ color: "#b39dff", transparent: true, opacity: 0, depthWrite: false });
          const ms = parts.map(({ m, geo }) => {
            const sk = new THREE.Skeleton(m.skeleton.bones, m.skeleton.boneInverses);
            sk.update = () => {}; // frozen: it holds the pose it was given
            const g = new THREE.SkinnedMesh(geo, mat); g.bind(sk, m.bindMatrix); g.frustumCulled = false; g.visible = false; g.raycast = () => {};
            smear.add(g); return g;
          });
          return { mat, ms, at: -1, hand: new THREE.Vector3() };
        });
        let clock = 0, lastShot = 0, next = 0;
        const ghosts = (dt: number) => {
          clock += dt;
          if (clock - lastShot >= 1 / 90) { // a fresh afterimage every rendered frame, into the oldest slot
            lastShot = clock; bone("Her").updateMatrixWorld(true);
            const gh = ghost[next]; next = (next + 1) % GHOSTS;
            for (const g of gh.ms) THREE.Skeleton.prototype.update.call(g.skeleton);
            gh.at = clock; gh.hand.copy(hand.position);
          }
          for (const gh of ghost) {
            const age = clock - gh.at, o = env * 0.16 * Math.max(0, 1 - age / LIFE) ** 2 * THREE.MathUtils.smoothstep(gh.hand.distanceTo(hand.position), 0.015, 0.06);
            gh.mat.opacity = o; for (const g of gh.ms) g.visible = o > 0.004;
          }
        };
        const unGhost = () => { for (const gh of ghost) { gh.mat.dispose(); for (const g of gh.ms) { g.skeleton.dispose(); smear.remove(g); } } for (const p of parts) p.geo.dispose(); };

        tickHer = (dt) => {
          if (fade < 1) {
            setFade(fade = Math.min(1, fade + dt / 0.4));
            if (fade === 1) for (const [mt, [tr]] of mats) { mt.transparent = tr; mt.needsUpdate = true; }
          }
          const prev = day.time;
          unbend(); pep(); herMix.update(dt); tickStretch(dt); for (const m of cats) m.update(dt);
          cartoon(dt);
          inState += dt;
          const t = day.time;
          herAtPc = state === "desk" || (state === "day" && t >= 232 * F && t <= 506 * F); // on while she works, off as she gets up
          // While she sings on the bed, a note drifts up every 0.5-0.9 s, off her strumming hand or the guitar's body.
          if (state === "strum" && fade === 1 && (sing -= dt) < 0) {
            sing = 0.5 + Math.random() * 0.4;
            float(Math.random() < 0.5 ? strumHand : guitar, "♪♫♬♪♥"[Math.floor(Math.random() * 5)], Math.random() < 0.6 ? "#fff4e6" : "#ff9ec0", s.sung);
          }
          if (state === "strum" && inState >= 3 * strum.getClip().duration) go("day", day, 0.25);
          else if (state === "day" && t < prev) go("strum", strum, 0.25); // ToDesk wrapped: she's back on the bed
          else if (state === "bed" && bed.paused) go("strum", strum, 0.25);
          else if (state === "desk" && desk.paused) { go("day", day, 0.25, resume); hold.fadeOut(0.25); } // back where she left off
          if (!queued) return;
          // A click waits for the next place she can react: on the bed, or seated at the desk (232-506, but not mid-sip), at once.
          // ReactDesk is keyed on ToDesk 330; from any other seated moment the crossfade carries her into it and back.
          if (state === "strum" || (state === "day" && (t < 47 * F || t > 600 * F))) { queued = false; sfx.hello(); encore = EXTRA; go("bed", bed, 0.15); }
          else if (state === "day" && t >= 232 * F && t <= 506 * F && (t < 396 * F || t > 460 * F)) { // not mid-sip (398-458): the mug's in her hand
            queued = false; sfx.hello(); resume = t; encore = EXTRA; go("desk", desk, 0.25);
            hold.reset().play(); hold.time = t; hold.paused = true; hold.fadeIn(0.25);
          }
        };
        dropHer = () => { tickHer = null; unGhost(); herMix.stopAllAction(); herMix.uncacheRoot(char); for (const m of cats) { m.stopAllAction(); m.uncacheRoot(char); } };
      }
      const drop = dropHer;
      dropHer = () => { drop(); scene.remove(char); free(char); key.shadow.dispose(); lamp.dispose(); };
    });
  };
  void herP.then((c) => {
    if (!c) { finishDemo(); return herIn(); } // the room stands on its own without her: no demo, just the hotspots
    mark("her-parsed");
    if (!alive()) return free(c.scene); // unmounted while she loaded
    addHer(c);
  });

  return () => {
    clearInterval(still);
    dropHer();
    ro.disconnect();
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onCancel);
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("dblclick", onDbl);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("cv:cat", onKonami);
    resetBtn.removeEventListener("click", unzoom);
    for (const b of Object.values(spots)) { b.removeEventListener("click", onSpot); b.removeEventListener("focus", onFocus); b.removeEventListener("blur", onBlur); }
    strat.geometry.dispose();
    el.removeEventListener("keydown", cancelDemo);
    clearTimeout(hintT);
    phoneMesh.material = phoneDark; screenMesh.material = screenDark; ledMesh.material = ledDark; // so the stage's dispose finds the baked ones
    for (const m of [...phoneLit, screenLit, winLit, ledLit, black]) { m.map?.dispose(); m.dispose(); }
    (dust.material as T.Material).dispose(); dustGeo.dispose();
    glowRT.dispose(); bloom.dispose(); add.material.dispose(); add.dispose();
    toy.dispose();
  };
}
