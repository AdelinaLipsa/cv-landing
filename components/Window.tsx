"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "motion/react";
import type * as T from "three";
import DecryptedText from "./DecryptedText";
import { profile } from "@/content/cv";
import { sfx } from "@/lib/sfx";
import { createRain, step, mist, paint, painter, type Rain } from "@/lib/rainGlass";
import s from "./Window.module.css";

// The end of the page, from her eyes: sitting at her window on the parter, hot chocolate in both hands, a pigeon on
// the tin sill outside. Baked in Blender (art/scripts/window/), the street live on top: Bucharest's real time of day
// and weather (hers, not the visitor's), the pigeon's routine, steam, a sip, lamp cones at night, a passing Dacia.
// ?hour=21.5 and ?weather=drizzle|rain|storm|snow|fog|clear force a sky, for testing.

const BASE = "/models/window/";
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

type Hot = "pigeon" | "mug" | null;
type Live = { wx: Wx | null; onHot: (h: Hot, x: number, y: number) => void; onNote: (q: number[][]) => void; noteAspect: () => number };

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
    let cleanup = () => {}, dead = false, cancel = () => {}, mo: MutationObserver | undefined;
    const start = async () => {
      const c = await mount(el, live, () => !dead, () => setReady(true));
      if (dead) c(); else cleanup = c;
    };
    // The scene's first load blocks the main thread for ~0.5s. During the guide the poster stands in (the finale's
    // crane too), so it waits for the guide to close, its settle to finish, and the browser to be idle.
    const vp = el.closest<HTMLElement>("[data-era]");
    const later = () => {
      mo?.disconnect();
      const id = window.setTimeout(() => {
        if (!window.requestIdleCallback) { start(); return; }
        const ric = requestIdleCallback(start, { timeout: 3000 });
        cancel = () => cancelIdleCallback(ric);
      }, 2000);
      cancel = () => clearTimeout(id);
    };
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (!vp?.hasAttribute("data-touring")) { start(); return; }
      mo = new MutationObserver(() => { if (!vp.hasAttribute("data-touring")) later(); });
      mo.observe(vp, { attributes: true, attributeFilter: ["data-touring"] });
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => { dead = true; io.disconnect(); mo?.disconnect(); cancel(); cleanup(); };
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

