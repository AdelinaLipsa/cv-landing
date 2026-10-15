"use client";
import { useEffect, useRef } from "react";
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
const LABEL: Record<Prop, [number, number]> = { phone: [0.1, 0.8], printer: [0.2, 0.08], rolodex: [0.8, 0.08] };
const TARGET: Record<Prop, string> = { phone: "PhoneScreen", printer: "PrinterBodyMesh", rolodex: "Screen" };
const PICK_NODE: Record<Prop, string> = { phone: "Phone", printer: "Printer", rolodex: "Monitor" };

// Her teenage bedroom, baked in Blender (art/README.md), in the hero. One object for each way in: a Nokia for
// Message me, an inkjet for the PDF, her PC monitor for LinkedIn. Hover a button and its object acts; point at
// an object and its button lights. The preview render shows at once; the live room fades in over it.
export default function Finale({ className, hot, onHot, onPick, onScreen }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<Live>({ hot, onHot, onPick, onScreen });
  live.current = { hot, onHot, onPick, onScreen };

  useEffect(() => {
    const el = host.current!;
    let cleanup = () => {}, started = false, dead = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      // It's the hero: let the page paint and settle before three.js and 3 MB of room arrive.
      await new Promise((r) => ("requestIdleCallback" in window ? requestIdleCallback(r, { timeout: 1500 }) : setTimeout(r, 300)));
      if (dead) return;
      const c = await mount(el, live, () => !dead);
      if (dead) c(); else cleanup = c; // unmounted while it loaded: tidy up straight away
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => { dead = true; io.disconnect(); cleanup(); };
  }, []);

  return (
    <div ref={host} className={`${s.host} ${className ?? ""}`} role="img" aria-label="My teenage bedroom at dusk: rock posters, a window, my guitars, a skateboard, boxing gloves, a corner desk with my PC, a Nokia phone, an inkjet printer, a bed with bookshelves, and my two cats. I'm in it too, sitting on the bed playing guitar and now and then getting up to work at the desk: click me to say hi, or pet a cat. The phone messages me, the printer prints my CV, and the computer boots Windows 95. Pinch or double-click to zoom in.">
      <svg className={s.arrows} aria-hidden="true">{NOTES.map(([p]) => <path key={p} data-arrow={p} />)}</svg>
      {NOTES.map(([p, text]) => <span key={p} className={s.note} data-note={p} aria-hidden="true"><span>{text}</span></span>)}
      <span className={s.hint} data-hint aria-hidden="true"><span>pinch or double-click to zoom</span></span>
      <button type="button" className={s.reset} data-reset aria-label="Zoom the room back out"><span>zoom out</span></button>
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

async function mount(el: HTMLElement, live: React.RefObject<Live>, alive: () => boolean) {
  const { toyStage } = await import("@/lib/toyStage");
  const toy: Toy = await toyStage(el);
  if (!alive()) { toy.dispose(); return () => {}; } // gone before the stage was ready: build nothing
  const { THREE, renderer, scene, camera, reduce, touch } = toy;
  const [{ GLTFLoader }, { MeshoptDecoder }, { UnrealBloomPass }, { FullScreenQuad }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
    import("three/examples/jsm/postprocessing/Pass.js"),
  ]);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const g = await loader.loadAsync("/models/room.glb").catch(() => null);
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


  // A stack of books on the floor at the front corner reads as a stray red box below the room: drop its triangles.
  const books = node("Room_PropsMesh") as T.Mesh, ix = books.geometry.index!, pp = books.geometry.getAttribute("position"), w = new THREE.Vector3();
  const front = (i: number) => (w.fromBufferAttribute(pp, i).applyMatrix4(books.matrixWorld), w.x > 1 && w.z > 1);
  const kept: number[] = [];
  for (let t = 0; t < ix.count; t += 3) if (![0, 1, 2].some((k) => front(ix.getX(t + k)))) kept.push(ix.getX(t), ix.getX(t + 1), ix.getX(t + 2));
  books.geometry.setIndex(kept);

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
  const onMove = (e: PointerEvent) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) { // pinch: zoom by the spread, about the midpoint
      const [[ax, ay], [bx, by]] = [...touches.values()], d = Math.hypot(ax - bx, ay - by);
      if (pinch) zoomAt(want.z * (d / pinch), (ax + bx) / 2, (ay + by) / 2);
      pinch = d; return;
    }
    if (drag && want.z > 1.01) { panBy(e.clientX - drag[0], e.clientY - drag[1]); drag = [e.clientX, e.clientY]; }
    const h = hit(e), p = h === "phone" || h === "printer" ? h : null; // pointing at the computer lights nothing: it's Win95
    el.style.cursor = h ? "pointer" : want.z > 1.01 ? (drag ? "grabbing" : "grab") : "";
    if (p !== pointer) { pointer = p; live.current.onHot(p); }
  };
  const onLeave = () => { if (pointer) { pointer = null; live.current.onHot(null); } };
  // Her computer, monitor or tower, always boots Win95; LinkedIn opens only from its own button.
  // A click is a left press and release on the same object without dragging: right-clicks and drags do nothing.
  let down: { h: ReturnType<typeof hit>; x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size > 1 || want.z > 1.01) e.stopPropagation(); // a pinch or a pan is the room's, not a swipe to the next page
    if (touches.size > 1) { down = drag = null; pinch = 0; return; } // a pinch is never a click
    down = e.button === 0 ? { h: hit(e), x: e.clientX, y: e.clientY } : null;
    if (down && want.z > 1.01) { drag = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId); }
  };
  const onCancel = (e: PointerEvent) => { touches.delete(e.pointerId); pinch = 0; drag = down = null; };
  const onUp = (e: PointerEvent) => {
    const d = down;
    onCancel(e);
    const h = hit(e);
    if (!d || d.h !== h || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return; // a drag or pan never clicks
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
  const placeNotes = (hot: Prop | null = null) => {
    const W = el.clientWidth, H = el.clientHeight;
    el.toggleAttribute("data-any", !!hot);
    for (const nd of notes) {
      const p = nd.dataset.note as Prop, v = anchors[p].getWorldPosition(at).project(camera);
      // Zoomed past it; and the monitor's LinkedIn note only while the LinkedIn button is hovered (a click on it is Win95)
      const off = Math.abs(v.x) > 1 || Math.abs(v.y) > 1 || (p === "rolodex" && hot !== "rolodex");
      nd.toggleAttribute("data-off", off); arrows[p].toggleAttribute("data-off", off);
      const tx = ((v.x + 1) / 2) * W, ty = ((1 - v.y) / 2) * H, lx = LABEL[p][0] * W, ly = LABEL[p][1] * H;
      nd.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -50%)`;
      const dx = tx - lx, dy = ty - ly, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      const sx = lx + ux * Math.min(56, d / 3), sy = ly + uy * 18, ex = tx - ux * 5, ey = ty - uy * 5; // leave the text, stop short of the tip
      const cx = (sx + ex) / 2 - uy * d * 0.18, cy = (sy + ey) / 2 + ux * d * 0.18; // a hand-drawn bow
      const ax = ex - cx, ay = ey - cy, al = Math.hypot(ax, ay) || 1, hx = (ax / al) * 10, hy = (ay / al) * 10; // the head follows the curve's end
      const head = (a: number) => `${ex - hx * Math.cos(a) + hy * Math.sin(a)} ${ey - hy * Math.cos(a) - hx * Math.sin(a)}`;
      arrows[p].setAttribute("d", `M${sx} ${sy}Q${cx} ${cy} ${ex} ${ey}M${head(0.5)}L${ex} ${ey}L${head(-0.5)}`);
      nd.toggleAttribute("data-hot", p === hot); arrows[p].toggleAttribute("data-hot", p === hot);
      nd.dataset.placed = "";
    }
  };

  const pose = (t: number, hot: Prop | null) => {
    // Phone: buzzes in bursts, 0.4 s on, 0.3 s off, with the message coming up after the first burst.
    const buzz = reduce ? 0 : heat.phone * ((t - since) % 0.7 < 0.4 ? 1 : 0);
    phone.position.set(phoneRest.p.x + Math.sin(t * 95) * 0.0025 * buzz, phoneRest.p.y, phoneRest.p.z + Math.cos(t * 83) * 0.0025 * buzz);
    phone.rotation.y = phoneRest.r + Math.sin(t * 70) * 0.04 * buzz;
    phoneMesh.material = hot === "phone" ? phoneLit[reduce || t - since > 0.9 ? 1 : 0] : phoneDark;
    screenMesh.material = hot === "rolodex" ? screenLit : screenDark;
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
      const glows = m.layers.isEnabled(BLOOM) || (m === screenMesh && m.material !== screenDark) || (m === phoneMesh && m.material !== phoneDark);
      if (!glows) { keep.set(m, m.material); m.material = black; }
    }
    shaft.visible = dust.visible = false;
    for (const m of [...phoneLit, screenLit]) m.color.setScalar(0.1); // a lit screen only haloes; full strength it bleaches to white
    renderer.getClearColor(clear); const alpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.needsUpdate = true; // once a frame, not once per pass
    renderer.setRenderTarget(glowRT); renderer.clear(); renderer.render(scene, camera);
    bloom.render(renderer, null as unknown as T.WebGLRenderTarget, glowRT, 0, false);
    renderer.setRenderTarget(null); renderer.setClearColor(clear, alpha);
    for (const [m, mt] of keep) m.material = mt;
    keep.clear();
    shaft.visible = dust.visible = true;
    for (const m of [...phoneLit, screenLit]) m.color.setScalar(1);
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
  const onDbl = (e: MouseEvent) => (want.z > 1.01 ? unzoom() : zoomAt(2, e.clientX, e.clientY));
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
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();
  el.dataset.live = ""; // the canvas fades in over the preview

  const ease = (from: number, to: number, dt: number, rate = 7) => from + (to - from) * (1 - Math.exp(-dt * rate));
  toy.run((t, dt) => {
    const hot = live.current.hot ?? pointer;
    if (hot !== wasHot) { since = t; wasHot = hot; }
    for (const p of Object.keys(heat) as Prop[]) heat[p] = ease(heat[p], p === hot ? 1 : 0, dt, p === "printer" ? 2.5 : 7);
    glow.uTime.value = t;
    pose(t, hot);
    tickHer?.(dt);
    if (zoom.z !== want.z || zoom.x !== want.x || zoom.y !== want.y) { // ~150 ms ease
      for (const k of ["z", "x", "y"] as const) zoom[k] = Math.abs(want[k] - zoom[k]) < 1e-4 ? want[k] : ease(zoom[k], want[k], dt, 20);
      lens();
    }
    draw();
    placeNotes(hot);
    return false; // drawn above, with the bloom
  });
  // Reduced motion: no loop. Redraw a still pose whenever the hot object changes; the screens just light up.
  const still = reduce ? setInterval(() => {
    const hot = live.current.hot ?? pointer;
    if (hot === wasHot) return;
    wasHot = hot;
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
        if (mt.name === "jeans.001") (mt as T.MeshStandardMaterial).color.set("#2f4f8f"); // the export lost the denim colour (its texture); white jeans otherwise
        if (!mats.has(mt)) mats.set(mt, [mt.transparent, mt.opacity]);
      }
    });
    let fade = reduce ? 1 : 0;
    const setFade = (f: number) => { for (const [mt, [, op]] of mats) mt.opacity = op * f; for (const m of catchers) (m.material as T.ShadowMaterial).opacity = 0.4 * f; };
    // Warm the opaque shaders first, so ending the fade doesn't hitch; the faded ones compile while she's invisible.
    void renderer.compileAsync(char, camera, scene).catch(() => {}).then(() => {
      if (!alive()) return free(char);
      if (!reduce) for (const mt of mats.keys()) { mt.transparent = true; mt.needsUpdate = true; }
      setFade(fade);
      scene.add(char);

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
      let state: "strum" | "day" | "bed" | "desk" = "strum", now: T.AnimationAction = strum, inState = 0, queued = false;
      const go = (next: typeof state, to: T.AnimationAction, fadeS: number, at = 0) => {
        to.reset().play(); to.time = at; to.crossFadeFrom(now, fadeS, false);
        state = next; now = to; inState = 0;
      };
      strum.play();

      const bone = (n: string) => char.getObjectByName(n)!;
      const hips = bone("DEF-spineseg0"), head = bone("DEF-spine006"), feet = [bone("DEF-footL"), bone("DEF-footR")];
      const pa = new THREE.Vector3(), pb = new THREE.Vector3();
      const near = (r: T.Ray, a: T.Object3D, b: T.Object3D, rad: number, reach = 0) => {
        a.getWorldPosition(pa); b.getWorldPosition(pb);
        if (reach) pb.addScaledVector(pb.clone().sub(pa).normalize(), reach); // the head bone starts at the neck
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

      if (reduce) { // a still: her first strum, the cats at rest; a click shows the wave for 2 s
        herMix.update(0); for (const m of cats) m.update(0); draw();
        let wave = 0;
        poke = () => {
          if (wave) return;
          strum.stop(); bed.reset().play(); bed.time = 1.25; herMix.update(0); draw();
          wave = window.setTimeout(() => { wave = 0; bed.stop(); strum.play(); herMix.update(0); draw(); }, 2000);
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
          else if (state === "bed" && bed.paused) go("strum", strum, 0.25);
          else if (state === "desk" && desk.paused) { go("day", day, 0.25, 330 * F); hold.fadeOut(0.25); }
          if (!queued) return;
          // A click waits for the next place she can react: on the bed at once, at the desk when ToDesk reaches 330.
          if (state === "strum" || (state === "day" && (t < 47 * F || t > 540 * F))) { queued = false; go("bed", bed, 0.15); }
          else if (state === "day" && prev < 330 * F && t >= 330 * F) {
            queued = false; go("desk", desk, 0.15);
            hold.reset().play(); hold.time = 330 * F; hold.paused = true; hold.fadeIn(0.15);
          }
        };
        dropHer = () => { tickHer = null; herMix.stopAllAction(); herMix.uncacheRoot(char); for (const m of cats) { m.stopAllAction(); m.uncacheRoot(char); } };
      }
      const drop = dropHer;
      dropHer = () => { drop(); scene.remove(char); free(char); key.shadow.dispose(); lamp.dispose(); };
    });
  };
  void loader.loadAsync("/models/character.glb").catch(() => null).then((c) => {
    if (!c) return; // the room stands on its own without her
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
    clearTimeout(hintT);
    phoneMesh.material = phoneDark; screenMesh.material = screenDark; // so the stage's dispose finds the baked ones
    for (const m of [...phoneLit, screenLit, black]) { m.map?.dispose(); m.dispose(); }
    (dust.material as T.Material).dispose(); dustGeo.dispose();
    glowRT.dispose(); bloom.dispose(); add.material.dispose(); add.dispose();
    toy.dispose();
  };
}
