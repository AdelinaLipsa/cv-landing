"use client";
import { useEffect, useRef } from "react";
import type * as T from "three";
import type { Toy } from "@/lib/toyStage";
import { profile } from "@/content/cv";
import s from "./Finale.module.css";
import n from "./RetroComputer.module.css"; // the hand-drawn notes, same look as Off duty

export type Prop = "phone" | "printer" | "rolodex";
type Props = { className?: string; hot: Prop | null; onHot: (p: Prop | null) => void; onPick: (p: Prop) => void };
type Live = { hot: Prop | null; onHot: Props["onHot"]; onPick: Props["onPick"] };

const NOTES: [Prop, string][] = [["phone", "ring me"], ["printer", "print me out"], ["rolodex", "my card"]];

// The end of the page: the desk where you reach her. One 90s object for each way in: a phone for
// Message me, a dot-matrix printer for the PDF, a Rolodex for LinkedIn. Hover a button and its object
// acts; point at an object and its button lights. Same room, same plastic as the computer in Off duty.
export default function Finale({ className, hot, onHot, onPick }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<Live>({ hot, onHot, onPick });
  live.current = { hot, onHot, onPick };

  useEffect(() => {
    const el = host.current!;
    let cleanup = () => {}, started = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      cleanup = await mount(el, live);
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => { io.disconnect(); cleanup(); };
  }, []);

  return (
    <div ref={host} className={`${s.host} ${className ?? ""}`} role="img" aria-label="Her room back then, like a dollhouse: rock posters on the wall, a window with a plant, a chair on a rug, and a desk with a beige 90s phone, a dot-matrix printer with the oiia cat on it, and a Rolodex. Each one goes with a contact button.">
      {NOTES.map(([p, text]) => (
        <span key={p} className={`${n.note} ${p === "phone" ? s.flip : ""}`} data-note={p} aria-hidden="true">
          <svg className={n.noteArrow} width="54" height="46" viewBox="0 0 54 46" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M50 6C32 6 16 18 10 38" /><path d="M18 33l-8 7-4-10" /></svg>
          <span className={n.noteText}>{text}</span>
        </span>
      ))}
    </div>
  );
}

