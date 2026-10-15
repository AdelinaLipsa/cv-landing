"use client";
import { useEffect, useId, useRef } from "react";
import { preload } from "react-dom";
import type * as T from "three";
import type { Toy } from "@/lib/toyStage";
import { profile } from "@/content/cv";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import s from "./Finale.module.css";

export type Prop = "phone" | "printer" | "rolodex";
type Props = { className?: string; hot: Prop | null; onHot: (p: Prop | null) => void; onPick: (p: Prop) => void; onScreen?: () => void };
type Live = { hot: Prop | null; onHot: Props["onHot"]; onPick: Props["onPick"]; onScreen?: () => void };

const NOTES: [Prop, string][] = [["phone", "text me"], ["printer", "print me out"], ["rolodex", "my LinkedIn"]];
// Each note's text sits in open page space just off the room's silhouette (as a fraction of the canvas, for the
// fixed camera), and its arrow is redrawn every frame to land on the object itself. "rolodex" is her PC monitor, which
// wakes with her LinkedIn card while the LinkedIn button is hovered; the Prop name stays for the wiring.
const LABEL: Record<Prop, [number, number]> = { phone: [0.1, 0.8], printer: [0.36, 0.05], rolodex: [0.8, 0.13] };
const TARGET: Record<Prop, string> = { phone: "PhoneScreen", printer: "PrinterBodyMesh", rolodex: "Screen" };
const PICK_NODE: Record<Prop, string> = { phone: "Phone", printer: "Printer", rolodex: "Monitor" };

// Her teenage bedroom, baked in Blender (art/README.md), in the hero. One object for each way in: a Nokia for
// Message me, an inkjet for the PDF, her PC monitor for LinkedIn. Hover a button and its object acts; point at
// an object and its button lights. The preview render shows at once; the live room fades in over it.
type Bufs = { room: Promise<ArrayBuffer | null>; her: Promise<ArrayBuffer | null> };
const grab = (url: string) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);

export default function Finale({ className, hot, onHot, onPick, onScreen }: Props) {
  // The hero: the preview and both models start downloading with the page, not after it.
  preload("/models/room-preview.webp", { as: "image", fetchPriority: "high" });
  preload("/models/room.glb", { as: "fetch", crossOrigin: "anonymous" });
  preload("/models/character.glb", { as: "fetch", crossOrigin: "anonymous" });
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<Live>({ hot, onHot, onPick, onScreen });
  live.current = { hot, onHot, onPick, onScreen };

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
    <>
    <p className={s.sr}>The room is interactive. A door hanger on its wall says: knock first, or just click around: me, the cats, the computer. Pinch to zoom.</p>
    <div ref={host} className={`${s.host} ${className ?? ""}`} role="img" aria-label="My teenage bedroom at dusk: rock posters, a window, my guitars, a skateboard, boxing gloves, a corner desk with my PC, a Nokia phone, an inkjet printer, a bed with bookshelves, and my two cats. I'm in it too, sitting on the bed playing guitar and now and then getting up to work at the desk: click me to say hi, or pet a cat. The phone messages me, the printer prints my CV, and the computer boots Windows 95. Pinch or double-click to zoom in.">
      <svg className={s.arrows} aria-hidden="true">{NOTES.map(([p]) => <path key={p} data-arrow={p} />)}<path data-arrow="her" /></svg>
      {NOTES.map(([p, text]) => <span key={p} className={s.note} data-note={p} aria-hidden="true"><span>{text}</span></span>)}
      <span className={s.ring} data-ring aria-hidden="true" />
      <div className={s.hanger} data-hanger aria-hidden="true">
        <div className={s.swing} data-swing>
          <svg className={s.string} viewBox="0 0 24 44"><path d="M12 0C14 12 10 24 12 36c.6 4-3 6-4.5 4" /><circle cx="12" cy="1.5" r="2.2" /></svg>
          <div className={s.card}><Tag side="front" /><Tag side="back" /></div>
        </div>
      </div>
      <span className={`${s.note} ${s.herNote}`} data-her aria-hidden="true"><span>click me, I’ll say hi</span></span>
      <span className={s.hint} data-hint aria-hidden="true"><span>pinch or double-click to zoom</span></span>
      <button type="button" className={s.reset} data-reset aria-label="Zoom the room back out"><span>zoom out</span></button>
    </div>
    </>
  );
}

