"use client";
import { useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";
import { motion, useSpring, useTransform, type MotionValue } from "motion/react";
import DecryptedText from "./DecryptedText";
import { profile } from "@/content/cv";
import { sfx } from "@/lib/sfx";
import { afterHero } from "@/lib/stagger";
import s from "./Window.module.css";

// The end of the page, from her eyes: sitting at her window on the parter, hot chocolate in both hands, a pigeon on
// the tin sill outside. Baked in Blender (art/scripts/window/), the street live on top: Bucharest's real time of day
// and weather (hers, not the visitor's), the pigeon's routine, steam, a sip, lamp cones at night, a passing Dacia.
// ?hour=21.5 and ?weather=drizzle|rain|storm|snow|fog|clear force a sky, for testing.

export const BASE = "/models/window/";
const LAT = 44.43, LON = 26.1;

// ---------- her clock and her sun ----------
const TZ = "Europe/Bucharest";
const fmt = typeof Intl !== "undefined" ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", minute: "numeric", hourCycle: "h23" }) : null;
const offsetFmt = typeof Intl !== "undefined" ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, timeZoneName: "shortOffset" }) : null;
export function herClock(d = new Date()) {
  const [h, m] = fmt!.formatToParts(d).filter((x) => x.type === "hour" || x.type === "minute").map((x) => +x.value);
  const here = d.getHours() * 60 + d.getMinutes();
  const ahead = Math.round((((h * 60 + m - here + 720 + 1440) % 1440) - 720) / 30) / 2; // hours she's ahead of the visitor
  const forced = typeof location !== "undefined" ? new URLSearchParams(location.search).get("hour") : null;
  return { h, m, hf: forced ? +forced : h + m / 60, ahead };
}
// Sunrise and sunset in Bucharest's clock for today: declination and hour angle, longitude off the zone meridian.
function sunTimes(d = new Date()) {
  const day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
  const decl = (23.44 * Math.PI / 180) * Math.sin((2 * Math.PI * (284 + day)) / 365);
  const lat = (LAT * Math.PI) / 180;
  const H = (Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat) * Math.tan(decl)))) * 180) / Math.PI / 15;
  const off = +(offsetFmt?.formatToParts(d).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || 2); // 2 or 3 (summer)
  const noon = 12 + (off * 15 - LON) / 15;
  return { rise: noon - H, set: noon + H, decl, noon };
}
const mixHex = (a: string, b: string, t: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");
// The sky by how high the sun is (e: −1 deep night … 0 horizon … 1 noon): [e, top, horizon]
// Dreamy, like the sky in her room's window: indigo overhead, pink and peach at the horizon, a lavender haze by day.
const SKY: [number, string, string][] = [
  [-1, "#1b1c48", "#2d2c5a"], [-0.35, "#23255a", "#4b4580"], [-0.12, "#2c2e65", "#c680aa"], [0.02, "#4b4580", "#f7b39a"],
  [0.14, "#7b7fd0", "#ffc9a8"], [0.35, "#7ea6ea", "#f2d6e6"], [1, "#6f9ce8", "#e6e3f6"],
];
export function skyAt(hf: number) {
  const { rise, set, decl } = sunTimes();
  const day = hf > rise && hf < set;
  // −1..1: up to 1 at noon, down to −1 three hours past the horizon
  const e = day ? Math.sin((Math.PI * (hf - rise)) / (set - rise)) : -Math.min(1, Math.min(Math.abs(hf - set), Math.abs(hf + 24 - set), Math.abs(rise - hf), Math.abs(rise + 24 - hf)) / 3);
  const i = Math.max(1, SKY.findIndex(([at]) => at >= e)), [e0, t0, b0] = SKY[i - 1], [e1, t1, b1] = SKY[i];
  const k = Math.min(1, Math.max(0, (e - e0) / (e1 - e0)));
  // the sun crosses her view left (east) to right (west); she looks roughly south
  const t = day ? (hf - rise) / (set - rise) : 0.5;
  const az = (t - 0.5) * Math.PI * 0.95, el = Math.max(0.02, Math.sin(Math.PI * t) * (Math.PI / 2 - (LAT * Math.PI) / 180 + decl));
  const night = 1 - Math.min(1, Math.max(0, (e + 0.12) / 0.2)); // 0 by day, 1 once it's dark
  const golden = day ? Math.max(0, 1 - e / 0.3) : Math.max(0, 1 + e / 0.15);
  return { e, night, golden, top: mixHex(t0, t1, k), bottom: mixHex(b0, b1, k), sun: [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)] as const, day };
}
const partOfDay = (h: number) => (h < 5 ? "Night" : h < 9 ? "Morning" : h < 12 ? "Late morning" : h < 17 ? "Afternoon" : h < 21 ? "Evening" : "Night");