async function mount(el: HTMLElement, live: React.RefObject<Live>) {
  const { toyStage } = await import("@/lib/toyStage");
  const toy: Toy = await toyStage(el);
  const { THREE, scene, camera, plastic, box, blob, reduce } = toy;
  const beige = plastic(0xcdbb94, 0.45), beigeDark = plastic(0xb3a27c, 0.55), ink = plastic(0x2a2760, 0.4);

  // Her room back then, as a dollhouse: a floor slab and two thick walls with their cut edges showing.
  // Daylight from the stage's studio light; the lamp is a warm accent. Back wall: z = -RD/2. Left wall: x = -RW/2.
  const RW = 7.6, RD = 5.6, RH = 4.6, T = 0.25, DESK = 1.25; // room width, depth, wall height, slab thickness, desktop height
  const room = new THREE.Group();
  scene.add(room);
  const wall = new THREE.MeshStandardMaterial({ color: 0xf4f2f7, roughness: 0.95 });
  const cut = new THREE.MeshStandardMaterial({ color: 0xe3e0ea, roughness: 0.95 }); // the cut tops, a shade darker so the edges read
  const wood = plastic(0x9a7553, 0.6);
  room.add(box(RW + T, T, RD + T, plastic(0xd9c3a0, 0.7), T / 2, -T / 2, T / 2));   // floor slab
  room.add(box(RW + T, RH, T, wall, T / 2, RH / 2, -RD / 2));                        // back wall
  room.add(box(T, RH, RD + T, wall, -RW / 2, RH / 2, T / 2));                        // left wall
  room.add(box(RW + T, 0.012, T, cut, T / 2, RH + 0.006, -RD / 2));                  // cut edges on top
  room.add(box(T, 0.012, RD + T, cut, -RW / 2, RH + 0.006, T / 2));

  // The window, at the right end of the back wall: a daytime sky, a white frame, a plant on the sill.
  const sky = document.createElement("canvas");
  sky.width = sky.height = 128;
  const k = sky.getContext("2d")!;
  const day = k.createLinearGradient(0, 0, 0, 128);
  day.addColorStop(0, "#bfd3ff"); day.addColorStop(1, "#e8eeff");
  k.fillStyle = day; k.fillRect(0, 0, 128, 128);
  k.fillStyle = "rgba(255,255,255,0.9)"; for (const [x, y, r] of [[30, 40, 12], [44, 36, 15], [58, 42, 11], [92, 78, 10], [104, 74, 13]]) { k.beginPath(); k.arc(x, y, r, 0, 7); k.fill(); } // clouds
  const skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace;
  const win = new THREE.Group();
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), new THREE.MeshBasicMaterial({ map: skyTex })));
  for (const [w, h, x, y] of [[2.06, 0.08, 0, 0.79], [2.06, 0.08, 0, -0.79], [0.08, 1.66, 1.0, 0], [0.08, 1.66, -1.0, 0], [0.05, 1.5, 0, 0]]) win.add(box(w, h, 0.1, plastic(0xffffff, 0.5), x, y, 0.03));
  win.add(box(2.2, 0.07, 0.32, plastic(0xffffff, 0.5), 0, -0.84, 0.14)); // the sill
  win.position.set(2.3, 2.6, -RD / 2 + T / 2 + 0.01);
  room.add(win);
  const plant = new THREE.Group();
  plant.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 16), plastic(0xd9764a, 0.6))); // terracotta pot
  const leaf = new THREE.MeshStandardMaterial({ color: 0x3f8f5a, roughness: 0.6, side: THREE.DoubleSide });
  const leaves: T.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6).scale(0.45, 1.2, 0.15), leaf);
    l.position.set(0, 0.32, 0); l.rotation.set(0.5, (i / 7) * Math.PI * 2, 0); l.geometry.translate(0, 0.12, 0);
    plant.add(l); leaves.push(l);
  }
  plant.position.set(2.9, 2.6 - 0.84 + 0.17, -RD / 2 + T / 2 + 0.16);
  room.add(plant);

  // Her teenage walls: gig posters on the left wall, drawn here. No real band logos.
  const gig = (bg: string, ink: string, draw: (x: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas"); c.width = 180; c.height = 256;
    const x = c.getContext("2d")!;
    x.fillStyle = bg; x.fillRect(0, 0, 180, 256);
    x.fillStyle = ink; x.strokeStyle = ink; draw(x);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.35), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
  };
  const posters = [
    gig("#141414", "#e53935", (x) => { x.beginPath(); x.moveTo(104, 20); x.lineTo(56, 130); x.lineTo(92, 130); x.lineTo(70, 236); x.lineTo(130, 108); x.lineTo(94, 108); x.closePath(); x.fill(); }), // lightning bolt
    gig("#c62828", "#141414", (x) => { x.font = "900 34px Impact, sans-serif"; x.textAlign = "center"; x.fillText("LIVE", 90, 60); x.fillText("TONIGHT", 90, 98); x.lineWidth = 6; x.beginPath(); x.ellipse(90, 178, 34, 44, 0, 0, 7); x.stroke(); x.fillRect(86, 96, 8, 60); }), // a guitar body and neck
    gig("#f5f0e1", "#141414", (x) => { x.font = "900 26px Impact, sans-serif"; x.textAlign = "center"; x.fillText("WORLD TOUR", 90, 44); x.font = "15px monospace"; ["BUCHAREST", "LONDON", "BERLIN", "TOKYO", "PARIS", "NEW YORK"].forEach((c, i) => x.fillText(c, 90, 92 + i * 26)); }), // the tour dates list
  ];
  posters.forEach((p, i) => { p.position.set(-RW / 2 + T / 2 + 0.01, 2.75 + (i === 1 ? 0.2 : 0), -2.2 + i * 1.25); p.rotation.y = Math.PI / 2; p.rotation.z = (i - 1) * 0.04; room.add(p); });

  // The desk against the back wall, the chair pulled up to it on a navy rug, and a small desk lamp.
  const DX = -0.6, DZ = -RD / 2 + T / 2 + 1.1; // the desk's centre; it runs from the left wall to under the window
  room.add(box(5.8, 0.12, 2.0, wood, DX, DESK, DZ));
  for (const x of [DX - 2.75, DX + 2.75]) for (const z of [DZ - 0.85, DZ + 0.85]) room.add(box(0.12, DESK, 0.12, wood, x, DESK / 2, z));
  const rug = box(3.2, 0.03, 2.4, new THREE.MeshStandardMaterial({ color: 0x2a2760, roughness: 1 }), DX, 0.015, DZ + 1.9);
  room.add(rug);
  const black = plastic(0x1c1b22, 0.5);
  const chair = new THREE.Group();
  chair.add(box(0.9, 0.12, 0.9, black, 0, 0.95, 0));                     // seat
  chair.add(box(0.9, 1.0, 0.1, black, 0, 1.55, 0.42));                   // back
  chair.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 12), black).translateY(0.5)); // gas lift
  for (let i = 0; i < 5; i++) { const leg = box(0.55, 0.06, 0.08, black, 0, 0.1, 0); leg.geometry.translate(0.27, 0, 0); leg.rotation.y = (i / 5) * Math.PI * 2; chair.add(leg); } // star base
  chair.position.set(DX, 0, DZ + 1.75);
  chair.rotation.y = 0.25;
  room.add(chair);
  room.add(blob(3.4));
  const lamp = new THREE.Group();
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.06, 24), ink));
  const arm = box(0.05, 0.9, 0.05, ink, 0, 0.45, 0); arm.rotation.z = -0.25; lamp.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.3, 24, 1, true), plastic(0xf5b53f, 0.4));
  shade.position.set(0.22, 0.9, 0); shade.rotation.z = 0.6; lamp.add(shade);
  const bulb = new THREE.PointLight(0xffc27a, 2.5, 4, 1.8); // a warm accent; the daylight does the real lighting
  bulb.position.set(0.3, 0.8, 0.05); lamp.add(bulb);
  lamp.position.set(-3.3, DESK + 0.06, DZ - 0.7); // the back-left corner, behind the phone
  room.add(lamp);

  const desk = new THREE.Group();
  desk.position.set(DX, DESK + 0.06, DZ);
  desk.scale.setScalar(0.8); // the three objects, sized to sit on a desk in a room and still read from across it
  scene.add(desk);

  // Phone: a sloped base, a 4x3 keypad, the handset on its cradle, a coiled cord between them.
  const phone = new THREE.Group();
  phone.add(box(1.5, 0.35, 1.1, beige, 0, 0.175, 0));
  const slope = box(1.5, 0.12, 0.7, beigeDark, 0, 0.4, 0.15); slope.rotation.x = -0.25; phone.add(slope);
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.05, 0.12), beige, 12);
  const mx = new THREE.Matrix4();
  for (let i = 0; i < 12; i++) keys.setMatrixAt(i, mx.makeTranslation(-0.2 + (i % 3) * 0.2, 0.47 - Math.floor(i / 3) * 0.035, 0.32 - Math.floor(i / 3) * 0.15));
  phone.add(keys);
  const handset = new THREE.Group();
  handset.add(box(1.4, 0.16, 0.3, beige, 0, 0, 0));
  handset.add(box(0.34, 0.2, 0.36, beige, -0.6, -0.06, 0));
  handset.add(box(0.34, 0.2, 0.36, beige, 0.6, -0.06, 0));
  handset.position.set(0, 0.62, -0.25);
  phone.add(handset);
  // The cord: a helix wrapped along a sagging curve from the base to the handset's end.
  const along = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.75, 0.2, 0.2), new THREE.Vector3(-1.2, 0.05, 0.6), new THREE.Vector3(-1.3, 0.3, -0.2), new THREE.Vector3(-0.75, 0.55, -0.25)]);
  const coil = (wob: number) => {
    const pts: T.Vector3[] = [];
    for (let i = 0; i <= 400; i++) {
      const u = i / 400, p = along.getPointAt(u), a = u * Math.PI * 2 * 26;
      pts.push(p.add(new THREE.Vector3(Math.cos(a) * 0.05, Math.sin(a) * 0.05 + Math.sin(u * 9 + wob) * 0.03 * Math.abs(Math.sin(wob)), 0)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.012, 5);
  };
  const cord = new THREE.Mesh(coil(0), ink);
  phone.add(cord);
  phone.add(blob(1.1));
  phone.position.set(-2.2, 0, 0.2);
  phone.rotation.y = 0.35;
  desk.add(phone);

  // Printer: a dot-matrix body, a dark lid, tractor-feed paper with her name coming out the top.
  const printer = new THREE.Group();
  printer.add(box(2.0, 0.55, 1.3, beige, 0, 0.275, 0));
  printer.add(box(1.7, 0.08, 0.9, beigeDark, 0, 0.59, -0.1));
  printer.add(box(0.12, 0.05, 0.02, new THREE.MeshBasicMaterial({ color: 0x5be37d }), 0.8, 0.35, 0.66)); // power LED
  const sheet = document.createElement("canvas");
  sheet.width = 256; sheet.height = 512;
  const sc = sheet.getContext("2d")!;
  sc.fillStyle = "#fbfaf4"; sc.fillRect(0, 0, 256, 512);
  sc.fillStyle = "#d9d5c8";
  for (let y = 12; y < 512; y += 24) { sc.beginPath(); sc.arc(10, y, 4, 0, 7); sc.arc(246, y, 4, 0, 7); sc.fill(); } // tractor holes
  sc.fillStyle = "#2a2760"; sc.font = "bold 22px monospace"; sc.fillText(profile.name.toUpperCase(), 28, 60);
  sc.font = "15px monospace"; sc.fillText(profile.role, 28, 88);
  for (let y = 130; y < 500; y += 22) { sc.fillStyle = "#b8b4cf"; sc.fillRect(28, y, 120 + ((y * 37) % 80), 6); } // the rest of the CV, as dot-matrix lines
  const paperTex = new THREE.CanvasTexture(sheet);
  paperTex.colorSpace = THREE.SRGBColorSpace;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9, side: THREE.DoubleSide }));
  paper.geometry.translate(0, 0.7, 0); // grow from the bottom edge
  paper.position.set(-0.3, 0.6, -0.2); // left of the cat, so she never hides it
  paper.rotation.x = 0.1; // near upright: leaning back, the camera from above would see it edge-on
  printer.add(paper);
  printer.add(blob(1.3));
  printer.position.set(0, 0, -0.2);
  desk.add(printer);

  // Rolodex: two side wheels, an axle, a ring of cards. Card 0 is hers.
  const rolodex = new THREE.Group();
  for (const side of [-0.56, 0.56]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 32), ink); w.rotation.z = Math.PI / 2; w.position.set(side, 0.65, 0); rolodex.add(w); }
  rolodex.add(box(1.4, 0.12, 0.8, beige, 0, 0.06, 0));
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.18, 12), ink); axle.rotation.z = Math.PI / 2; axle.position.y = 0.65; rolodex.add(axle);
  const ring = new THREE.Group(); ring.position.y = 0.65; rolodex.add(ring);
  const card = (i: number, mine: boolean) => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 128; // the card's 2:1
    const x = c.getContext("2d")!;
    x.fillStyle = mine ? "#fffdf6" : "#f1eee4"; x.fillRect(0, 0, 256, 128);
    x.fillStyle = "#ee6e9f"; x.fillRect(0, 26, 256, 3);
    if (mine) { x.fillStyle = "#17153a"; x.font = "bold 32px sans-serif"; x.fillText(profile.name, 14, 70); x.font = "21px monospace"; x.fillText(profile.linkedinHandle, 14, 104); } // big enough to read at desk scale
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, side: THREE.DoubleSide }));
    m.geometry.translate(0, 0.33, 0); // standing out from the axle, the way a Rolodex fans its cards
    // Card 0 stands straight up, facing front; the rest fan round from 0.9 rad on, leaving the gap
    // a real Rolodex opens at, or the card in front of hers would hide it from a camera above.
    m.rotation.x = i === 0 ? 0 : 0.9 + ((i - 1) / 16) * (Math.PI * 2 - 1.1);
    ring.add(m);
  };
  for (let i = 0; i < 18; i++) card(i, i === 0);
  rolodex.add(blob(0.9));
  rolodex.position.set(2.3, 0, 0.3);
  rolodex.rotation.y = 0.6; // turned to the camera, so her card is read face on
  desk.add(rolodex);

  // The oiia cat, sitting on the printer. It spins once whenever anything acts.
  let cat: T.AnimationAction | null = null, catMixer: T.AnimationMixer | null = null, gone = false;
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import("three/examples/jsm/loaders/GLTFLoader.js"), import("three/examples/jsm/libs/meshopt_decoder.module.js")]);
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/models/oiia-cat.glb", (g) => {
    if (gone) return;
    const b = new THREE.Box3().setFromObject(g.scene), d = b.getSize(new THREE.Vector3()), k = 3.0 / Math.max(d.x, d.y, d.z), c = b.getCenter(new THREE.Vector3());
    g.scene.scale.setScalar(k);
    g.scene.position.set(-c.x * k + 0.6, -b.min.y * k + 0.63, -c.z * k - 0.2);
    g.scene.rotation.y = 0.4;
    printer.add(g.scene);
    if (g.animations[0]) { catMixer = new THREE.AnimationMixer(g.scene); cat = catMixer.clipAction(g.animations[0]); cat.setLoop(THREE.LoopOnce, 1); cat.clampWhenFinished = true; } // hold the last frame: unclamped, she drops to the bind pose
  }, undefined, () => {}); // offline or blocked: the desk just has no cat

  // Framing: the whole room from the open corner, at the reference's 45° dollhouse angle.
  const sphere = new THREE.Box3().setFromObject(room).getBoundingSphere(new THREE.Sphere());
  sphere.center.y -= 0.8; // aim a little low: from above, the floor's front corner is what reaches the frame's edge
  toy.fit(sphere, new THREE.Vector3(3.2, 2.9, 3.6), 0.9);

  const props: Record<Prop, T.Object3D> = { phone, printer, rolodex };
  const heat: Record<Prop, number> = { phone: 0, printer: 0, rolodex: 0 };
  let wasHot: Prop | null = null, pointer: Prop | null = null;

  // Which object is under the pointer.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const hit = (e: PointerEvent): Prop | null => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const p of Object.keys(props) as Prop[]) if (ray.intersectObject(props[p], true).length) return p;
    return null;
  };
  const onMove = (e: PointerEvent) => {
    const p = hit(e);
    el.style.cursor = p ? "pointer" : "";
    if (p !== pointer) { pointer = p; live.current.onHot(p); }
  };
  const onLeave = () => { if (pointer) { pointer = null; live.current.onHot(null); } };
  // Touch has no hover: a tap acts straight away.
  const onUp = (e: PointerEvent) => { const p = hit(e); if (p) live.current.onPick(p); };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  el.addEventListener("pointerup", onUp);

  // Where each note's arrow points, in the desk's space.
  const anchors: Record<Prop, T.Vector3> = { phone: new THREE.Vector3(-2.2, 0.9, 0.2), printer: new THREE.Vector3(-0.4, 0.65, -0.5), rolodex: new THREE.Vector3(2.3, 0.75, 0.5) };
  const notes = [...el.querySelectorAll<HTMLElement>("[data-note]")];
  const placeNotes = () => {
    for (const node of notes) {
      const v = desk.localToWorld(anchors[node.dataset.note as Prop].clone()).project(camera); // anchors are in the desk's space
      const x = ((v.x + 1) / 2) * el.clientWidth, y = ((1 - v.y) / 2) * el.clientHeight;
      const flip = node.dataset.note === "phone"; // text up-left: up-right it would run into the printer's
      node.style.transform = `translate(${x}px, ${y}px) translate(${flip ? "calc(-100% + 6px)" : "-6px"}, -100%)`; // arrow tip on the spot
      node.dataset.placed = "";
    }
  };

  const pose = (t: number) => {
    leaves.forEach((l, i) => { l.rotation.x = 0.5 + Math.sin(t * 1.3 + i) * 0.05; }); // the plant, breathing
    // Phone: the handset rattles, the cord wobbles with it.
    handset.position.y = 0.62 + Math.abs(Math.sin(t * 38)) * 0.05 * heat.phone;
    handset.rotation.z = Math.sin(t * 38) * 0.06 * heat.phone;
    if (heat.phone > 0.01) { cord.geometry.dispose(); cord.geometry = coil(t * 14); }
    // Printer: paper feeds out; the line count follows how far it's out.
    paper.scale.y = 0.15 + heat.printer * 0.85;
    paperTex.repeat.y = paper.scale.y; paperTex.offset.y = 1 - paper.scale.y; // only the top of the sheet is out, unsquashed
    paper.position.y = 0.6 + Math.sin(t * 60) * 0.004 * heat.printer; // the print head's buzz
    // Rolodex: idle rock; hot, one full flip through the cards that lands on hers (card 0 faces front at 0).
    ring.rotation.x = (1 - heat.rolodex) * (Math.PI * 2 + Math.sin(t * 0.6) * 0.08);
  };

  const ease = (from: number, to: number, dt: number, rate = 7) => from + (to - from) * (1 - Math.exp(-dt * rate));
  toy.run((t, dt) => {
    const hot = live.current.hot ?? pointer;
    if (hot !== wasHot) { if (hot) cat?.reset().play(); wasHot = hot; }
    for (const p of Object.keys(heat) as Prop[]) heat[p] = reduce ? (p === hot ? 1 : 0) : ease(heat[p], p === hot ? 1 : 0, dt);
    catMixer?.update(dt);
    pose(t);
    placeNotes();
  });
  // Reduced motion: re-render a still pose whenever the hot object changes.
  const still = reduce ? setInterval(() => {
    const hot = live.current.hot ?? pointer;
    if (hot === wasHot) return;
    wasHot = hot;
    for (const p of Object.keys(heat) as Prop[]) heat[p] = p === hot ? 1 : 0;
    pose(0); toy.renderer.render(scene, camera); placeNotes();
  }, 100) : 0;
  placeNotes();

  return () => {
    gone = true;
    clearInterval(still);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    el.removeEventListener("pointerup", onUp);
    catMixer?.stopAllAction();
    toy.dispose();
  };
}