// ---------- the scene ----------
async function mount(el: HTMLElement, live: React.RefObject<Live>, alive: () => boolean, onReady: () => void) {
  const [THREE, { GLTFLoader }, { MeshoptDecoder }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }] = await Promise.all([
    import("three"), import("three/examples/jsm/loaders/GLTFLoader.js"), import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three/examples/jsm/postprocessing/EffectComposer.js"), import("three/examples/jsm/postprocessing/RenderPass.js"),
    import("three/examples/jsm/postprocessing/UnrealBloomPass.js"), import("three/examples/jsm/postprocessing/ShaderPass.js"), import("three/examples/jsm/postprocessing/OutputPass.js"),
  ]);
  if (!alive()) return () => {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, touch = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !touch, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // the bakes are graded already; the grade pass below does the rest
  const lavender = new THREE.Color("#9a8cd0"); // her room's haze
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const tex = new THREE.TextureLoader();
  const night = (n: string) => tex.loadAsync(`${BASE}${n}-night.webp`).then((t) => { t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; return t; });
  const [view, bird, car, handsG, treeG, ...nights] = await Promise.all([
    loader.loadAsync(BASE + "view.glb"), loader.loadAsync(BASE + "pigeon.glb"), loader.loadAsync(BASE + "dacia.glb").catch(() => null), loader.loadAsync(BASE + "hands.glb").catch(() => null), loader.loadAsync(BASE + "tree.glb").catch(() => null),
    night("near"), night("street"), night("across"),
  ]);
  if (!alive()) { renderer.dispose(); renderer.domElement.remove(); return () => {}; }
  const root = view.scene; scene.add(root); root.updateMatrixWorld(true);
  const node = (n: string) => root.getObjectByName(n)!;
  const at = (n: string) => node(n).getWorldPosition(new THREE.Vector3());

  // Camera: her eyes, as baked
  const baseCam = view.cameras[0] as T.PerspectiveCamera;
  const camera = new THREE.PerspectiveCamera(baseCam.fov, 2, 0.02, 1200);
  baseCam.getWorldPosition(camera.position); const baseQ = baseCam.getWorldQuaternion(new THREE.Quaternion());
  camera.quaternion.copy(baseQ);
  const baseVfov = baseCam.fov;

  // Shared state, recomputed every few seconds from her clock and her weather
  const U = {
    uNight: { value: 0 }, uGrade: { value: new THREE.Color(1, 1, 1) }, uFogColor: { value: new THREE.Color() }, uFog: { value: 0.25 },
    uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 0.3, -1) },
    uTime: { value: 0 }, uCloud: { value: 0.2 }, uWind: { value: 0.3 }, uFlash: { value: 0 }, uWet: { value: 0 },
  };

  // Baked groups: day atlas from the GLB, night atlas beside it, blended by her clock, graded by her sky.
  const NIGHTS: Record<string, T.Texture> = { Near: nights[0], Street: nights[1], Across: nights[2] };
  const bakedMat = (day: T.Texture, nightTex: T.Texture) => new THREE.ShaderMaterial({
    uniforms: { uDay: { value: day }, uNightTex: { value: nightTex }, uNight: U.uNight, uGrade: U.uGrade, uFogColor: U.uFogColor, uFog: U.uFog, uWet: U.uWet },
    vertexShader: "varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: `uniform sampler2D uDay, uNightTex; uniform float uNight, uFog, uWet; uniform vec3 uGrade, uFogColor; varying vec2 vUv; varying vec3 vW;
      void main(){
        vec3 c = mix(texture2D(uDay, vUv).rgb, texture2D(uNightTex, vUv).rgb, uNight) * uGrade;
        float d = length(vW - cameraPosition);
        c *= 1. - uWet * 0.28 * smoothstep(2., 6., d) * step(vW.y, -1.05);             // a wet street is darker
        c = mix(c, uFogColor, uFog * (1. - exp(-max(d - 3., 0.) * 0.03)));
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  for (const g of ["Near", "Street", "Across"]) {
    const m = node(g) as T.Mesh, old = m.material as T.MeshStandardMaterial;
    if (old.map) old.map.colorSpace = THREE.SRGBColorSpace;
    m.material = bakedMat(old.map!, NIGHTS[g]); old.dispose();
  }

  // Sky: a dome round her eyes with her sky's colours, the sun or moon, stars, clouds by real cover, lightning.
  const NOISE = `float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * noise(p); p *= 2.03; a *= .5; } return s; }`;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: U,
    vertexShader: "varying vec3 vD; void main(){ vD = normalize((modelMatrix * vec4(position, 1.)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }",
    fragmentShader: `uniform vec3 uTop, uBottom, uSun; uniform float uNight, uTime, uCloud, uWind, uFlash; varying vec3 vD; ${NOISE}
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        vec3 c = mix(uBottom, uTop, pow(smoothstep(-0.05, 0.55, y), 0.8));
        float sd = max(dot(d, normalize(uSun)), 0.);
        c += vec3(1., .86, .62) * (smoothstep(.9994, .9997, sd) * 1.4 + pow(sd, 24.) * .16) * (1. - uNight);
        vec3 m = normalize(vec3(-uSun.x, max(.25, .55 - uSun.y), uSun.z));
        float md = dot(d, m);
        c += vec3(.92, .93, 1.) * smoothstep(.99955, .9998, md) * uNight + vec3(.55, .6, 1.) * pow(max(md, 0.), 40.) * .12 * uNight;
        vec2 sp = floor(d.xy / (d.z + 1.4) * 260.); float st = hash(sp);
        c += step(.9965, st) * (.55 + .45 * sin(uTime * 1.7 + st * 90.)) * uNight * (1. - uCloud) * smoothstep(.02, .2, y);
        // long thin streaks like her room's sky, and softer puffs when it's cloudy
        vec2 q = vec2(d.x / max(y + .12, .12) * .5 + uTime * .004 * (.4 + uWind), y * 9.);
        float streak = smoothstep(.62, .78, fbm(vec2(q.x * .8, q.y * 2.6))) * smoothstep(.02, .1, y) * smoothstep(.55, .2, y);
        float puff = smoothstep(1.05 - uCloud, 1.4 - uCloud * .6, fbm(d.xz / max(y + .08, .08) * .9 + uTime * .005) + .25) * smoothstep(-.02, .12, y) * uCloud;
        vec3 pink = mix(vec3(.78, .5, .67), vec3(1., .86, .9), 1. - uNight);
        vec3 cc = mix(mix(vec3(1.), uBottom, .45), uBottom * .55 + vec3(.05, .04, .1), uNight);
        c = mix(c, pink * (1.1 - .3 * y), streak * .55 * (1. - uCloud * .5));
        c = mix(c, cc, puff * .85);
        c += vec3(1., .7, .6) * pow(sd, 6.) * .08 * (1. - uNight);                       // a soft halo round the sun
        c += uFlash * vec3(.7, .75, 1.);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -10; sky.position.copy(camera.position); scene.add(sky);

  // The city further off: silhouettes in the haze, a few windows lit at night.
  const far = node("Far") as T.Mesh;
  far.material = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: `uniform vec3 uBottom, uTop; uniform float uNight, uFog; varying vec3 vW; ${NOISE}
      void main(){
        vec3 c = mix(mix(uTop, vec3(.17, .17, .38), .55), uBottom, .3 + uFog * .35);
        vec2 g = floor(vec2(vW.x * .55 + vW.z * .55, vW.y * .4)); float lit = step(.82, hash(g)) * clamp(uNight * 1.4 + .15, 0., 1.) * step(fract(vW.y * .4), .55);
        c += lit * vec3(1., .78, .45) * .5;
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });

  // Windows across the street that people switch on in the evening: each pane its own, by its place in the street.
  const lit = node("LitWindows") as T.Mesh;
  const litMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...U, uLit: { value: 0 } },
    vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: `uniform float uLit, uTime; varying vec3 vW; ${NOISE}
      void main(){
        vec2 id = floor(vec2(vW.x * .62 + vW.z * .31, vW.y * .5));
        float h = hash(id), on = step(1. - uLit, fract(h + floor(uTime / 300. + h * 9.) * .618));
        vec3 warm = mix(vec3(1., .74, .42), vec3(1., .86, .62), hash(id + 7.));
        vec3 col = mix(warm, vec3(.55, .68, 1.) * (.8 + .2 * sin(uTime * 9. + h * 40.)), step(.86, hash(id + 3.)));
        gl_FragColor = vec4(col * on * .9, 1.);
        #include <colorspace_fragment>
      }`,
  });
  lit.material = litMat;

  // NON STOP: a green neon over the corner shop, flickering now and then
  const neonCanvas = document.createElement("canvas"); neonCanvas.width = 512; neonCanvas.height = 128;
  const nc = neonCanvas.getContext("2d")!;
  nc.font = "700 84px system-ui, sans-serif"; nc.textAlign = "center"; nc.textBaseline = "middle";
  nc.shadowColor = "#3dff8f"; nc.shadowBlur = 22; nc.fillStyle = "#c8ffdc"; nc.fillText("NON STOP", 256, 68); nc.shadowBlur = 8; nc.fillText("NON STOP", 256, 68);
  const neonTex = new THREE.CanvasTexture(neonCanvas); neonTex.colorSpace = THREE.SRGBColorSpace;
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: new THREE.Color(0x66ff99) }));
  neon.position.copy(at("NonStopSign")).add(new THREE.Vector3(0, 0, 0.12)); scene.add(neon);

  // Lamp cones: soft light falling from each bulb to the pavement, with motes (or rain) drifting through.
  const ground = -1.15;
  const coneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uNight: U.uNight, uFog: U.uFog },
    vertexShader: "varying float vV; varying vec3 vN, vW; void main(){ vV = uv.y; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: `uniform float uNight, uFog; varying float vV; varying vec3 vN, vW;
      void main(){
        float edge = pow(abs(dot(normalize(vN), normalize(cameraPosition - vW))), 1.6);
        float a = uNight * (.3 + uFog * .25) * pow(vV, .7) * edge;
        gl_FragColor = vec4(vec3(1., .72, .38) * a, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const cones: { p: T.Vector3; r: number; h: number }[] = [];
  root.traverse((o) => {
    if (!/^LampBulb[FN]\d$/.test(o.name)) return;
    const p = o.getWorldPosition(new THREE.Vector3()), h = p.y - ground, r = h * 0.62;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.1, r, h, 40, 1, true), coneMat);
    cone.position.set(p.x, p.y - h / 2 - 0.08, p.z); scene.add(cone);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex(THREE), color: 0xffb46a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    glow.position.copy(p); glow.scale.setScalar(1.4); glow.userData.glow = true; scene.add(glow);
    cones.push({ p, r, h });
  });
  const glows = scene.children.filter((o) => o.userData.glow) as T.Sprite[];
  // motes in the cones (rain streaks replace them when it rains)
  const MOTES = 70 * cones.length, mp = new Float32Array(MOTES * 3), mseed = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) mseed[i] = Math.random();
  const motesGeo = new THREE.BufferGeometry(); motesGeo.setAttribute("position", new THREE.BufferAttribute(mp, 3)); motesGeo.setAttribute("seed", new THREE.BufferAttribute(mseed, 1));
  const motes = new THREE.Points(motesGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uNight: U.uNight, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: "attribute float seed; uniform float uPx; varying float vS; void main(){ vS = seed; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = (2. + seed * 3.) * uPx * (8. / -mv.z); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform float uNight; varying float vS; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1., .8, .55) * smoothstep(.5, .0, d) * uNight * (.35 + .4 * vS), 1.); }",
  }));
  scene.add(motes);

  // Rain or snow over the street, and drops on her glass
  const DROPS = 1400, rp = new Float32Array(DROPS * 6);
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xc8d4ff, transparent: true, opacity: 0.35, depthWrite: false }));
  rain.visible = false; scene.add(rain);
  const FLAKES = 900, sp = new Float32Array(FLAKES * 3);
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false, map: blobTex(THREE) }));
  snow.visible = false; scene.add(snow);
  const box = { x: 22, y0: ground, y1: 7, z0: -1.2, z1: -26 };
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  for (let i = 0; i < DROPS; i++) { const x = rnd(-box.x, box.x), y = rnd(box.y0, box.y1), z = rnd(box.z1, box.z0); rp.set([x, y, z, x, y - 0.25, z], i * 6); }
  for (let i = 0; i < FLAKES; i++) sp.set([rnd(-box.x, box.x), rnd(box.y0, box.y1), rnd(box.z1, box.z0)], i * 3);
  // Water on her glass (lib/rainGlass.ts): a drop sim painted into a normal map in the glass's own plane, so the drops
  // stay on the window when she turns her head; the glass pass below refracts the street through them.
  const glassP = at("WindowGlass"), GLASS = { w: 2.1, h: 1.25 };
  const mapW = touch ? 512 : 1024, mapH = Math.round((mapW * GLASS.h) / GLASS.w), mk = mapH / 600;
  const wet = painter(mapW, mapH);
  const mapTex = new THREE.CanvasTexture(wet.map); mapTex.colorSpace = THREE.NoColorSpace; mapTex.generateMipmaps = false; mapTex.minFilter = THREE.LinearFilter;
  let drops: Rain | null = null, dropsKind = "", evap = 0;
  const RAIN: Record<string, { rate: number; maxR: number; mist: number }> = { drizzle: { rate: 12, maxR: 8, mist: 450 }, rain: { rate: 34, maxR: 12, mist: 800 }, storm: { rate: 50, maxR: 14, mist: 1000 } };
  const wetStep = (dt: number) => {
    if (!drops) return;
    step(drops, dt); mist(wet, drops, dt);
    if ((evap += dt) > 1) { evap = 0; wet.m.globalAlpha = 0.05; wet.m.globalCompositeOperation = "destination-out"; wet.m.fillRect(0, 0, mapW, mapH); wet.m.globalAlpha = 1; wet.m.globalCompositeOperation = "source-over"; } // the mist dries slowly
  };
  if (process.env.NODE_ENV !== "production") (window as unknown as { __rain?: () => Rain | null }).__rain = () => drops; // dev: peek at the drops
  const wetPaint = () => { if (drops) { paint(wet, drops); mapTex.needsUpdate = true; } };
  const setDrops = (kind: string) => {
    if (kind === dropsKind) return; dropsKind = kind;
    const k = RAIN[kind]; drops = null; wet.m.clearRect(0, 0, mapW, mapH);
    if (!k) return;
    drops = createRain({ w: mapW, h: mapH, max: touch ? 220 : 500, rate: k.rate * (touch ? 0.6 : 1), minR: 1.6 * mk, maxR: k.maxR * mk, mist: k.mist * (touch ? 0.5 : 1), run: !reduce });
    for (let i = 0; i < 80; i++) wetStep(0.1); // it has been raining a while
    wetPaint();
  };

  // The pigeon, lit live: daylight from up the street, at night the lamp behind her
  const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x6b5a4a, 1.2), key = new THREE.DirectionalLight(0xffe0b8, 2.2), lamp = new THREE.PointLight(0xffb070, 0, 4, 1.4);
  key.position.set(8, 6, -4); lamp.position.set(-0.75, 1.7, 0.95);
  // a soft light from her side, so both hands and the mug are lit evenly (the street lights only their far sides)
  const fill = new THREE.DirectionalLight(0xffe6d2, 1.1); fill.position.set(-0.55, 2.0, 1.0); fill.target.position.set(-0.19, 1.17, -0.12);
  scene.add(hemi, key, lamp, fill, fill.target);
  const pigeon = bird.scene;
  const spot = node("PigeonSpot"); spot.add(pigeon);
  pigeon.traverse((o) => { if ((o as T.Mesh).isMesh) { const m = (o as T.Mesh).material as T.MeshStandardMaterial; m.roughness = 0.85; m.metalness = 0; o.frustumCulled = false; } });
  const bone = (n: string) => pigeon.getObjectByName(n) as T.Bone;
  const neck = bone("Neck"), head = bone("Head"), bodyB = bone("Body"), tail = bone("Tail");
  const rest = new Map<T.Bone, T.Quaternion>([neck, head, bodyB, tail].map((b) => [b, b.quaternion.clone()]));
  pigeon.updateMatrixWorld(true);
  const beakDir = () => new THREE.Vector3(0, 1, 0).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
  const fwd0 = beakDir();
  const UP = new THREE.Vector3(0, 1, 0);
  // turn a bone by a world-space rotation on top of its rest pose
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qp = new THREE.Quaternion();
  const turn = (b: T.Bone, yaw: number, pitch: number, roll = 0) => {
    b.parent!.updateWorldMatrix(true, false); b.parent!.getWorldQuaternion(qp);
    const right = new THREE.Vector3().crossVectors(fwd0, UP).normalize().applyAxisAngle(UP, yaw);
    qa.setFromAxisAngle(UP, yaw).premultiply(qb.setFromAxisAngle(right, pitch));
    if (roll) qa.multiply(qb.setFromAxisAngle(fwd0.clone().applyAxisAngle(UP, yaw), roll));
    b.quaternion.copy(qp).invert().multiply(qa).multiply(qp).multiply(rest.get(b)!);
  };
  // the yaw that points the beak (or one eye) at her
  const toHer = (eye: number) => {
    const p = head.getWorldPosition(new THREE.Vector3()), d = camera.position.clone().sub(p).setY(0).normalize();
    const a = Math.atan2(fwd0.clone().cross(d).y, fwd0.dot(d));
    return Math.max(-1.7, Math.min(1.7, a + eye * 1.15)); // eye ±1: side-on, one eye on her, the way pigeons look
  };
  // the routine she asked for: look at her, look out, peck the crumbs, stare, again; snaps, then holds
  type Pose = { yaw: number; pitch: number; roll: number; dip: number; dur: number };
  let queue: Pose[] = [], pose: Pose = { yaw: 0, pitch: 0, roll: 0, dip: 0, dur: 1 }, poseAt = 0, puff = 0, cooT = -9;
  const cur = { yaw: 0, pitch: 0, roll: 0, dip: 0 }, vel = { yaw: 0, pitch: 0, roll: 0, dip: 0 };
  const plan = () => {
    const q: Pose[] = [], r = Math.random;
    const eye = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < 2 + Math.floor(r() * 2); i++) q.push({ yaw: toHer(i % 2 ? eye : 0), pitch: -0.1, roll: (r() - 0.5) * 0.3, dip: 0, dur: 0.6 + r() * 0.9 });       // look at her
    for (let i = 0; i < 2; i++) q.push({ yaw: (r() - 0.5) * 0.5, pitch: 0.05, roll: 0, dip: 0, dur: 0.5 + r() * 0.8 });                                              // look out at the street
    for (let i = 0; i < 2 + Math.floor(r() * 3); i++) q.push({ yaw: -0.25 + r() * 0.3, pitch: 1.05, roll: 0, dip: 0.28, dur: 0.16 }, { yaw: -0.2, pitch: 0.35, roll: 0, dip: 0.1, dur: 0.22 + r() * 0.3 }); // peck
    q.push({ yaw: toHer(eye), pitch: -0.15, roll: eye * 0.35, dip: 0, dur: 2 + r() * 1.5 });                                                                    // stare
    return q;
  };
  const coo = () => { sfx.coo(); cooT = U.uTime.value; puff = 1; queue = [{ yaw: toHer(0), pitch: -0.25, roll: 0, dip: -0.08, dur: 0.9 }, { yaw: toHer(1), pitch: -0.1, roll: 0.3, dip: 0, dur: 1.4 }, ...plan()]; poseAt = 0; };

  // Her hands round the mug: a sip when clicked. They move round the mug's centre.
  const hands = handsG?.scene ?? new THREE.Group(), pivot = new THREE.Group(); // no file: no hands, the rest still runs
  scene.add(hands); hands.updateMatrixWorld(true);
  hands.traverse((o) => { if ((o as T.Mesh).isMesh) { const m = (o as T.Mesh).material as T.MeshStandardMaterial; m.envMapIntensity = 0; m.roughness = Math.max(m.roughness, 0.6); m.metalness = 0; m.side = THREE.DoubleSide; } }); // the mirrored hand's fingers face inward: draw both sides
  pivot.position.copy(at("HandsPivot")); scene.add(pivot); pivot.updateMatrixWorld(true);
  pivot.attach(hands);
  const handsRest = { p: pivot.position.clone(), q: pivot.quaternion.clone() };
  let sipAt = -9, nextSip = 9 + Math.random() * 8;
  // A first-person sip: the mug comes most of the way to her lips (in her head's frame, so it lands there wherever
  // she's looking), tips toward her so the rim and the chocolate fill the bottom of the view, her gaze dips onto it.
  const SIP = { rise: 0.75, hold: 1.0, down: 0.8, reach: 0.9, tilt: 0.7, dip: 0.15, mouth: new THREE.Vector3(0, -0.07, -0.1) };
  const baseQi = baseQ.clone().invert();
  const restLocal = handsRest.p.clone().sub(camera.position).applyQuaternion(baseQi); // where her hands rest, seen from her eyes
  const sip = () => { if (U.uTime.value - sipAt > SIP.rise + SIP.hold + SIP.down + 0.25) { sipAt = U.uTime.value; window.setTimeout(() => sfx.sip(), SIP.rise * 1000 + 50); } };
  // the lens fogs from the steam while the mug is at her face, then clears
  const haze = document.createElement("div"); haze.className = s.haze; el.appendChild(haze);
  haze.style.backdropFilter = "blur(9px) brightness(1.1)"; // inline: the CSS build drops backdrop-filter from the module
  let hazeWas = -1;

  // Steam off the hot chocolate
  const steamSpot = at("SteamSpot"), STEAM = 16;
  const steamMat = new THREE.SpriteMaterial({ map: smokeTex(THREE), color: 0xfff6ee, transparent: true, depthWrite: false, opacity: 0 });
  const steam = Array.from({ length: STEAM }, (_, i) => { const sp = new THREE.Sprite(steamMat.clone()); sp.userData.k = i / STEAM; scene.add(sp); return sp; });
  const steamLocal = pivot.worldToLocal(steamSpot.clone()), steamAt = new THREE.Vector3(); // rides with the mug

  // A Dacia now and then, either way down the street
  let drive: { obj: T.Object3D; wheels: T.Object3D[]; x: number; dir: number; z: number; v: number; lights: T.Sprite[] } | null = null, nextCar = 4 + Math.random() * 6;
  const laneZ = [at("LaneNear").z, at("LaneFar").z];
  if (car) {
    const obj = car.scene; obj.visible = false; scene.add(obj);
    obj.traverse((o) => { if ((o as T.Mesh).isMesh) { const m = (o as T.Mesh).material as T.MeshStandardMaterial; m.envMapIntensity = 0.4; } });
    const wheels = ["DaciaWheelFL", "DaciaWheelFR", "DaciaWheelRL", "DaciaWheelRR"].map((n) => obj.getObjectByName(n)!).filter(Boolean);
    const lights = [0, 1, 2, 3].map((i) => {
      const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex(THREE), color: i < 2 ? 0xfff2cc : 0xff3a2a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      l.position.set(i % 2 ? 0.62 : -0.62, 0.72, i < 2 ? 2.15 : -2.2); l.scale.setScalar(i < 2 ? 0.9 : 0.45); obj.add(l); return l;
    });
    drive = { obj, wheels, x: 0, dir: 1, z: laneZ[0], v: 0, lights };
  }

  // Look and click
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(9, 9);
  // Her head turns toward the cursor: a critically damped spring on a target in -1..1 (the screen's edges), so it
  // glides and settles. Her hands go partway with it, the way you'd turn your head holding a mug.
  // On touch: a slow idle drift, and a finger on the view leads it (pan-y: vertical drags still scroll the page).
  const LOOK = { yaw: 0.14, pitch: 0.08, follow: 0.6, w: 6.5 };
  const look = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, held: false };
  let lookUp = LOOK.pitch; // how far up she may look: on a tall screen the wide lens already reaches the top of the frame (nothing built above it)
  let hot: Hot = null;
  const project = (p: T.Vector3) => { const v = p.clone().project(camera); return [(v.x * 0.5 + 0.5) * 100, (-v.y * 0.5 + 0.5) * 100]; };
  // The Post-it, stuck on the frame post right of the middle pane (mullion and the two sash lips, 12 cm of white PVC,
  // build_view.py): 15.5 cm square, under 2° crooked so it reads. Its corners follow her gaze.
  const NOTE = { c: new THREE.Vector3(0.33, 1.43, -0.112), w: 0.155, tilt: -0.03 };
  const glueNote = () => {
    camera.updateMatrixWorld();
    const hw = NOTE.w / 2, hh = hw * live.current.noteAspect(), cs = Math.cos(NOTE.tilt), sn = Math.sin(NOTE.tilt);
    live.current.onNote([[-hw, hh], [hw, hh], [hw, -hh], [-hw, -hh]].map(([x, y]) => {
      const v = new THREE.Vector3(NOTE.c.x + x * cs - y * sn, NOTE.c.y + x * sn + y * cs, NOTE.c.z).project(camera);
      return [(v.x * 0.5 + 0.5) * el.clientWidth, (-v.y * 0.5 + 0.5) * el.clientHeight];
    }));
  };
  const pick = (): Hot => {
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(pigeon, true).length) return "pigeon";
    if (ray.intersectObject(hands, true).length) return "mug";
    return null;
  };
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    look.tx = Math.max(-1, Math.min(1, ndc.x)); look.ty = Math.max(-1, Math.min(1, ndc.y)); look.held = true;
    const h = pick(); if (h !== hot) { hot = h; el.style.cursor = h ? "pointer" : ""; }
    const [x, y] = project(h === "pigeon" ? head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.12, 0)) : steamSpot.clone().add(new THREE.Vector3(0, 0.08, 0)));
    live.current.onHot(h, x, y);
    if (reduce) render();
  };
  const onLeave = () => { ndc.set(9, 9); look.tx = look.ty = 0; look.held = false; hot = null; el.style.cursor = ""; live.current.onHot(null, 0, 0); };
  const onClick = (e: PointerEvent) => { onMove(e); const h = pick(); if (h === "pigeon") coo(); else if (h === "mug") sip();
    if (reduce) { tick(U.uTime.value + 1.2, 1.2); render(); if (h === "mug") window.setTimeout(() => { tick(U.uTime.value + 2, 0); render(); }, 1400); } }; // calm: the sip as two stills, then the view back
  el.addEventListener("pointermove", onMove); el.addEventListener("pointerleave", onLeave); el.addEventListener("pointercancel", onLeave); el.addEventListener("click", onClick as EventListener);

  // The kit's tree by the bench, live: it sways in her wind, and its leaves follow the month
  // (green in summer, gold now in October, thinning in November, bare in winter).
  const treeU = { uTime: U.uTime, uWind: U.uWind, uAutumn: { value: 0 }, uBare: { value: 0 } };
  if (treeG) {
    const tree = treeG.scene; tree.position.set(6.2, -1.15, -14.2); scene.add(tree);
    const mo = new Date().getMonth(); // 0 = January
    treeU.uAutumn.value = [0, 0, 0, 0, 0, 0, 0, 0.1, 0.35, 0.85, 1, 1][mo];
    treeU.uBare.value = [1, 1, 0.8, 0.3, 0, 0, 0, 0, 0, 0.1, 0.55, 0.9][mo];
    tree.traverse((o) => {
      const m = (o as T.Mesh).material as T.MeshStandardMaterial | undefined;
      if (!m || !(o as T.Mesh).isMesh) return;
      m.envMapIntensity = 0;
      if (!/leaf|branch/i.test(m.name)) return; // the leaves and the leafy branch cards: cut out, swaying, by the month
      m.alphaTest = 0.5; m.transparent = false; m.side = THREE.DoubleSide; m.depthWrite = true;
      m.roughness = 1; m.roughnessMap = null; m.metalness = 0; m.metalnessMap = null; m.normalMap = null; // matte, no foil glints
      // lit as one soft ball like the trees across the street: each leaf's normal points out from the canopy's centre
      const geo = (o as T.Mesh).geometry; geo.computeBoundingBox(); const centre = geo.boundingBox!.getCenter(new THREE.Vector3());
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, treeU, { uCanopy: { value: centre } });
        sh.fragmentShader = sh.fragmentShader.replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n normal = normalize(vCanopyN);");
        sh.vertexShader = "uniform float uTime, uWind; uniform vec3 uCanopy; flat varying float vLeafId; varying vec3 vCanopyN;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
          vCanopyN = normalize(normalMatrix * normalize(position - uCanopy));
          vec4 wp = modelMatrix * vec4(transformed, 1.); float h = max(wp.y + 1.15, 0.) / 6.;
          vLeafId = fract(sin(dot(floor(wp.xyz * 1.4), vec3(12.9, 78.2, 37.7))) * 43758.5);   // clumps about 70 cm across, like the blob trees
          float sway = (sin(uTime * 1.1 + wp.x * .4) * .6 + sin(uTime * 2.3 + wp.z) * .3) * (.04 + uWind * .12) * h * h;
          transformed.x += sway; transformed.z += sway * .4; transformed.y += sin(uTime * 3. + vLeafId * 20.) * .015 * h;`);
        sh.fragmentShader = "uniform float uAutumn, uBare; flat varying float vLeafId; varying vec3 vCanopyN;\n" + sh.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
          if (vLeafId < uBare) discard;
          // autumn in the same plane-tree palette as the baked trees across the street (build_city.py), in clumps
          float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11)); float k = floor(fract(vLeafId * 7.) * 6.);
          vec3 fall = k < 1. ? vec3(.584, .259, .023) : k < 2. ? vec3(.701, .379, .05) : k < 3. ? vec3(.33, .259, .038)
                    : k < 4. ? vec3(.157, .197, .038) : k < 5. ? vec3(.47, .13, .019) : vec3(.751, .465, .101);
          diffuseColor.rgb = mix(diffuseColor.rgb, fall * (.92 + lum * .12), uAutumn);   // flat per clump, the lo-fi way`);
      };
    });
  }

  // Her room's fairy lights, strung across the top of the window: warm, a little out of focus, twinkling
  const fairy: T.Vector3[] = [], FAIRY = 26;
  for (let i = 0; i < FAIRY; i++) {
    const u = i / (FAIRY - 1), x = -1.05 + 2.1 * u;
    fairy.push(new THREE.Vector3(x, 1.86 - 0.36 * Math.sin(Math.PI * u) - 0.04 * Math.sin(u * Math.PI * 6), -0.05));
  }
  const fairyMat = new THREE.MeshBasicMaterial({ color: 0xffd7a0, toneMapped: false, transparent: true });
  const bulbGeo = new THREE.SphereGeometry(0.009, 10, 8), fairyGlow: T.Sprite[] = [];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(fairy).getPoints(120)), new THREE.LineBasicMaterial({ color: 0x2a3a2a })));
  fairy.forEach((p, i) => {
    const b = new THREE.Mesh(bulbGeo, fairyMat); b.position.copy(p).add(new THREE.Vector3(0, -0.018, 0)); scene.add(b);
    const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex(THREE), color: i % 3 ? 0xffc27a : 0xffe2b8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    g.position.copy(b.position); g.scale.setScalar(0.09); g.userData.ph = Math.random() * 6; scene.add(g); fairyGlow.push(g);
  });
  // Dust in the air just inside her window, catching the light, like the motes in her room's sunbeam
  const DUST = 140, dp = new Float32Array(DUST * 3), dseed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) { dseed[i] = Math.random(); dp.set([rnd(-0.95, 0.95), rnd(1.25, 2.0), rnd(-0.12, 0.08)], i * 3); } // between her mug and the glass, never at her eye
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute("seed", new THREE.BufferAttribute(dseed, 1));
  scene.add(new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.uTime, uNight: U.uNight, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed; uniform float uTime, uPx; varying float vA;
      void main(){ vec3 p = position + vec3(sin(uTime * .21 + seed * 40.) * .05, sin(uTime * .13 + seed * 17.) * .06, cos(uTime * .17 + seed * 9.) * .04);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = min((1.2 + seed * 2.4) * uPx * (1. / -mv.z), 5. * uPx); gl_Position = projectionMatrix * mv;
        vA = .35 + .65 * pow(.5 + .5 * sin(uTime * (.6 + seed) + seed * 30.), 3.); }`,
    fragmentShader: "uniform float uNight; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(mix(vec3(1., .93, .8), vec3(1., .78, .55), uNight) * smoothstep(.5, 0., d) * vA * .55, 1.); }",
  })));

  // Bloom on what glows (lamps, neon, windows, the sun, the fairy lights), then her room's grade:
  // lavender in the shadows, warm in the lights, a touch more colour.
  // The scene renders with its depth, so the glass pass knows what is in front of the glass (frame, hands, mug).
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(1, 1) });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  // Her window glass: each pixel's ray meets the glass plane; where nothing nearer is in the way and there's water,
  // the drop is a little lens: the street behind, small and upside down, a dark rim, a glint.
  const glassPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, tMap: { value: mapTex }, uO: { value: new THREE.Vector3() }, uU: { value: new THREE.Vector3() }, uV: { value: new THREE.Vector3() },
      uTan: { value: new THREE.Vector2() }, uNear: { value: camera.near }, uFar: { value: camera.far }, uK: { value: 0.22 }, uAspect: { value: 1 }, uNight: U.uNight },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: `#include <packing>
      uniform sampler2D tDiffuse, tDepth, tMap; uniform vec3 uO, uU, uV; uniform vec2 uTan; uniform float uNear, uFar, uK, uAspect, uNight; varying vec2 vUv;
      float dist(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar); }
      void main(){
        vec4 base = texture2D(tDiffuse, vUv);
        vec3 dir = vec3((vUv * 2. - 1.) * uTan, -1.), N = cross(uU, uV);
        float t = dot(uO, N) / dot(dir, N);                       // how far ahead the glass is, along her view
        vec3 p = dir * t - uO; vec2 g = vec2(dot(p, uU) / dot(uU, uU), dot(p, uV) / dot(uV, uV));
        vec4 d = texture2D(tMap, g);
        if (t <= 0. || g.x < 0. || g.y < 0. || g.x > 1. || g.y > 1. || d.a < .01 || dist(vUv) < t - .004) { gl_FragColor = base; return; }
        vec2 n = (d.rg * 2. - 1.) * vec2(1., -1.); float l = length(n);
        vec2 s = clamp(vUv - n * uK * vec2(1. / uAspect, 1.), .001, .999); // a lens: the view from the far side, flipped
        if (dist(s) < t - .004) s = vUv;                                   // never her hands or the frame in a drop
        vec3 c = texture2D(tDiffuse, s).rgb * (.9 + .18 * d.b);
        c *= 1. - .6 * smoothstep(.62, .98, l);                              // the rim, where the light bends away
        vec3 n3 = normalize(vec3(n, sqrt(max(.04, 1. - l * l))));
        c += pow(max(dot(n3, normalize(vec3(-.45, .6, .65))), 0.), 36.) * mix(vec3(.9, .95, 1.), vec3(1., .82, .6), uNight) * (.7 - .35 * uNight);
        gl_FragColor = vec4(mix(base.rgb, c, d.a), base.a);
      }`,
  });
  const glassRender = glassPass.render.bind(glassPass);
  glassPass.render = (r, w, read, dt, mask) => { glassPass.uniforms.tDepth.value = read.depthTexture; glassRender(r, w, read, dt, mask); };
  glassPass.enabled = false; composer.addPass(glassPass);
  const qInv = new THREE.Quaternion();
  const aimGlass = () => { // the glass plane in her eyes' frame, this frame
    camera.updateMatrixWorld(); qInv.copy(camera.quaternion).invert();
    const u = glassPass.uniforms;
    (u.uO.value as T.Vector3).set(glassP.x - GLASS.w / 2, glassP.y - GLASS.h / 2, glassP.z).applyMatrix4(camera.matrixWorldInverse);
    (u.uU.value as T.Vector3).set(GLASS.w, 0, 0).applyQuaternion(qInv); (u.uV.value as T.Vector3).set(0, GLASS.h, 0).applyQuaternion(qInv);
    const ty = Math.tan((camera.fov * Math.PI) / 360); (u.uTan.value as T.Vector2).set(ty * camera.aspect, ty); u.uAspect.value = camera.aspect;
  };
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 256), 0.32, 0.7, 0.92); composer.addPass(bloom);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uNight: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uNight; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.299, .587, .114));
        c = mix(vec3(l), c, 1.12);                                                   // a little more colour
        c += (1. - smoothstep(0., .4, l)) * vec3(.012, .006, .028) * (1. + .5 * uNight); // a touch of lavender in the shadows
        c *= mix(vec3(1.), vec3(1.05, .99, .93), smoothstep(.35, 1., l));            // warm highlights
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // Size: her view's height stays; narrow screens widen the lens enough to keep the mug and the pigeon in.
  const size = () => {
    const { width, height } = el.getBoundingClientRect();
    renderer.setSize(width, height, false); composer.setSize(width, height); bloom.resolution.set(width / 2, height / 2);
    camera.aspect = width / Math.max(1, height);
    const need = 2 * Math.atan(Math.tan((62 * Math.PI) / 360) / camera.aspect) * (180 / Math.PI);
    camera.fov = Math.max(baseVfov, need);
    camera.updateProjectionMatrix();
    lookUp = Math.max(0, Math.min(LOOK.pitch, (42 - camera.fov / 2) * (Math.PI / 180))); // the frame's top sits ~42° above her eyeline
    glueNote();
  };
  const ro = new ResizeObserver(() => { size(); render(); }); ro.observe(el);
  size();

  // Her sky right now: every few seconds
  const setSky = () => {
    const { hf } = herClock(), k = skyAt(hf), wx = live.current.wx;
    U.uNight.value = k.night; U.uTop.value.set(k.top); U.uBottom.value.set(k.bottom); U.uSun.value.set(...k.sun);
    // grade: warm at golden hour, a little blue at dusk, neutral by day and night
    const g = Math.min(1, k.golden * (1 - k.night));
    U.uGrade.value.setRGB(1 + 0.16 * g, 1 - 0.02 * g, 1 - 0.16 * g);
    const kind = wx?.kind ?? "clear", fogK = kind === "fog" ? 1 : kind === "rain" || kind === "storm" ? 0.55 : kind === "snow" ? 0.6 : kind === "drizzle" ? 0.4 : 0.1;
    U.uFog.value = fogK; U.uFogColor.value.set(k.bottom).lerp(lavender, 0.18).multiplyScalar(0.95 - 0.45 * k.night); // a lavender haze, like her room
    U.uCloud.value = Math.max(wx?.cloud ?? 0.25, kind === "clear" ? 0 : 0.6); U.uWind.value = Math.min(1, (wx?.wind ?? 8) / 30);
    U.uWet.value = kind === "rain" || kind === "storm" || kind === "drizzle" ? 1 : 0;
    (litMat.uniforms.uLit as { value: number }).value = k.night * (hf > 17 || hf < 1 ? 0.55 : hf < 5 ? 0.12 : 0.3);
    rain.visible = kind === "rain" || kind === "storm" || kind === "drizzle"; (rain.material as T.LineBasicMaterial).opacity = kind === "drizzle" ? 0.18 : 0.32;
    snow.visible = kind === "snow";
    setDrops(kind); glassPass.enabled = !!drops;
    // the pigeon's light
    hemi.intensity = 0.35 + 0.9 * (1 - k.night); hemi.color.set(k.night > 0.5 ? "#7b86c8" : "#e4ecff");
    key.intensity = 1.5 * (1 - k.night) * (1 - 0.5 * fogK); key.color.set(g > 0.3 ? "#ffc58a" : "#ffe7c4");
    lamp.intensity = 2.4 * k.night; fill.intensity = 1.1 - 0.5 * k.night; fill.color.set(k.night > 0.5 ? "#ffc9a0" : "#ffe6d2");
    for (const gl of glows) (gl.material as T.SpriteMaterial).opacity = k.night;
    neon.material.opacity = 0.35 + 0.65 * k.night;
    const dusk = Math.max(k.night, k.golden * 0.6); fairyMat.opacity = 0.25 + 0.75 * dusk; for (const g of fairyGlow) (g.material as T.SpriteMaterial).opacity = 0.04 + 0.96 * dusk; // lit for the evening, barely there by day
    grade.uniforms.uNight.value = k.night;
  };
  setSky();
  const skyTimer = window.setInterval(() => { setSky(); if (reduce) render(); }, 20000);

  // ---------- the loop ----------
  let flashT = 99;
  const eul = new THREE.Euler(), qHead = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  const spring = (k: keyof typeof cur, target: number, dt: number, w = 26) => { // critically damped: a snap, then still
    const x = cur[k] - target; const a = -w * w * x - 2 * w * vel[k]; vel[k] += a * dt; cur[k] += vel[k] * dt;
  };
  const tick = (t: number, dt: number) => {
    U.uTime.value = t;
    // her head turns toward the cursor, with a slow breath (calm: no look, no drift)
    const breathe = reduce ? 0 : Math.sin(t * 0.9) * 0.0035;
    if (!reduce) {
      if (touch && !look.held) { look.tx = Math.sin(t * 0.11) * 0.35; look.ty = Math.sin(t * 0.07 + 1.3) * 0.25; }
      const h = Math.min(dt, 0.033), w = LOOK.w;
      look.vx += (-w * w * (look.x - look.tx) - 2 * w * look.vx) * h; look.x += look.vx * h;
      look.vy += (-w * w * (look.y - look.ty) - 2 * w * look.vy) * h; look.y += look.vy * h;
    }
    const yaw = -look.x * LOOK.yaw, pitch = look.y * (look.y > 0 ? lookUp : LOOK.pitch);
    // she drinks on her own every so often (a click does it too)
    if (!reduce && t > nextSip) { sip(); nextSip = t + 15 + Math.random() * 10; }
    const sx = t - sipAt, top = SIP.rise + SIP.hold, end = top + SIP.down;
    const sipping = sx < SIP.rise ? ease(sx / SIP.rise) : sx < top ? 1 : sx < end ? 1 - ease((sx - top) / SIP.down) : 0;
    camera.quaternion.copy(baseQ).multiply(qa.setFromEuler(eul.set(pitch + breathe - sipping * SIP.dip, yaw, 0, "YXZ")));
    // the lens: fogs as the mug reaches her face, clears over ~1.5 s once it's down, from the edges in
    const fog = reduce ? 0 : sx < top ? smooth((sx - SIP.rise * 0.6) / 0.7) : Math.min(1, Math.max(0, 1 - (sx - top - 0.3) / 1.5)) ** 1.6;
    const f2 = Math.round(fog * 100) / 100;
    if (f2 !== hazeWas) { hazeWas = f2; haze.style.opacity = String(f2); haze.style.transform = `scale(${0.8 + 0.2 * Math.min(1, f2 * 1.4)})`; }
    glueNote();
    // the pigeon
    poseAt -= dt;
    if (poseAt <= 0) { if (!queue.length) queue = plan(); pose = queue.shift()!; poseAt = pose.dur; }
    for (const k of ["yaw", "pitch", "roll", "dip"] as const) spring(k, pose[k], Math.min(dt, 0.033), k === "pitch" ? 34 : 26);
    turn(neck, cur.yaw * 0.45, cur.pitch * 0.55); turn(head, cur.yaw * 0.55, cur.pitch * 0.45, cur.roll);
    turn(bodyB, 0, cur.dip); turn(tail, 0, -cur.dip * 0.6 + Math.sin(t * 1.3) * 0.02);
    puff = Math.max(0, puff - dt * 0.8);
    const sc = 1 + Math.sin(t * 2.4) * 0.008 + puff * 0.09 * Math.sin(Math.min(1, (t - cooT) * 2) * Math.PI);
    bodyB.scale.set(sc, sc, sc);
    // her hands: partway with her head at rest, all the way at her lips; up toward her mouth, tip, hold, down
    const up = sipping, follow = LOOK.follow + (1 - LOOK.follow) * up;
    qHead.copy(baseQ).multiply(qa.setFromEuler(eul.set(pitch * follow, yaw * follow, 0, "YXZ")));
    pivot.position.copy(restLocal).lerp(SIP.mouth, up * SIP.reach).applyQuaternion(qHead).add(camera.position);
    pivot.quaternion.copy(qHead).multiply(qa.setFromAxisAngle(X, up * SIP.tilt)).multiply(baseQi).multiply(handsRest.q);
    pivot.updateMatrixWorld(); pivot.localToWorld(steamAt.copy(steamLocal));
    // steam: wisps rising and curling, pushed by the lean; a puff after a sip
    steam.forEach((sp, i) => {
      const life = 3.4, ph = ((t / life + sp.userData.k) % 1);
      const w = Math.sin(t * 1.3 + i * 2.1) * 0.012 + Math.sin(ph * 6 + i) * 0.01 * ph;
      sp.position.set(steamAt.x + w + look.x * 0.03 * ph, steamAt.y + ph * 0.24, steamAt.z + Math.cos(t + i) * 0.008);
      sp.scale.setScalar(0.035 + ph * 0.1);
      (sp.material as T.SpriteMaterial).opacity = Math.sin(ph * Math.PI) * (0.16 + 0.1 * U.uNight.value) * (1 - up * 0.9); // at her face it's the lens that fogs
      (sp.material as T.SpriteMaterial).rotation = ph * 1.5 + i;
    });
    // motes drift in the cones
    let mi = 0;
    for (const c of cones) for (let j = 0; j < 70; j++, mi++) {
      const s0 = mseed[mi], hh = ((s0 * 7.1 + t * 0.03 * (0.5 + s0)) % 1), rr = Math.sqrt(fract(s0 * 13.7)) * c.r * (1 - hh) * 0.9, a = s0 * 40 + t * 0.1;
      mp.set([c.p.x + Math.cos(a) * rr, c.p.y - 0.1 - hh * c.h, c.p.z + Math.sin(a) * rr], mi * 3);
    }
    motesGeo.attributes.position.needsUpdate = true;
    // rain falls, slanted by the wind; snow drifts
    if (rain.visible) {
      const fall = 11 * dt, slant = U.uWind.value * 0.12;
      for (let i = 0; i < DROPS; i++) {
        let y = rp[i * 6 + 1] - fall; let x = rp[i * 6] + slant * fall;
        if (y < box.y0) { y = box.y1; x = rnd(-box.x, box.x); }
        rp[i * 6] = x; rp[i * 6 + 1] = y; rp[i * 6 + 3] = x - slant * 0.25; rp[i * 6 + 4] = y - 0.28;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    if (snow.visible) {
      for (let i = 0; i < FLAKES; i++) {
        let y = sp[i * 3 + 1] - dt * (0.6 + (i % 5) * 0.12); if (y < box.y0) y = box.y1;
        sp[i * 3 + 1] = y; sp[i * 3] += Math.sin(t * 0.7 + i) * dt * 0.25;
      }
      snowGeo.attributes.position.needsUpdate = true;
    }
    // water on the glass
    if (drops && dt > 0) { wetStep(Math.min(dt, 0.05)); wetPaint(); }
    // a storm: lightning every so often
    if (live.current.wx?.kind === "storm") { flashT -= dt; if (flashT < 0) flashT = 6 + Math.random() * 12; }
    U.uFlash.value = flashT > 0 && flashT < 0.18 ? (flashT < 0.06 || flashT > 0.12 ? 0.6 : 0.1) : 0;
    for (const g of fairyGlow) g.scale.setScalar(0.08 + 0.025 * Math.sin(t * 1.6 + g.userData.ph));
    // the neon hums and flickers now and then
    neon.material.opacity = (0.35 + 0.65 * U.uNight.value) * (Math.random() < 0.012 ? 0.25 : 1);
    // the Dacia
    if (drive) {
      nextCar -= dt;
      if (!drive.obj.visible && nextCar < 0) {
        const lane = Math.random() < 0.5 ? 0 : 1; drive.dir = lane === 0 ? 1 : -1; drive.z = laneZ[lane];
        drive.x = -55 * drive.dir; drive.v = 7 + Math.random() * 4; drive.obj.visible = true;
        drive.obj.rotation.y = drive.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      if (drive.obj.visible) {
        drive.x += drive.dir * drive.v * dt; drive.obj.position.set(drive.x, ground - 0.15, drive.z);
        for (const w of drive.wheels) w.rotation.x += (drive.v * dt) / 0.29;
        for (const l of drive.lights) (l.material as T.SpriteMaterial).opacity = U.uNight.value;
        if (Math.abs(drive.x) > 56) { drive.obj.visible = false; nextCar = (U.uNight.value > 0.5 ? 14 : 6) + Math.random() * 18; }
      }
    }
  };
  const render = () => { if (glassPass.enabled) aimGlass(); composer.render(); };
  let raf = 0, visible = false, last = 0;
  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
    tick(now / 1000, dt); render();
    raf = requestAnimationFrame(loop);
  };
  const wake = () => { if (!raf && visible && !reduce) raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }); io.observe(el);
  document.addEventListener("visibilitychange", wake);
  // calm: one still frame, the pigeon looking at her
  if (reduce) { queue = [{ yaw: toHer(1), pitch: -0.1, roll: 0.3, dip: 0, dur: 99 }]; for (let i = 0; i < 40; i++) tick(i * 0.033, 0.033); render(); }
  else { tick(0, 0); render(); }
  onReady();

  return () => {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); clearInterval(skyTimer);
    document.removeEventListener("visibilitychange", wake);
    el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); el.removeEventListener("pointercancel", onLeave); haze.remove(); el.removeEventListener("click", onClick as EventListener);
    scene.traverse((o) => {
      const m = o as T.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => { for (const v of Object.values(mt)) if ((v as T.Texture)?.isTexture) (v as T.Texture).dispose(); mt.dispose(); });
    });
    for (const t of Object.values(NIGHTS)) t.dispose();
    mapTex.dispose(); composer.dispose(); rt.depthTexture?.dispose();
    renderer.dispose(); renderer.domElement.remove();
  };
}

const smooth = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const fract = (x: number) => x - Math.floor(x);
// soft round glow, shared
let blob: T.Texture | null = null;
function blobTex(THREE: typeof import("three")) {
  if (blob) return blob;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d")!, r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (blob = new THREE.CanvasTexture(c));
}
// a wisp of steam: a soft lumpy cloud
function smokeTex(THREE: typeof import("three")) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 9; i++) {
    const x = 64 + (Math.random() - 0.5) * 40, y = 64 + (Math.random() - 0.5) * 50, rr = 18 + Math.random() * 26;
    const r = g.createRadialGradient(x, y, 0, x, y, rr); r.addColorStop(0, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
}
