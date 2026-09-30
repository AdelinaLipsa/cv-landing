"use client";
import { useEffect, useRef } from "react";
import type * as T from "three";
import { createBattle, draw, step, W, H } from "@/lib/battle";

// A beige late-90s computer in three.js. The screen is a canvas texture running the pixel battle.
// three.js is only fetched when this scrolls near view, and nothing renders while it's off screen.
export default function RetroComputer({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    let cleanup = () => {};
    let started = false;

    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      cleanup = await mount(el);
    }, { rootMargin: "300px" });
    io.observe(el);

    return () => { io.disconnect(); cleanup(); };
  }, []);

  return <div ref={host} className={className} role="img" aria-label="A beige 90s computer. On its screen, a tiny pixel navi battles a virus on a grid." />;
}

async function mount(el: HTMLElement) {
  const THREE = await import("three");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(3.4, 2.6, 8.2);
  camera.lookAt(0, 1.2, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b6d9, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);

  const beige = new THREE.MeshStandardMaterial({ color: 0xdcd3bd, roughness: 0.85 });
  const beigeDark = new THREE.MeshStandardMaterial({ color: 0xc4b99f, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2760, roughness: 0.6 });
  const box = (w: number, h: number, d: number, m: T.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    return mesh;
  };

  const pc = new THREE.Group();
  // Desktop case, floppy slot, LED
  pc.add(box(3, 0.6, 2.4, beige, 0, 0.3, 0));
  pc.add(box(0.9, 0.05, 0.02, dark, 0.7, 0.36, 1.21));
  pc.add(box(0.08, 0.05, 0.02, new THREE.MeshBasicMaterial({ color: 0xf5b53f }), -1.2, 0.3, 1.21));
  // Monitor: body, bezel, back hump
  pc.add(box(2.4, 2, 1.6, beige, 0, 1.65, -0.2));
  pc.add(box(1.9, 1.5, 1.2, beigeDark, 0, 1.7, -0.9));
  pc.add(box(2.1, 1.7, 0.06, beigeDark, 0, 1.7, 0.62));

  // Screen: canvas texture with nearest filtering for crisp pixels
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const battle = createBattle();
  draw(ctx, battle);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.53), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, 1.72, 0.66);
  pc.add(screen);

  // Keyboard with instanced keys
  const kb = new THREE.Group();
  kb.add(box(2.6, 0.12, 0.9, beige));
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.06, 0.13), beigeDark, 15 * 4);
  const m = new THREE.Matrix4();
  let i = 0;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) keys.setMatrixAt(i++, m.makeTranslation(-1.12 + c * 0.16, 0.08, -0.3 + r * 0.19));
  kb.add(keys);
  kb.position.set(0, 0.07, 2.1);
  kb.rotation.x = 0.06;
  pc.add(kb);

  pc.position.y = -0.2;
  scene.add(pc);

  const size = () => {
    const { width, height } = el.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(size);
  ro.observe(el);
  size();

  // Tilt towards the pointer, eased.
  let tx = 0, ty = 0;
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 0.2;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let visible = true;
  const vis = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduce) loop(); });
  vis.observe(el);

  let raf = 0, last = 0, acc = 0;
  const TICK = 1000 / 20; // the battle runs at 20 ticks a second, like an old handheld
  const loop = (now = performance.now()) => {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) return;
    acc += Math.min(now - (last || now), 100);
    last = now;
    let dirty = false;
    while (acc >= TICK) { step(battle); acc -= TICK; dirty = true; }
    if (dirty) { draw(ctx, battle); tex.needsUpdate = true; }
    pc.rotation.y += (-0.35 + tx - pc.rotation.y) * 0.05;
    pc.rotation.x += (ty - pc.rotation.x) * 0.05;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };

  pc.rotation.y = -0.35;
  if (reduce) renderer.render(scene, camera);
  else loop();

  return () => {
    cancelAnimationFrame(raf);
    vis.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => mt.dispose()); }
    });
    tex.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