// Her door hanger: dusk-violet card, cream ink, a doodled border, three stickers. The string threads its hole.
function Tag({ side }: { side: "front" | "back" }) {
  const id = useId().replace(/:/g, ""), cut = `${id}c`, grain = `${id}g`, wob = `${id}w`;
  const ink = "#fff4e6";
  return (
    <svg className={`${s.face} ${side === "back" ? s.back : ""}`} viewBox="0 0 150 200">
      <defs>
        <mask id={cut}>
          <rect x="6" y="6" width="138" height="188" rx="16" fill="#fff" />
          <circle cx="75" cy="34" r="15" fill="#000" />
          <path d="M63 43 8 70" stroke="#000" strokeWidth="2.6" />
        </mask>
        <filter id={grain} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.8  0 0 0 0.55 -0.18" />
        </filter>
        <filter id={wob}><feTurbulence type="turbulence" baseFrequency="0.035" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="3" /></filter>
      </defs>
      <g mask={`url(#${cut})`}>
        <rect width="150" height="200" fill="#2a1f4d" />
        <rect width="150" height="200" fill="#000" filter={`url(#${grain})`} opacity="0.5" />
        <path d="M6 150c30-10 70 6 138-6v50H6z" fill="#3a2b63" opacity="0.6" />
      </g>
      <rect x="13" y="13" width="124" height="174" rx="11" fill="none" stroke={ink} strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="7 4 2 4" filter={`url(#${wob})`} />
      <circle cx="75" cy="34" r="17" fill="none" stroke={ink} strokeOpacity="0.4" strokeWidth="1.2" filter={`url(#${wob})`} />
      {side === "front" ? (
        <g className={s.ink} fill={ink}>
          <text className={s.big} x="75" y="86" fontSize="27" fontWeight="800" textAnchor="middle" transform="rotate(-4 75 86)">KNOCK</text>
          <text className={s.big} x="77" y="114" fontSize="27" fontWeight="800" textAnchor="middle" transform="rotate(-4 75 114)">FIRST</text>
          <path d="M34 124c14 5 30-4 44 1s22-3 38 0" fill="none" stroke="#ff9ec0" strokeWidth="2.2" strokeLinecap="round" filter={`url(#${wob})`} />
          <text x="75" y="142" fontSize="11.5" textAnchor="middle" fillOpacity="0.92">or just click around:</text>
          <text x="75" y="156" fontSize="11.5" textAnchor="middle" fillOpacity="0.92">me, the cats,</text>
          <text x="75" y="170" fontSize="11.5" textAnchor="middle" fillOpacity="0.92">the computer</text>
          <text x="75" y="186" fontSize="8.5" textAnchor="middle" fillOpacity="0.6" letterSpacing="0.6">pinch to zoom</text>
          {/* stickers: a star, a guitar pick, a cat face */}
          <path d="m124 14 3.6 7.6 8.3 1-6.1 5.7 1.6 8.2-7.4-4.1-7.3 4.1 1.5-8.2-6.1-5.7 8.3-1z" fill="#ffcc4d" stroke="#2a1f4d" strokeWidth="1.2" transform="rotate(14 124 26)" />
          <path d="M15 172c5-2.5 13-2.5 17 0 1 5-4 12-8.5 15-4.5-3-9.5-10-8.5-15z" fill="#ff9ec0" stroke="#2a1f4d" strokeWidth="1.2" transform="rotate(-18 24 180)" />
          <g transform="translate(127 180) rotate(10) scale(0.9)">
            <path d="M-9 -4-8-13-2-7h4l6-6 1 9c1 7-3 11-9 11s-10-4-9-11z" fill={ink} stroke="#2a1f4d" strokeWidth="1.2" />
            <circle cx="-3.5" cy="-1" r="1.2" fill="#2a1f4d" /><circle cx="3.5" cy="-1" r="1.2" fill="#2a1f4d" /><path d="M-1.5 2.5 0 3.6 1.5 2.5" stroke="#2a1f4d" fill="none" strokeWidth="1" />
          </g>
        </g>
      ) : (
        <g className={s.ink} fill={ink}>
          <text className={s.big} x="75" y="92" fontSize="20" fontWeight="800" textAnchor="middle" transform="rotate(-3 75 92)">come back</text>
          <text className={s.big} x="75" y="120" fontSize="20" fontWeight="800" textAnchor="middle" transform="rotate(-3 75 122)">soon <tspan fill="#ff9ec0">♥</tspan></text>
          <path d="M44 134c10 4 22-3 32 1s20-2 30 0" fill="none" stroke="#ff9ec0" strokeWidth="2" strokeLinecap="round" filter={`url(#${wob})`} />
          <text x="98" y="166" fontSize="12" textAnchor="middle" fillOpacity="0.85" transform="rotate(-6 98 166)">— A.</text>
          <path d="m30 160 2.4 5 5.5.7-4 3.8 1 5.4-4.9-2.7-4.9 2.7 1-5.4-4-3.8 5.5-.7z" fill="#ffcc4d" stroke="#2a1f4d" strokeWidth="1" />
        </g>
      )}
    </svg>
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

// Load timings: performance marks always (cheap; read them in any build), a table in dev once she's in.
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
      baked.set(old, new THREE.MeshBasicMaterial({ map: old.map, toneMapped: false, transparent: old.transparent, depthWrite: !old.transparent, side: old.side }));
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

  // Her computer wakes when pointed at: Win95 powers on from a bright CRT line, the tower's LED lights; it sleeps
  // 1.5 s after the pointer leaves. The LinkedIn button's card wins over it while that button is hovered.
  const desktop = win95Screen(), crt = document.createElement("canvas"), crtX = crt.getContext("2d")!;
  crt.width = desktop.width; crt.height = desktop.height;
  const winLit = lit(screenMesh, crt);
  const ledMesh = node("TowerLEDMesh") as T.Mesh, ledDark = ledMesh.material as T.Material, ledLit = new THREE.MeshBasicMaterial({ color: "#5dff8a", toneMapped: false });
  let pcHover = false, pcOffAt = 0, pcSince = -1, crtP = -1;
  const boot = (p: number) => { // p: 0 a bright line across the middle, 1 the whole desktop
    const w = crt.width, h = crt.height, band = Math.max(2, h * (1 - (1 - p) ** 3)), y = (h - band) / 2;
    crtX.fillStyle = "#000"; crtX.fillRect(0, 0, w, h);
    crtX.drawImage(desktop, 0, y, w, band, 0, y, w, band);
    crtX.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - p)})`; crtX.fillRect(0, y, w, band);
    (winLit.map as T.Texture).needsUpdate = true;
  };
  // Until the visitor clicks something in the room, a soft ring pulses on one clickable thing at a time, every 4 s:
  // her, the Siamese, the Burmese, the monitor. The first click ends it for the session.
  const ring = el.querySelector<HTMLElement>("[data-ring]")!, rv = new THREE.Vector3();
  const pulseOn: T.Object3D[] = [node("Screen")];
  let pulseI = 0, pulseAt = 1.5, pulsing: T.Object3D | null = null;
  let poked = (() => { try { return sessionStorage.getItem("room-poked") === "1"; } catch { return false; } })();
  const hanger = el.querySelector<HTMLElement>("[data-hanger]")!, swing = el.querySelector<HTMLElement>("[data-swing]")!;
  hanger.toggleAttribute("data-flipped", poked);
  const markPoked = () => {
    if (poked) return;
    poked = true; pulsing = null; ring.removeAttribute("data-on");
    hanger.toggleAttribute("data-flipped", true); // "come back soon"
    try { sessionStorage.setItem("room-poked", "1"); } catch {}
  };
  const pulse = (t: number) => {
    if (poked || reduce) return;
    if (t >= pulseAt) {
      pulseAt = t + 4; pulsing = pulseOn[pulseI++ % pulseOn.length];
      ring.setAttribute("data-on", "");
      ring.animate([{ transform: "translate(-50%, -50%) scale(0.3)", opacity: 0.95 }, { transform: "translate(-50%, -50%) scale(1.5)", opacity: 0 }], { duration: 1500, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" });
    }
    if (!pulsing) return;
    const v = pulsing.getWorldPosition(rv).project(camera);
    ring.style.left = `${((v.x + 1) / 2) * el.clientWidth}px`; ring.style.top = `${((1 - v.y) / 2) * el.clientHeight}px`;
  };
  // The door hanger hangs by its string from the top edge of the left wall, 30% in from its outer corner (the
  // shell's top corner seen furthest left) toward the back corner, so it hangs on the wall, clear of the text, her
  // and the cats. It drops in on a spring when the room goes live, sways like a pendulum, swings off a cursor.
  const sb = new THREE.Box3().setFromObject(node("Room_ShellMesh")), hook = new THREE.Vector3(), back = new THREE.Vector3(), hv2 = new THREE.Vector3();
  let far = Infinity, deep = -Infinity;
  for (const x of [sb.min.x, sb.max.x]) for (const z of [sb.min.z, sb.max.z]) {
    const cv = hv2.set(x, sb.max.y, z).applyMatrix4(camera.matrixWorldInverse), k = cv.x / -cv.z;
    if (k < far) { far = k; hook.set(x, sb.max.y, z); }
    if (-cv.z > deep) { deep = -cv.z; back.set(x, sb.max.y, z); }
  }
  hook.lerp(back, 0.3);
  let ang = 0, angV = 0, drop = 0, dropV = 0, dropped = false;
  const sway = (t: number, dt: number) => {
    if (!dropped && "live" in el.dataset) { dropped = true; drop = -150; angV = 0.5; } // in from above, with a jolt
    for (let n = Math.ceil(dt / (1 / 120)), h = dt / Math.max(n, 1); n > 0; n--) { // small steps: the drop spring is stiff
      dropV += (-220 * drop - 2 * 0.3 * Math.sqrt(220) * dropV) * h; drop += dropV * h;
      const rest = 0.03 * Math.sin(t * 0.8) + 0.012 * Math.sin(t * 1.9 + 1); // an idle sway, never quite still
      angV += (-14 * (ang - rest) - 0.9 * angV) * h; ang += angV * h;
    }
    swing.style.transform = `translateY(${drop.toFixed(1)}px) rotate(${ang.toFixed(4)}rad)`;
  };
  const onNudge = (e: PointerEvent) => { // swings away from the cursor's side
    if (reduce) return;
    const r = swing.getBoundingClientRect();
    angV += (e.clientX < r.left + r.width / 2 ? -1 : 1) * 2.4;
  };
  hanger.addEventListener("pointerenter", onNudge);
  const placeHanger = () => {
    const v = hv2.copy(hook).project(camera), off = Math.abs(v.x) > 1 || Math.abs(v.y) > 1;
    hanger.toggleAttribute("data-off", off);
    hanger.style.left = `${((v.x + 1) / 2) * el.clientWidth}px`; hanger.style.top = `${((1 - v.y) / 2) * el.clientHeight}px`;
  };

  let hoverHer = (_h: unknown) => {}; // her and the cats brighten under the pointer, once they're in
  const pointPc = (on: boolean) => { if (pcHover && !on) pcOffAt = performance.now() / 1000 + 1.5; pcHover = on; };

  const heat: Record<Prop, number> = { phone: 0, printer: 0, rolodex: 0 };
  let pointer: Prop | null = null, since = 0, wasHot: Prop | null = null;

  // Which object is under the pointer.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  type Who = "her" | "Siamese" | "Burmese";
  let who = (_r: T.Raycaster): Who | null => null, poke = () => {}, tickHer: ((dt: number) => void) | null = null, dropHer = () => {}; // filled in once she loads
  const hit = (e: PointerEvent): Prop | "tower" | Who | null => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const w = who(ray); if (w) return w; // she's in front of the desk: she wins over the objects behind her
    for (const p of Object.keys(picks) as Prop[]) if (ray.intersectObject(picks[p], true).length) return p;
    return ray.intersectObject(tower, true).length ? "tower" : null;
  };
  // Progressive notes: at rest only the door hanger; her note while the pointer's in the room (a tap shows it 2 s on
  // touch); an object's note when the pointer's near it, or its button is hovered.
  let roomPtr = false, tapUntil = 0;
  const ptr = new THREE.Vector2();
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse") { const r = el.getBoundingClientRect(); roomPtr = true; ptr.set(e.clientX - r.left, e.clientY - r.top); }
    if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) { // pinch: zoom by the spread, about the midpoint
      e.stopPropagation(); // the first finger already started the pane's drag; this cuts it off (pointerup still bubbles, so it snaps back)
      const [[ax, ay], [bx, by]] = [...touches.values()], d = Math.hypot(ax - bx, ay - by);
      if (pinch) zoomAt(want.z * (d / pinch), (ax + bx) / 2, (ay + by) / 2);
      pinch = d; return;
    }
    if (drag && want.z > 1.01) { panBy(e.clientX - drag[0], e.clientY - drag[1]); drag = [e.clientX, e.clientY]; }
    const h = hit(e), p = h === "phone" || h === "printer" ? h : null; // pointing at the computer lights nothing: it's Win95
    pointPc(h === "rolodex" || h === "tower");
    hoverHer(h);
    el.style.cursor = h ? "pointer" : want.z > 1.01 ? (drag ? "grabbing" : "grab") : "";
    if (p !== pointer) { pointer = p; live.current.onHot(p); }
    if (reduce) placeNotes(live.current.hot ?? pointer); // no loop: the notes follow the pointer here
  };
  const onLeave = () => { roomPtr = false; pointPc(false); hoverHer(null); if (reduce) placeNotes(live.current.hot); if (pointer) { pointer = null; live.current.onHot(null); } };
  // Her computer, monitor or tower, always boots Win95; LinkedIn opens only from its own button.
  // A click is a left press and release on the same object without dragging: right-clicks and drags do nothing.
  let down: { h: ReturnType<typeof hit>; x: number; y: number } | null = null;
  const onButton = (e: Event) => !!(e.target as Element).closest?.("[data-reset], [data-hanger]"); // the zoom-out button and the hanger are their own
  const onDown = (e: PointerEvent) => {
    if (onButton(e)) return;
    if (e.pointerType === "touch") touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size > 1 || want.z > 1.01) e.stopPropagation(); // a pinch or a pan is the room's, not a swipe to the next page
    if (touches.size > 1) { down = drag = null; pinch = 0; return; } // a pinch is never a click
    down = e.button === 0 ? { h: hit(e), x: e.clientX, y: e.clientY } : null;
    if (down && want.z > 1.01) { drag = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId); }
  };
  const onCancel = (e: PointerEvent) => { touches.delete(e.pointerId); pinch = 0; drag = down = null; };
  const onUp = (e: PointerEvent) => {
    if (onButton(e)) return;
    const d = down;
    onCancel(e);
    if (e.pointerType !== "mouse") tapUntil = performance.now() / 1000 + 2;
    const h = hit(e);
    if (!d || d.h !== h || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return; // a drag or pan never clicks
    if (h) markPoked();
    if (h === "her") poke();
    else if (h === "Siamese" || h === "Burmese") pet([h]);
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
  let placeHer = () => {}; // her own note, once she's in
  const placeNotes = (hot: Prop | null = null) => {
    const W = el.clientWidth, H = el.clientHeight;
    el.toggleAttribute("data-any", !!hot);
    let nearest: Prop | null = null, best = 120; // the pointer's nearest object within 120 px; never the monitor (pointing at it is Win95)
    if (roomPtr) for (const nd of notes) {
      const p = nd.dataset.note as Prop, v = anchors[p].getWorldPosition(at).project(camera);
      const d = Math.hypot(((v.x + 1) / 2) * W - ptr.x, ((1 - v.y) / 2) * H - ptr.y);
      if (p !== "rolodex" && d < best) { best = d; nearest = p; }
    }
    for (const nd of notes) {
      const p = nd.dataset.note as Prop, v = anchors[p].getWorldPosition(at).project(camera);
      const tx = ((v.x + 1) / 2) * W, ty = ((1 - v.y) / 2) * H, seen = Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
      const show = seen && (hot ? p === hot : p === nearest); // its button (or itself) hovered, else the nearest
      nd.toggleAttribute("data-show", show); arrows[p].toggleAttribute("data-show", show);
      pin(nd, arrows[p], LABEL[p][0] * W, LABEL[p][1] * H, tx, ty);
      nd.toggleAttribute("data-hot", p === hot); arrows[p].toggleAttribute("data-hot", p === hot);
    }
    placeHer();
    placeHanger();
  };

  const pose = (t: number, hot: Prop | null) => {
    // Phone: buzzes in bursts, 0.4 s on, 0.3 s off, with the message coming up after the first burst.
    const buzz = reduce ? 0 : heat.phone * ((t - since) % 0.7 < 0.4 ? 1 : 0);
    phone.position.set(phoneRest.p.x + Math.sin(t * 95) * 0.0025 * buzz, phoneRest.p.y, phoneRest.p.z + Math.cos(t * 83) * 0.0025 * buzz);
    phone.rotation.y = phoneRest.r + Math.sin(t * 70) * 0.04 * buzz;
    phoneMesh.material = hot === "phone" ? phoneLit[reduce || t - since > 0.9 ? 1 : 0] : phoneDark;
    const pc = pcHover || (!reduce && t < pcOffAt);
    if (!pc) pcSince = crtP = -1;
    else {
      if (pcSince < 0) pcSince = t;
      const p = reduce ? 1 : Math.min(1, (t - pcSince) / 0.25); // ~250 ms power-on
      if (p !== crtP) { boot(p); crtP = p; }
    }
    screenMesh.material = hot === "rolodex" ? screenLit : pc ? winLit : screenDark;
    ledMesh.material = pc ? ledLit : ledDark;
    // Printer: page one slides out of the front tray.
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
  const keep = new Map<T.Mesh, T.Material | T.Material[]>(), clear = new THREE.Color();
  const draw = () => {
    for (const m of meshes) {
      const glows = m.layers.isEnabled(BLOOM) || (m === screenMesh && m.material !== screenDark) || (m === phoneMesh && m.material !== phoneDark) || (m === ledMesh && m.material === ledLit);
      if (!glows) { keep.set(m, m.material); m.material = black; }
    }
    shaft.visible = dust.visible = false;
    for (const m of [...phoneLit, screenLit, winLit]) m.color.setScalar(0.1); // a lit screen only haloes; full strength it bleaches to white
    renderer.getClearColor(clear); const alpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.needsUpdate = true; // once a frame, not once per pass
    renderer.setRenderTarget(glowRT); renderer.clear(); renderer.render(scene, camera);
    bloom.render(renderer, null as unknown as T.WebGLRenderTarget, glowRT, 0, false);
    renderer.setRenderTarget(null); renderer.setClearColor(clear, alpha);
    for (const [m, mt] of keep) m.material = mt;
    keep.clear();
    shaft.visible = dust.visible = true;
    for (const m of [...phoneLit, screenLit, winLit]) m.color.setScalar(1);
    renderer.render(scene, camera);
    renderer.autoClear = false; add.render(renderer); renderer.autoClear = true;
  };

  // Petting a cat: a purr, the achievement (it unlocks once), and a few hearts floating up off it.
  let catAt = (_k: "Siamese" | "Burmese"): T.Object3D | null => null;
  const pet = (cats: ("Siamese" | "Burmese")[]) => {
    const found = cats.map(catAt).filter((c) => c) as T.Object3D[];
    if (!found.length) return;
    sfx.purr(); unlock("cat");
    for (const c of found) {
      const v = c.getWorldPosition(at).project(camera);
      for (let i = 0; i < 4; i++) {
        const h = document.createElement("span");
        h.className = s.heart; h.textContent = "♥"; h.setAttribute("aria-hidden", "true");
        h.style.left = `${((v.x + 1) / 2) * el.clientWidth + (i - 1.5) * 12}px`; h.style.top = `${((1 - v.y) / 2) * el.clientHeight}px`;
        h.style.animationDelay = `${i * 0.12}s`;
        h.addEventListener("animationend", () => h.remove());
        el.appendChild(h);
      }
    }
  };
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
  const clampPan = (v: typeof zoom) => {
    const r = 1 - 1 / v.z, X = FH * camera.aspect * r, Y = FH * r;
    v.x = THREE.MathUtils.clamp(v.x, -X, X); v.y = THREE.MathUtils.clamp(v.y, -Y, Y);
  };
  const resetBtn = el.querySelector<HTMLButtonElement>("[data-reset]")!;
  const settle = () => {
    clampPan(want);
    const zoomed = want.z > 1.01;
    el.toggleAttribute("data-zoomed", zoomed);
    el.style.touchAction = zoomed ? "none" : ""; // zoomed, one finger pans the room instead of the page
    if (!zoomed && document.activeElement === resetBtn) resetBtn.blur(); // it's about to hide
    if (reduce) { Object.assign(zoom, want); lens(); draw(); placeNotes(live.current.hot ?? pointer); } // no easing: it jumps
  };
  const zoomAt = (z: number, cx: number, cy: number) => { // keeps the point under (cx, cy) where it is
    const r = el.getBoundingClientRect(), nx = ((cx - r.left) / r.width) * 2 - 1, ny = 1 - ((cy - r.top) / r.height) * 2, a = camera.aspect;
    const h = FH / zoom.z, px = zoom.x + nx * h * a, py = zoom.y + ny * h;
    want.z = THREE.MathUtils.clamp(z, 1, 3);
    const h2 = FH / want.z;
    want.x = px - nx * h2 * a; want.y = py - ny * h2;
    settle();
  };
  const unzoom = () => { Object.assign(want, { z: 1, x: 0, y: 0 }); settle(); };
  const panBy = (dx: number, dy: number) => { // client pixels; the drag moves the room with the pointer
    const h = (2 * FH) / zoom.z / el.clientHeight;
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
    if (want.z > 1.01) unzoom(); else zoomAt(2, e.clientX, e.clientY);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && want.z > 1.01) unzoom(); };
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
  window.addEventListener("cv:cat", onKonami);
  resetBtn.addEventListener("click", unzoom);

  const resize = () => {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    FH = (Math.max(fitSize.y, fitSize.x / camera.aspect) * (1 + 2 * MARGIN)) / 2;
    clampPan(want); clampPan(zoom); lens();
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
  toy.run((t, dt) => {
    const hot = live.current.hot ?? pointer;
    if (hot !== wasHot) { since = t; wasHot = hot; }
    for (const p of Object.keys(heat) as Prop[]) heat[p] = ease(heat[p], p === hot ? 1 : 0, dt, p === "printer" ? 2.5 : 7);
    glow.uTime.value = t;
    pose(t, hot);
    tickHer?.(dt);
    pulse(t);
    if (!reduce) sway(t, dt);
    if (zoom.z !== want.z || zoom.x !== want.x || zoom.y !== want.y) { // ~150 ms ease
      for (const k of AXES) zoom[k] = Math.abs(want[k] - zoom[k]) < 1e-4 ? want[k] : ease(zoom[k], want[k], dt, 20);
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
    for (const p of Object.keys(heat) as Prop[]) heat[p] = p === hot ? 1 : 0;
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
        for (const a of c.animations) if (a.name.startsWith(cat + "_")) m.clipAction(a).play();
        return m;
      });
      let state: "strum" | "day" | "bed" | "desk" = "strum", now: T.AnimationAction = strum, inState = 0, queued = false, resume = 0;
      const go = (next: typeof state, to: T.AnimationAction, fadeS: number, at = 0) => {
        to.reset().play(); to.time = at; to.crossFadeFrom(now, fadeS, false);
        state = next; now = to; inState = 0;
      };
      strum.play();

      const bone = (n: string) => char.getObjectByName(n)!;
      const hips = bone("DEF-spineseg0"), head = bone("DEF-spine006"), feet = [bone("DEF-footL"), bone("DEF-footR")];
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
      pulseOn.unshift(bone("DEF-spine003seg0"), bone("Siamese_Head"), bone("Burmese_Body")); // her first, then the cats, then the monitor

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

      // Her note: "click me", following her head while she's on the bed or at the desk, hidden while she walks.
      // After her first hello it says so.
      const herNote = el.querySelector<HTMLElement>("[data-her]")!, herArrow = el.querySelector<SVGPathElement>('[data-arrow="her"]')!, hv = new THREE.Vector3();
      const greet = () => { herNote.firstElementChild!.textContent = "hi again!"; };
      placeHer = () => {
        const t = day.time, still = state !== "day" || t < 47 * F || t > 540 * F || (t >= 232 * F && t <= 446 * F);
        const v = head.getWorldPosition(hv).project(camera), wanted = roomPtr || performance.now() / 1000 < tapUntil;
        const show = wanted && fade === 1 && still && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95;
        herNote.toggleAttribute("data-show", show); herArrow.toggleAttribute("data-show", show);
        if (!show && !herNote.hasAttribute("data-was")) return; // never placed yet: nothing to fade out
        herNote.setAttribute("data-was", "");
        const W = el.clientWidth, H = el.clientHeight, tx = ((v.x + 1) / 2) * W, ty = ((1 - v.y) / 2) * H - 0.03 * H; // to the top of her head
        pin(herNote, herArrow, tx + (tx < 0.55 * W ? 0.14 : -0.13) * W, Math.max(0.06 * H, ty - 0.16 * H), tx, ty); // away from the hanger
      };

      if (reduce) { // a still: her first strum, the cats at rest; a click shows the wave for 2 s
        herMix.update(0); for (const m of cats) m.update(0); draw();
        let wave = 0;
        poke = () => {
          if (wave) return;
          strum.stop(); bed.reset().play(); bed.time = 1.25; herMix.update(0); draw();
          wave = window.setTimeout(() => { wave = 0; bed.stop(); strum.play(); herMix.update(0); greet(); draw(); placeNotes(live.current.hot ?? pointer); }, 2000);
        };
        dropHer = () => { clearTimeout(wave); herMix.stopAllAction(); herMix.uncacheRoot(char); for (const m of cats) { m.stopAllAction(); m.uncacheRoot(char); } };
      } else {
        poke = () => { if (state !== "bed" && state !== "desk") queued = true; };
        tickHer = (dt) => {
          if (fade < 1) {
            setFade(fade = Math.min(1, fade + dt / 0.4));
            if (fade === 1) for (const [mt, [tr]] of mats) { mt.transparent = tr; mt.needsUpdate = true; }
          }
          const prev = day.time;
          herMix.update(dt); for (const m of cats) m.update(dt);
          inState += dt;
          const t = day.time;
          if (state === "strum" && inState >= 3 * strum.getClip().duration) go("day", day, 0.25);
          else if (state === "day" && t < prev) go("strum", strum, 0.25); // ToDesk wrapped: she's back on the bed
          else if (state === "bed" && bed.paused) { go("strum", strum, 0.25); greet(); }
          else if (state === "desk" && desk.paused) { go("day", day, 0.25, resume); hold.fadeOut(0.25); greet(); } // back where she left off
          if (!queued) return;
          // A click waits for the next place she can react: on the bed, or seated at the desk (232-446), at once.
          // ReactDesk is keyed on ToDesk 330; from any other seated moment the crossfade carries her into it and back.
          if (state === "strum" || (state === "day" && (t < 47 * F || t > 540 * F))) { queued = false; go("bed", bed, 0.15); }
          else if (state === "day" && t >= 232 * F && t <= 446 * F) {
            queued = false; resume = t; go("desk", desk, 0.25);
            hold.reset().play(); hold.time = t; hold.paused = true; hold.fadeIn(0.25);
          }
        };
        dropHer = () => { tickHer = null; herMix.stopAllAction(); herMix.uncacheRoot(char); for (const m of cats) { m.stopAllAction(); m.uncacheRoot(char); } };
      }
      const drop = dropHer;
      dropHer = () => { drop(); scene.remove(char); free(char); key.shadow.dispose(); lamp.dispose(); };
    });
  };
  void herP.then((c) => {
    if (!c) return herIn(); // the room stands on its own without her
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
    hanger.removeEventListener("pointerenter", onNudge);
    clearTimeout(hintT);
    phoneMesh.material = phoneDark; screenMesh.material = screenDark; ledMesh.material = ledDark; // so the stage's dispose finds the baked ones
    for (const m of [...phoneLit, screenLit, winLit, ledLit, black]) { m.map?.dispose(); m.dispose(); }
    (dust.material as T.Material).dispose(); dustGeo.dispose();
    glowRT.dispose(); bloom.dispose(); add.material.dispose(); add.dispose();
    toy.dispose();
  };
}
