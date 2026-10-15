"use client";
import { useEffect, useRef } from "react";
import type { Drawer } from "@/lib/partsCabinet";
import { layers } from "@/content/skills";
import s from "./PartsCabinet.module.css";

type Props = {
  className?: string;
  state: Drawer[]; // from drawers(layers, cur.used, all)
  used: readonly string[]; // the picked role's chips, to colour the parts
  nudge: number | null; // the layer index of a hovered chip: pop that drawer out a little
  onHover: (layer: number | null) => void; // pointer over a drawer
};

// A beige parts cabinet with a labelled see-through drawer per skill group. Picking a role slides out
// the drawers it used, with that role's parts in amber. Same plastic and stage as the other toys;
// three.js only loads when this scrolls near view.
export default function PartsCabinet({ className, state, used, nudge, onHover }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<Props>({ state, used, nudge, onHover });
  live.current = { state, used, nudge, onHover };

  useEffect(() => {
    const el = host.current!;
    let cleanup = () => {}, started = false, dead = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      const c = await mount(el, live, () => !dead);
      if (dead) c(); else cleanup = c; // unmounted while it loaded: tidy up straight away
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => { dead = true; io.disconnect(); cleanup(); };
  }, []);

  return <div ref={host} className={`${s.host} ${className ?? ""}`} role="img" aria-label="A beige parts cabinet with a labelled drawer for each skill group. Picking a role slides out the drawers it used." />;
}

