"use client";
import { useEffect, useRef } from "react";
import type * as T from "three";
import { createBattle, draw, step, W, H } from "@/lib/battle";

// A beige late-90s computer in three.js. The screen is a canvas texture running the pixel battle.
// three.js is only fetched when this scrolls near view, and nothing renders while it's off screen.
export default function RetroComputer({ className, character = false }: { className?: string; character?: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    let cleanup = () => {};
    let started = false;

    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      cleanup = await mount(el, character);
    }, { rootMargin: "300px" });
    io.observe(el);

    return () => { io.disconnect(); cleanup(); };
  }, []);

  return <div ref={host} className={className} role="img" aria-label="A kid runs home from school to a beige 90s computer. It switches on, and a tiny pixel navi battles a virus on a grid." />;
}

async function mount(el: HTMLElement, character: boolean) {
  const [THREE, { RoomEnvironment }] = await Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const VIEW = new THREE.Vector3(3.4, 2.6, 8.2).normalize(); // the 3/4 angle we look from

  // Reflections: a soft studio environment for the plastic and glass to catch.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b6d9, 0.5));
  const key = new THREE.DirectionalLight(0xfff4e0, 1.8);
  key.position.set(4, 6, 5);
  scene.add(key);

  // 90s plastic: satin, not matte. A fine moulded grain drives bump and roughness.
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainCanvas.height = 128;
  const g = grainCanvas.getContext("2d")!;
  const img = g.createImageData(128, 128);
  for (let p = 0; p < img.data.length; p += 4) {
    const v = 150 + Math.random() * 70;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
    img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const grain = new THREE.CanvasTexture(grainCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(6, 6);

  const plastic = (color: number, roughness: number) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness,
      roughnessMap: grain,
      bumpMap: grain,
      bumpScale: 0.6,
      clearcoat: 0.35,
      clearcoatRoughness: 0.35,
      sheen: 0.3,
      sheenRoughness: 0.6,
      envMapIntensity: 0.9,
    });
  const beige = plastic(0xcdbb94, 0.45);
  const beigeDark = plastic(0xb3a27c, 0.55);
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x2a2760, roughness: 0.35, clearcoat: 0.6 });
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
  // CRT glass: a thin glossy pane in front of the picture that catches the room.
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.53),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.18, envMapIntensity: 1.6 })
  );
  glass.position.set(0, 1.72, 0.665);
  pc.add(glass);

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

  // The story: a kid runs home from school to this computer. Everything tilts together as one diorama.
  const world = new THREE.Group();
  world.add(pc);
  scene.add(world);
  const FLOOR = -0.2;
  const mat = (color: number, roughness = 0.6) => new THREE.MeshStandardMaterial({ color, roughness });

  // School, small and far back-left.
  const school = new THREE.Group();
  school.add(box(2.4, 1.4, 1.8, mat(0xe6e4f2), 0, 0.7, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.9, 4), mat(0xd66a92, 0.5));
  roof.position.y = 1.85;
  roof.rotation.y = Math.PI / 4;
  school.add(roof);
  school.add(box(0.45, 0.7, 0.05, mat(0x2a2760), 0, 0.35, 0.91));
  for (const x of [-0.75, 0.75]) school.add(box(0.4, 0.35, 0.05, new THREE.MeshBasicMaterial({ color: 0x9db0ff }), x, 0.85, 0.91));
  school.add(box(0.04, 1.1, 0.04, mat(0x6b6990), 1.3, 1.95, 0.6));
  school.add(box(0.4, 0.24, 0.02, mat(0xf5b53f, 0.4), 1.52, 2.35, 0.6));
  school.position.set(-9.8, FLOOR, -4.2);
  school.rotation.y = 0.9;
  world.add(school);

  // The way home: stepping stones along a curve.
  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9.0, FLOOR, -3.3),
    new THREE.Vector3(-6.2, FLOOR, -1.4),
    new THREE.Vector3(-3.1, FLOOR, 1.2),
    new THREE.Vector3(-1.9, FLOOR, 3.2),
    new THREE.Vector3(-0.3, FLOOR, 3.35),
  ]);
  const STONES = 26;
  const stones = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 10), mat(0xdcd9ea, 0.9), STONES);
  for (let s = 0; s < STONES; s++) {
    const p = route.getPointAt(s / (STONES - 1));
    stones.setMatrixAt(s, new THREE.Matrix4().makeTranslation(p.x, FLOOR + 0.02, p.z));
  }
  world.add(stones);

  // The kid: jeans, blue T-shirt, yellow backpack, curly dark hair. About 1.3 units tall.
  const kid = new THREE.Group();
  const limb = (w: number, h: number, m: T.Material, px: number, py: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(px, py, 0);
    pivot.add(box(w, h, w, m, 0, -h / 2, 0));
    kid.add(pivot);
    return pivot;
  };
  const jeans = mat(0x2a2760), shirt = mat(0x3355ff, 0.5), skin = mat(0xf1c7a4, 0.7), hair = mat(0x1a1530, 0.8);
  const legL = limb(0.14, 0.5, jeans, -0.1, 0.5), legR = limb(0.14, 0.5, jeans, 0.1, 0.5);
  kid.add(box(0.42, 0.5, 0.26, shirt, 0, 0.75, 0));
  const armL = limb(0.11, 0.42, shirt, -0.27, 0.97), armR = limb(0.11, 0.42, shirt, 0.27, 0.97);
  kid.add(box(0.34, 0.4, 0.16, mat(0xf5b53f, 0.45), 0, 0.8, -0.2));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), skin);
  head.position.y = 1.2;
  kid.add(head);
  for (const [x, y, z, r] of [[0, 0.16, -0.02, 0.13], [-0.12, 0.1, 0, 0.1], [0.12, 0.1, 0, 0.1], [-0.08, 0.13, -0.1, 0.11], [0.08, 0.13, -0.1, 0.11], [0, 0.06, -0.15, 0.12], [-0.15, 0.02, -0.07, 0.08], [0.15, 0.02, -0.07, 0.08]]) {
    const curl = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), hair);
    curl.position.set(x, 1.2 + y, z);
    kid.add(curl);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: 0x17153a, transparent: true, opacity: 0.12 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  kid.add(shadow);
  world.add(kid);

  // A stool at the computer, for the real character's seated typing animation.
  const stool = new THREE.Group();
  stool.add(box(0.7, 0.08, 0.7, mat(0x2a2760, 0.4), 0, 0.62, 0));
  for (const [x, z] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) stool.add(box(0.06, 0.6, 0.06, mat(0x6b6990, 0.5), x, 0.3, z));
  const seat = route.getPointAt(1);
  stool.position.set(seat.x, FLOOR, seat.z + 0.45);
  stool.visible = false;
  world.add(stool);

  // The real character, if Adelina's Mixamo files are in /public/models. Until then the placeholder kid runs.
  const hero = character ? await loadCharacter(THREE) : null;
  if (hero) {
    world.remove(kid);
    world.add(hero.root);
    stool.visible = true;
  }

  // Frame the computer and where the kid ends up, from their bounding sphere (the school sits in the background).
  // The sphere doesn't change as the model tilts, so nothing gets cut off mid-tilt.
  const frameBox = new THREE.Box3().setFromObject(pc);
  frameBox.expandByPoint(route.getPointAt(1).clone().add(new THREE.Vector3(0.3, 1.5, 0.3)));
  const sphere = frameBox.getBoundingSphere(new THREE.Sphere());

  // Timeline: at school, run home, then sit at the computer while it plays. Loops.
  const LOOP = 14, LEAVE = 0.8, ARRIVE = 5.8, POWER = 0.45;
  const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  const poseKid = (t: number) => {
    if (hero) return poseHero(hero, t);
    if (t < LEAVE) {
      const p = route.getPointAt(0);
      kid.position.set(p.x, p.y, p.z);
      kid.rotation.y = 0.9;
      legL.rotation.x = legR.rotation.x = armL.rotation.x = armR.rotation.x = 0;
    } else if (t < ARRIVE) {
      const u = ease((t - LEAVE) / (ARRIVE - LEAVE));
      const p = route.getPointAt(u), d = route.getTangentAt(u);
      kid.position.set(p.x, p.y + Math.abs(Math.sin(t * 11)) * 0.06, p.z);
      kid.rotation.y = Math.atan2(d.x, d.z);
      const swing = Math.sin(t * 11) * 0.8;
      legL.rotation.x = swing; legR.rotation.x = -swing;
      armL.rotation.x = -swing; armR.rotation.x = swing;
    } else {
      const p = route.getPointAt(1);
      kid.position.set(p.x, p.y, p.z);
      kid.rotation.y += (Math.PI - kid.rotation.y) * 0.15; // turn to the screen
      legL.rotation.x = legR.rotation.x = 0;
      armL.rotation.x = -1.1 + Math.sin(t * 18) * 0.08; // typing
      armR.rotation.x = -1.1 + Math.cos(t * 18) * 0.08;
    }
  };
  const poseHero = (h: Hero, t: number) => {
    const at = t < LEAVE ? "idle" : t < ARRIVE ? "run" : "type";
    h.play(at);
    if (at === "idle") {
      const p = route.getPointAt(0);
      h.root.position.set(p.x, p.y, p.z);
      h.root.rotation.y = 0.9;
    } else if (at === "run") {
      const u = ease((t - LEAVE) / (ARRIVE - LEAVE));
      const p = route.getPointAt(u), d = route.getTangentAt(u);
      h.root.position.set(p.x, p.y, p.z);
      h.root.rotation.y = Math.atan2(d.x, d.z);
    } else {
      h.root.position.set(seat.x, FLOOR + 0.05, seat.z + 0.45); // on the stool
      h.root.rotation.y += (Math.PI - h.root.rotation.y) * 0.15; // facing the screen
    }
  };

  const drawScreen = (t: number) => {
    if (t < ARRIVE) { ctx.fillStyle = "#07061a"; ctx.fillRect(0, 0, W, H); return; }
    if (t < ARRIVE + POWER) {
      // CRT power-on: a bright line opens into the picture.
      const k = (t - ARRIVE) / POWER;
      ctx.fillStyle = "#07061a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e8ecff";
      const h = Math.max(1, H * k * k);
      ctx.fillRect(W * (0.5 - k * 0.5), (H - h) / 2, W * k, h);
      return;
    }
    draw(ctx, battle);
  };

  const size = () => {
    const { width, height } = el.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    // 0.86: the sphere is loose around a box-shaped model; this still leaves room for the tilt.
    const dist = (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * 0.86;
    camera.position.copy(sphere.center).addScaledVector(VIEW, dist);
    camera.lookAt(sphere.center);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(size);
  ro.observe(el);
  size();

  // Tilt towards the pointer, eased.
  let tx = 0, ty = 0;
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    // Clamped: a cursor far outside the canvas must not spin the screen away.
    const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));
    tx = clamp((e.clientX - r.left) / r.width - 0.5) * 0.35; // up to about ±10°
    ty = clamp((e.clientY - r.top) / r.height - 0.5) * 0.1; // up to about ±3°
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let visible = true;
  const vis = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduce) loop(); });
  vis.observe(el);

  let raf = 0, last = 0, acc = 0, clock = 0;
  const TICK = 1000 / 20; // the battle runs at 20 ticks a second, like an old handheld
  const loop = (now = performance.now()) => {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) { last = 0; return; }
    const dt = Math.min(now - (last || now), 100);
    acc += dt;
    clock = (clock + dt / 1000) % LOOP;
    last = now;
    let ticked = false;
    while (acc >= TICK) { if (clock > ARRIVE) step(battle); acc -= TICK; ticked = true; }
    poseKid(clock);
    hero?.mixer.update(dt / 1000);
    if (ticked || clock < ARRIVE + POWER) { drawScreen(clock); tex.needsUpdate = true; }
    world.rotation.y += (-0.35 + tx - world.rotation.y) * 0.05;
    world.rotation.x += (ty - world.rotation.x) * 0.05;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };

  world.rotation.y = -0.35;
  if (reduce) {
    // One still frame: home, at the computer, screen on.
    poseKid(LOOP - 0.01);
    kid.rotation.y = Math.PI;
    draw(ctx, battle);
    tex.needsUpdate = true;
    renderer.render(scene, camera);
  } else loop();

  return () => {
    cancelAnimationFrame(raf);
    vis.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => mt.dispose()); }
    });
    tex.dispose();
    grain.dispose();
    env.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