// ---------- her weather ----------
type Kind = "clear" | "clouds" | "fog" | "drizzle" | "rain" | "snow" | "storm";
type Wx = { kind: Kind; cloud: number; wind: number; temp: number | null; words: string };
const WORDS: Record<Kind, string> = { clear: "clear skies", clouds: "cloudy", fog: "foggy", drizzle: "drizzling", rain: "raining", snow: "snowing", storm: "a storm" };
const kindOf = (c: number): Kind => (c >= 95 ? "storm" : c >= 85 || (c >= 71 && c <= 77) ? "snow" : (c >= 61 && c <= 67) || (c >= 80 && c <= 82) ? "rain" : c >= 51 ? "drizzle" : c >= 45 ? "fog" : c >= 2 ? "clouds" : "clear");
async function weather(): Promise<Wx> {
  const forced = new URLSearchParams(location.search).get("weather") as Kind | null;
  if (forced && forced in WORDS) return { kind: forced, cloud: forced === "clear" ? 0.1 : 0.85, wind: 14, temp: 12, words: WORDS[forced] };
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=weather_code,cloud_cover,wind_speed_10m,temperature_2m`);
    const c = (await r.json()).current;
    const kind = kindOf(c.weather_code);
    return { kind, cloud: c.cloud_cover / 100, wind: c.wind_speed_10m, temp: Math.round(c.temperature_2m), words: kind === "clouds" && c.cloud_cover < 50 ? "a few clouds" : WORDS[kind] };
  } catch {
    return { kind: "clear", cloud: 0.2, wind: 8, temp: null, words: "" };
  }
}

export type Hot = "pigeon" | "mug" | null;
export type Live = { wx: Wx | null; onHot: (h: Hot, x: number, y: number) => void; onNote: (q: number[][]) => void; noteAspect: () => number };

// The CSS matrix3d that lays a w×h element onto four screen points (top left, top right, bottom right, bottom left):
// the square-to-quad projective map (Heckbert), scaled to the element.
function quadMatrix(w: number, h: number, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: number[][]) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1].join(",")})`;
}

// ---------- her desk clock: a little LCD clock on the window frame ----------
// Seven-segment digits, 9 x 13 like RamenAmp's (and Winamp's), the unlit segments ghosting through.
const SEG: [string, number, number, number, number][] = [["a", 2, 0, 5, 2], ["b", 7, 1, 2, 5], ["c", 7, 7, 2, 5], ["d", 2, 11, 5, 2], ["e", 0, 7, 2, 5], ["f", 0, 1, 2, 5], ["g", 2, 6, 5, 1]];
const DIGITS = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];
const segsOf = (ch: string) => (ch === "-" ? "g" : DIGITS[+ch] ?? "");
const Seg = ({ on, ghost = true }: { on: string; ghost?: boolean }) => (
  <svg viewBox="0 0 9 13" shapeRendering="crispEdges" aria-hidden="true">
    {SEG.map(([k, x, y, w, h]) => (on.includes(k) ? <rect key={k} x={x} y={y} width={w} height={h} className={s.lit} /> : ghost && <rect key={k} x={x} y={y} width={w} height={h} />))}
  </svg>
);
// The digits still roll like the Counter did (same spring, same shortest way round), over a fixed ghost 8.
function RollNum({ mv, n }: { mv: MotionValue<number>; n: number }) {
  const y = useTransform(mv, (v) => { const o = (10 + n - (v % 10)) % 10; return `${(o > 5 ? o - 10 : o) * 100}%`; });
  return <motion.span className={s.roll} style={{ y }}><Seg on={DIGITS[n]} ghost={false} /></motion.span>;
}
function Roll({ v }: { v: number }) {
  const mv = useSpring(v);
  useEffect(() => { mv.set(v); }, [mv, v]);
  return <span className={s.digit}><Seg on="" />{DIGITS.map((_, n) => <RollNum key={n} mv={mv} n={n} />)}</span>;
}
// Pixel weather, 9 x 9, the way a cheap weather clock draws it.
const CLOUD = ["...###...", "..#####..", ".########", "#########", ".#######."];
const PIX: Record<Kind | "night", string[]> = {
  clear: ["....#....", ".#.....#.", "...###...", "..#####..", "#.#####.#", "..#####..", "...###...", ".#.....#.", "....#...."],
  night: ["..###....", ".###...#.", "###......", "###......", "###...#..", "###......", ".###.....", "..####...", "...##...."],
  clouds: [".........", ".........", ...CLOUD, ".........", "........."],
  fog: [".........", "#######..", ".........", "..#######", ".........", "#######..", ".........", "..#######", "........."],
  drizzle: [...CLOUD, ".........", "..#...#..", ".........", "#...#...#"],
  rain: [...CLOUD, ".#..#..#.", "#..#..#..", ".........", ".#..#..#."],
  snow: [...CLOUD, ".........", "#.#...#.#", ".#.....#.", "#.#...#.#"],
  storm: [...CLOUD, "....##...", "...##....", "....##...", "...#....."],
};
const Pix = ({ rows }: { rows: string[] }) => (
  <svg viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true" className={s.pix}>
    <path className={s.lit} d={rows.flatMap((r, y) => [...r].map((c, x) => (c === "#" ? `M${x} ${y}h1v1h-1z` : ""))).join("")} />
  </svg>
);