async function mount(el: HTMLElement, live: React.RefObject<Props>, alive: () => boolean) {
  const { toyStage } = await import("@/lib/toyStage");
  const toy = await toyStage(el);
  if (!alive()) { toy.dispose(); return () => {}; } // gone before the stage was ready: build nothing
  const { THREE, scene, camera, plastic, box, blob, reduce, touch } = toy;
  const beige = plastic(0xcdbb94, 0.45), beigeDark = plastic(0xb3a27c, 0.55);
  // Smoky see-through drawers, like the real ones. Phones get plain opacity: transmission costs a render pass.
  const smoke = touch
    ? new THREE.MeshPhysicalMaterial({ color: 0xd8d2c2, roughness: 0.3, transparent: true, opacity: 0.55 })
    : new THREE.MeshPhysicalMaterial({ color: 0xe8e2d2, roughness: 0.25, transmission: 0.7, thickness: 0.05, clearcoat: 0.5 });

  const W = 3.2, H = 3.0, D = 1.2, ROWS = 4, rowH = H / ROWS;
  const cab = new THREE.Group();
  cab.add(box(W + 0.12, 0.1, D, beige, 0, H + 0.05, 0));   // top
  cab.add(box(W + 0.12, 0.1, D, beige, 0, 0.05, 0));       // base
  cab.add(box(0.06, H, D, beige, -W / 2, H / 2, 0));       // sides
  cab.add(box(0.06, H, D, beige, W / 2, H / 2, 0));
  cab.add(box(W, H, 0.04, beigeDark, 0, H / 2, -D / 2));   // back
  for (let r = 1; r < ROWS; r++) cab.add(box(W, 0.04, D, beige, 0, H - r * rowH, 0)); // shelves
  cab.add(box(0.04, rowH * 3, D, beige, 0, (rowH * 3) / 2, 0)); // middle divider, rows 1–3
  cab.add(blob(2.2));
  scene.add(cab);

  // A label-maker strip: navy tape, raised white capitals.
  const tape = (text: string) => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 64;
    const x = c.getContext("2d")!;
    x.fillStyle = "#2a2760"; x.fillRect(0, 0, 512, 64);
    x.font = "bold 34px monospace"; x.textBaseline = "middle"; x.textAlign = "center";
    x.fillStyle = "rgba(0,0,0,0.35)"; x.fillText(text.toUpperCase(), 257, 34); // the emboss shadow
    x.fillStyle = "#f7f6fb"; x.fillText(text.toUpperCase(), 256, 32);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  };

  // The drawers, with their parts: tiny resistors, one per chip, amber when the role used it.
  const AMBER = new THREE.Color(0xf5b53f), BEIGE = new THREE.Color(0xcdbb94);
  const part = new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8).rotateZ(Math.PI / 2);
  const first = live.current.state;
  const slots = first.map((d, i) => {
    const w = d.wide ? W - 0.1 : W / 2 - 0.08;
    const x = d.wide ? 0 : (d.col === 0 ? -W / 4 : W / 4);
    const y = H - (d.row + 0.5) * rowH;
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    g.add(box(w, rowH - 0.1, 0.04, smoke, 0, 0, D / 2 - 0.02));             // front
    g.add(box(w, 0.03, D - 0.1, smoke, 0, -rowH / 2 + 0.07, 0));            // floor
    g.add(box(0.03, rowH * 0.5, D - 0.1, smoke, -w / 2 + 0.02, -rowH / 4 + 0.05, 0));
    g.add(box(0.03, rowH * 0.5, D - 0.1, smoke, w / 2 - 0.02, -rowH / 4 + 0.05, 0));
    g.add(box(0.36, 0.06, 0.08, beigeDark, 0, -rowH / 4, D / 2 + 0.03));    // pull
    const label = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.8, 1.4), 0.17), new THREE.MeshStandardMaterial({ map: tape(d.name), roughness: 0.4 }));
    label.position.set(0, rowH / 4 - 0.03, D / 2 + 0.002);
    g.add(label);
    const parts = new THREE.InstancedMesh(part, new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.4 }), d.total);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let k = 0; k < d.total; k++) { // a loose pile: seeded so it's the same pile every time
      const rx = Math.sin(k * 12.9898 + i) * 0.5 + 0.5, rz = Math.sin(k * 78.233 + i) * 0.5 + 0.5;
      e.set(0, rx * Math.PI, 0); q.setFromEuler(e);
      m.compose(new THREE.Vector3((rx - 0.5) * (w - 0.3), -rowH / 2 + 0.12 + (k % 3) * 0.03, (rz - 0.5) * (D - 0.4)), q, new THREE.Vector3(1, 1, 1));
      parts.setMatrixAt(k, m);
      parts.setColorAt(k, BEIGE);
    }
    g.add(parts);
    cab.add(g);
    return { g, parts, open: 0 };
  });

  const chipsOf = layers.map((l) => l.chips as readonly string[]);
  let lastUsed: readonly string[] | null = null;
  const paint = (used: readonly string[]) => {
    slots.forEach((s, i) => { chipsOf[i].forEach((c, k) => s.parts.setColorAt(k, used.includes(c) ? AMBER : BEIGE)); s.parts.instanceColor!.needsUpdate = true; });
  };

  // Pointer over a drawer lights its card.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let over: number | null = null;
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const i = slots.findIndex((s) => ray.intersectObject(s.g, true).length);
    const next = i < 0 ? null : i;
    if (next !== over) { over = next; live.current.onHover(next); }
  };
  const onLeave = () => { if (over !== null) { over = null; live.current.onHover(null); } };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);

  const sphere = new THREE.Box3().setFromObject(cab).getBoundingSphere(new THREE.Sphere());
  toy.fit(sphere, new THREE.Vector3(-1.4, 1.1, 4.2), 0.78);

  const settle = (dt: number) => {
    const { state, used, nudge } = live.current;
    if (used !== lastUsed) { paint(used); lastUsed = used; }
    let moving = false;
    slots.forEach((s, i) => {
      const to = state[i].open * (D * 0.7) + (nudge === i || over === i ? 0.08 : 0);
      s.open = reduce ? to : s.open + (to - s.open) * (1 - Math.exp(-dt * 6));
      if (Math.abs(to - s.open) > 0.001) moving = true;
      s.g.position.z = s.open;
    });
    return moving;
  };
  // Only render while something is sliding (or on the first frame): the cabinet is otherwise still.
  let boot = true;
  toy.run((_, dt) => { const m = settle(dt) || boot; boot = false; return m; });
  // Reduced motion has no loop, so poll for a new role or hover, and redraw only when the target moved.
  let seen = "";
  const still = reduce ? setInterval(() => {
    const { state, nudge } = live.current;
    const key = state.map((d) => d.open).join() + live.current.used.join() + nudge + over;
    if (key === seen) return;
    seen = key; settle(0); toy.renderer.render(scene, camera);
  }, 120) : 0;

  return () => { clearInterval(still); el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); part.dispose(); toy.dispose(); };
}