type Hero = { root: T.Group; mixer: T.AnimationMixer; play: (name: "idle" | "run" | "type") => void };

// Loads Adelina's character: /public/models/running.fbx (mesh, skeleton, run), idle.fbx, typing.fbx, from Mixamo.
// Only called when the build found running.fbx; returns null if loading fails, so the placeholder kid keeps running.
async function loadCharacter(THREE: typeof T): Promise<Hero | null> {
  const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
  const loader = new FBXLoader();
  const [run, idle, type] = await Promise.all(
    ["running", "idle", "typing"].map((n) => loader.loadAsync(`/models/${n}.fbx`).catch(() => null))
  );
  if (!run) return null;

  // Normalise: Mixamo exports in centimetres. Make her about 1.5 units tall, feet on the floor.
  const model = run;
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  model.scale.setScalar(1.5 / size.y);
  const root = new THREE.Group();
  root.add(model);
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.frustumCulled = false; // skinned meshes move outside their original bounds
      for (const m of [o.material].flat()) if ("envMapIntensity" in m) (m as T.MeshStandardMaterial).envMapIntensity = 0.6;
    }
  });

  // Keep the run on the spot even if "In Place" wasn't ticked: pin the hips' forward travel.
  const clipOf = (g: T.Group | null) => g?.animations?.[0] ?? null;
  const runClip = clipOf(run);
  runClip?.tracks.forEach((track) => {
    if (!/Hips\.position$/.test(track.name)) return;
    const v = track.values;
    for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
  });

  const mixer = new THREE.AnimationMixer(model);
  const actions: Partial<Record<"idle" | "run" | "type", T.AnimationAction>> = {};
  if (runClip) actions.run = mixer.clipAction(runClip);
  const idleClip = clipOf(idle), typeClip = clipOf(type);
  if (idleClip) actions.idle = mixer.clipAction(idleClip);
  if (typeClip) actions.type = mixer.clipAction(typeClip);

  let current: T.AnimationAction | null = null;
  const play = (name: "idle" | "run" | "type") => {
    const next = actions[name] ?? actions.run!;
    if (next === current) return;
    next.reset().fadeIn(0.35).play();
    current?.fadeOut(0.35);
    current = next;
  };
  return { root, mixer, play };
}