export default function Window() {
  preconnect("https://api.open-meteo.com", { crossOrigin: "anonymous" }); // the weather fetch on mount: the connection is open by then
  const host = useRef<HTMLDivElement>(null), note = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<ReturnType<typeof herClock> | null>(null);
  const [wx, setWx] = useState<Wx | null>(null);
  const [ready, setReady] = useState(false), [copied, setCopied] = useState(false);
  const [hot, setHot] = useState<{ h: Hot; x: number; y: number }>({ h: null, x: 0, y: 0 });
  const live = useRef<Live>({ wx: null, onHot: () => {}, onNote: () => {}, noteAspect: () => 1 });
  live.current.wx = wx;
  live.current.onHot = (h, x, y) => setHot((o) => (o.h === h && Math.abs(o.x - x) < 1 && Math.abs(o.y - y) < 1 ? o : { h, x, y }));
  live.current.onNote = (q) => {
    const n = note.current, box = host.current; if (!n || !box) return;
    // on a phone the frame post is a sliver at the edge and the glued note too small to read: it sits flat on the
    // glass under her clock instead (CSS)
    if (box.clientWidth <= 700) { if (n.dataset.glued !== undefined) { n.style.transform = ""; delete n.dataset.glued; } return; }
    // the whole note stays in view: where the frame post nears an edge (a wide lens, her head turned) it slides in
    const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]), m = 14;
    const dx = Math.max(0, m - Math.min(...xs)) - Math.max(0, Math.max(...xs) - box.clientWidth + m);
    const dy = Math.max(0, m - Math.min(...ys)) - Math.max(0, Math.max(...ys) - box.clientHeight + m);
    n.style.transform = quadMatrix(n.offsetWidth, n.offsetHeight, q.map(([x, y]) => [x + dx, y + dy])); n.dataset.glued = "";
  };
  live.current.noteAspect = () => (note.current ? note.current.offsetHeight / Math.max(1, note.current.offsetWidth) : 1);

  useEffect(() => {
    const tick = () => setNow(herClock());
    tick(); const id = window.setInterval(tick, 5000);
    void weather().then(setWx);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = host.current!;
    let cleanup = () => {}, dead = false, began = false, cancel = () => {}, mo: MutationObserver | undefined;
    const start = () => {
      if (began) return; began = true; io.disconnect(); mo?.disconnect(); cancel();
      void import("./WindowScene").then((m) => m.mount(el, live, () => !dead, () => setReady(true))).then((c) => { if (dead) c(); else cleanup = c; }, (e) => { if (e !== GONE) throw e; });
    };
    const whenIdle = (f: () => void, wait: number) => {
      const id = window.setTimeout(() => {
        if (!window.requestIdleCallback) { f(); return; }
        const ric = requestIdleCallback(f, { timeout: 4000 });
        cancel = () => cancelIdleCallback(ric);
      }, wait);
      cancel = () => clearTimeout(id);
    };
    // The scene gets ready in the background, in idle slices under the poster (mount below), long before it's in
    // view: on a computer once the hero room is in (lib/stagger), on a phone (data) once she heads down the page,
    // 1.5 screens out.
    // During the guide the poster stands in (the finale's crane too): it waits for the guide to close, its settle to
    // finish, and the browser to be idle.
    const vp = el.closest<HTMLElement>("[data-era]");
    const go = () => {
      if (began || mo) return;
      if (!vp?.hasAttribute("data-touring")) { start(); return; }
      mo = new MutationObserver(() => { if (!vp.hasAttribute("data-touring")) { mo!.disconnect(); whenIdle(start, 2000); } });
      mo.observe(vp, { attributes: true, attributeFilter: ["data-touring"] });
    };
    let pane = el.parentElement; // the pane scrolls itself, so it is the root the margin is measured in
    while (pane && !/auto|scroll/.test(getComputedStyle(pane).overflowY)) pane = pane.parentElement;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) go(); }, { root: pane, rootMargin: "0px 0px 150% 0px" });
    const unqueue = afterHero(() => (matchMedia("(pointer: coarse)").matches ? io.observe(el) : go()));
    return () => { dead = true; io.disconnect(); mo?.disconnect(); cancel(); unqueue(); cleanup(); };
  }, []);

  const copy = () => { void navigator.clipboard?.writeText(profile.email).then(() => { sfx.tink(); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }); };
  const sky = now ? skyAt(now.hf) : null;
  const gap = !now ? "" : now.ahead === 0 ? "same time as you" : `${Math.abs(now.ahead)}h ${now.ahead > 0 ? "ahead of" : "behind"} you`;
  return (
    <div className={s.window} data-night={sky && sky.night > 0.5 ? "" : undefined}>
      <img className={s.poster} src={`${BASE}${sky && sky.night > 0.5 ? "poster-night" : "poster-day"}.webp`} alt="" aria-hidden="true" data-gone={ready || undefined} />
      <div ref={host} className={s.stage} aria-hidden="true" />
      <span className={s.grain} aria-hidden="true" />
      {/* Her desk clock, leaning on the window frame: a little LCD clock, her time and her weather */}
      <div className={s.clock}>
        <span className={s.status}><i aria-hidden="true" />Online</span>
        <span className={s.lcd}>
          <span className={s.time} role="timer" aria-label={now ? `My time: ${String(now.h).padStart(2, "0")}:${String(now.m).padStart(2, "0")}` : "My time"}>
            <Roll v={Math.floor((now?.h ?? 0) / 10)} /><Roll v={now?.h ?? 0} />
            <svg viewBox="0 0 2 13" shapeRendering="crispEdges" aria-hidden="true" className={s.colon}><rect y="3" width="2" height="2" /><rect y="8" width="2" height="2" /></svg>
            <Roll v={Math.floor((now?.m ?? 0) / 10)} /><Roll v={now?.m ?? 0} />
          </span>
          <span className={s.wx} role="img" aria-label={wx?.words ? `${wx.temp !== null ? `${wx.temp}°, ` : ""}${wx.words}` : "Bucharest weather"}>
            <Pix rows={wx ? PIX[wx.kind === "clear" && sky && sky.night > 0.5 ? "night" : wx.kind] : []} />
            <span className={s.temp}>
              {[...(wx?.temp != null ? String(wx.temp) : "").padStart(2, " ")].map((c, i) => <Seg key={i} on={segsOf(c)} />)}
              <svg viewBox="0 0 3 3" shapeRendering="crispEdges" aria-hidden="true" className={s.deg}><path className={wx?.temp != null ? s.lit : undefined} d="M0 0h3v3h-3zM1 1v1h1v-1z" fillRule="evenodd" /></svg>
            </span>
          </span>
        </span>
        <span className={s.skyNote}>{now ? <><span>{partOfDay(now.h)} in Bucharest</span><b aria-hidden="true"> · </b><span>{gap}</span></> : "Bucharest"}</span>
      </div>
      {/* A Post-it stuck on her window's frame: how to reach her, plain text, readable at a glance */}
      <div ref={note} className={s.note}>
        <strong>Hiring? Two more ways in:</strong>
        <ol>
          <li>
            <span className={s.label}>Email · click to copy</span>
            <button type="button" onClick={copy} aria-label={`Copy my email address, ${profile.email}`} className={copied ? s.copied : undefined}>
              <DecryptedText key={copied ? "y" : "n"} text={copied ? "copied, talk soon ✓" : profile.email} animateOn={copied ? "view" : "hover"} speed={30} maxIterations={8} sequential={copied} />
            </button>
          </li>
          <li>
            <span className={s.label}>30-min call</span>
            <a href={profile.booking} target="_blank" rel="noopener" aria-label="Book a 30-minute call on Calendly (opens in a new tab)">Book on Calendly ↗</a>
          </li>
        </ol>
      </div>
      <span className={s.hint} data-on={hot.h || undefined} style={{ left: `${hot.x}%`, top: `${hot.y}%` }} aria-hidden="true">{hot.h === "pigeon" ? "coo?" : hot.h === "mug" ? "take a sip" : ""}</span>
    </div>
  );
}

export const GONE = new Error("the window scene was unmounted");
