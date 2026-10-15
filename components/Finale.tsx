"use client";
import { useEffect, useRef } from "react";
import type * as T from "three";
import type { Toy } from "@/lib/toyStage";
import { profile } from "@/content/cv";
import s from "./Finale.module.css";

export type Prop = "phone" | "printer" | "rolodex";
type Props = { className?: string; hot: Prop | null; onHot: (p: Prop | null) => void; onPick: (p: Prop) => void; onScreen?: () => void };
type Live = { hot: Prop | null; onHot: Props["onHot"]; onPick: Props["onPick"]; onScreen?: () => void };

const NOTES: [Prop, string][] = [["phone", "text me"], ["printer", "print me out"], ["rolodex", "my LinkedIn"]];
// Each note's text sits in open page space just off the room's silhouette (as a fraction of the canvas, for the
// fixed camera), and its arrow is redrawn every frame to land on the object itself. "rolodex" is her PC monitor
// now; the Prop name stays for the wiring.
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
    <div ref={host} className={`${s.host} ${className ?? ""}`} role="img" aria-label="My teenage bedroom at dusk: rock posters, a window, my guitars, a skateboard, boxing gloves, a corner desk with my PC, a Nokia phone, an inkjet printer, a bed with bookshelves, and two cats. The phone messages me, the printer prints my CV, and the monitor shows my LinkedIn.">
      <svg className={s.arrows} aria-hidden="true">{NOTES.map(([p]) => <path key={p} data-arrow={p} />)}</svg>
      {NOTES.map(([p, text]) => <span key={p} className={s.note} data-note={p} aria-hidden="true"><span>{text}</span></span>)}
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
  const g = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync("/models/room.glb").catch(() => null);
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

  // The camera Blender rendered from, with its vertical FOV. Narrower than the render, the FOV widens so the
  // whole room stays in frame.
  const view = node("View") as T.PerspectiveCamera;
  view.matrixWorld.decompose(camera.position, camera.quaternion, camera.scale);
  camera.near = view.near; camera.far = view.far;
  const FOV = view.fov, ASPECT = view.aspect || 1.25, AIR = 1.18; // AIR: Blender's frame is tight on the walls; pull back so no corner touches the edge

  // A stack of books on the floor at the front corner reads as a stray red box below the room: drop its triangles.
  const books = node("Room_PropsMesh") as T.Mesh, ix = books.geometry.index!, pp = books.geometry.getAttribute("position"), w = new THREE.Vector3();
  const front = (i: number) => (w.fromBufferAttribute(pp, i).applyMatrix4(books.matrixWorld), w.x > 1 && w.z > 1);
  const kept: number[] = [];
  for (let t = 0; t < ix.count; t += 3) if (![0, 1, 2].some((k) => front(ix.getX(t + k)))) kept.push(ix.getX(t), ix.getX(t + 1), ix.getX(t + 2));
  books.geometry.setIndex(kept);

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
  const hit = (e: PointerEvent): Prop | "tower" | null => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const p of Object.keys(picks) as Prop[]) if (ray.intersectObject(picks[p], true).length) return p;
    return ray.intersectObject(tower, true).length ? "tower" : null;
  };
  const onMove = (e: PointerEvent) => {
    const h = hit(e), p = h === "tower" ? null : h;
    el.style.cursor = h ? "pointer" : "";
    if (p !== pointer) { pointer = p; live.current.onHot(p); }
  };
  const onLeave = () => { if (pointer) { pointer = null; live.current.onHot(null); } };
  // The tower's power button boots Win95. So does a tap on the monitor when nothing is lit (touch has no hover);
  // with its LinkedIn card up, the monitor does what the LinkedIn button does.
  const onUp = (e: PointerEvent) => {
    const h = hit(e);
    if (h === "tower" || (h === "rolodex" && !live.current.hot)) live.current.onScreen?.();
    else if (h) live.current.onPick(h);
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  el.addEventListener("pointerup", onUp);

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

  const resize = () => {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV) / 2) * AIR * Math.max(1, ASPECT / camera.aspect)));
    camera.updateProjectionMatrix();
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

  return () => {
    clearInterval(still);
    ro.disconnect();
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    el.removeEventListener("pointerup", onUp);
    phoneMesh.material = phoneDark; screenMesh.material = screenDark; // so the stage's dispose finds the baked ones
    for (const m of [...phoneLit, screenLit, black]) { m.map?.dispose(); m.dispose(); }
    (dust.material as T.Material).dispose(); dustGeo.dispose();
    glowRT.dispose(); bloom.dispose(); add.material.dispose(); add.dispose();
    toy.dispose();
  };
}
