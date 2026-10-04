"use client";
import { useEffect, useRef } from "react";
import type * as T from "three";
import { createBattle, draw, step, W, H } from "@/lib/battle";
import { buildHobbies } from "@/lib/hobbyModels";
import { marquee, teaser } from "@/lib/bootTeaser";
import s from "./RetroComputer.module.css";

// A beige late-90s computer in three.js. The screen is a canvas texture running the pixel battle.
// three.js is only fetched when this scrolls near view, and nothing renders while it's off screen.
export default function RetroComputer({ className, character = false, onScreen }: { className?: string; character?: boolean; onScreen?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const boot = useRef(onScreen); // a ref, so the scene never remounts for it
  boot.current = onScreen;

  useEffect(() => {
    const el = host.current!;
    let cleanup = () => {};
    let started = false;

    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      cleanup = await mount(el, character, () => boot.current?.());
    }, { rootMargin: "300px" });
    io.observe(el);

    return () => { io.disconnect(); cleanup(); };
  }, []);

  return <div ref={host} className={className} role="img" aria-label="A kid runs home from school to her room and a beige 90s computer. Around it: a cat on the monitor, a guitar, an iPad mid-drawing, a Mega Man figure, kid Goku, a Digivice, a Pokéball, a straw hat, and boxing gloves. The computer switches on, and a tiny pixel navi battles a virus on a grid." />;
}

async function mount(el: HTMLElement, character: boolean, onScreen: () => void) {
  const [THREE, { RoomEnvironment }] = await Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Phones: 3x screens make this the heaviest thing on the page, so fewer pixels and no antialias there.
  const touch = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !touch, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
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

  // Her room: the things she loves, around the computer she ran home to. The guitar and the iPad are built in
  // code (lib/hobbyModels); the rest are her models (public/models). Positions are in the computer's space:
  // floor at y 0, the case top at 0.6, the monitor top at 2.65, the keyboard in front at z 2.1.
  // The camera looks from the front right, so the room fills the right side; the kid's route comes in from the left.
  const hobbies = buildHobbies(THREE, reduce);
  const place = (o: T.Object3D, x: number, y: number, z: number, scale: number, rx = 0, ry = 0, rz = 0) => {
    o.scale.setScalar(scale); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); pc.add(o);
  };
  place(hobbies.guitar, 2.3, 0.86, 0.35, 2.7 / 210, 0, -0.35, 0.2); // leaning on the computer
  place(hobbies.ipad, 3.25, 0.5, -0.15, 0.95 / 160, -0.22, -0.45, 0); // on the floor between the guitar and the gloves, mid-drawing
  const PROPS = [
    { url: "/models/oiia-cat.glb", size: 3.2, at: [0.1, 2.65, -0.3], ry: 0.5 }, // sitting on the monitor, way bigger than it
    { url: "/models/megaman.glb", size: 1.5, at: [1.25, 0, 2.95], ry: 0.3 }, // next to the Pokéball, in front of the keyboard
    { url: "/models/digivice.glb", size: 1.0, at: [3.55, 0, 1.25], ry: Math.PI + 0.35 }, // on the floor next to the straw hat (the file faces away)
    { url: "/models/pokeball.glb", size: 0.58, at: [1.95, 0, 2.35], ry: 0.3 }, // on the floor by the keyboard
    { url: "/models/kid-goku.glb", size: 1.4, at: [2.75, 0, 2.6], ry: 0.4 }, // kid Goku, front right
    { url: "/models/straw-hat.glb", size: 1.3, at: [2.75, 0, 1.45], ry: 0.5 }, // on the floor
    { url: "/models/boxing-gloves.glb", size: 1.0, at: [2.55, 0, -0.95], ry: -0.4 }, // behind the guitar
  ] as const;
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const loader = new GLTFLoader();
  const mixers: T.AnimationMixer[] = [];
  let gone = false;
  for (const prop of PROPS) {
    loader.load(prop.url, (g) => {
      if (gone) return;
      // Fit its largest side to `size`, centred, resting on its spot.
      const b = new THREE.Box3().setFromObject(g.scene);
      const dim = b.getSize(new THREE.Vector3());
      const k = prop.size / Math.max(dim.x, dim.y, dim.z);
      g.scene.scale.setScalar(k);
      const c = b.getCenter(new THREE.Vector3());
      g.scene.position.set(-c.x * k, -b.min.y * k, -c.z * k);
      const holder = new THREE.Group();
      holder.position.set(prop.at[0], prop.at[1], prop.at[2]);
      holder.rotation.y = prop.ry;
      holder.add(g.scene);
      pc.add(holder);
      if (g.animations[0] && !reduce) { const mx = new THREE.AnimationMixer(g.scene); mx.clipAction(g.animations[0]).play(); mixers.push(mx); } // the oiia spin
    });
  }

  pc.position.y = -0.2;

  // Hand-drawn notes in the empty space right of the scene, each arrow curving down-left onto a group:
  // "my passions" (guitar, gloves, iPad), "my childhood" (the collectibles) and "boot me up" (the screen). Each tip follows its spot
  // on screen every frame, so it stays on target as the diorama turns.
  el.style.position = "relative";
  let zoom = 1, zoomTo = 1; // pinch / ctrl + scroll, eased in the loop
  const NOTES = [
    { text: "my passions", at: new THREE.Vector3(3.9, 2.4, -0.4) }, // just right of the guitar, the iPad and the gloves
    { text: "my childhood", at: new THREE.Vector3(4.3, 1.1, 1.8) }, // just right of the Digivice, the hat and the figures
    { text: "boot me up", at: new THREE.Vector3(0.72, 2.32, 0.7) }, // the screen's top-right corner: clicking the screen boots Windows 95
  ].map((n) => {
    const node = document.createElement("div");
    node.className = s.note;
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<svg class="${s.noteArrow}" width="54" height="46" viewBox="0 0 54 46" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M50 6C32 6 16 18 10 38"/><path d="M18 33l-8 7-4-10"/></svg><span class="${s.noteText}">${n.text}</span>`;
    el.append(node);
    return { ...n, node };
  });
  const placeNote = () => {
    for (const n of NOTES) {
      const p = pc.localToWorld(n.at.clone()).project(camera);
      const x = ((p.x + 1) / 2) * el.clientWidth, y = ((1 - p.y) / 2) * el.clientHeight;
      n.node.style.transform = `translate(${x}px, ${y}px) translate(-6px, -100%)`; // text up-right, arrow tip on the spot
      n.node.dataset.placed = "";
      n.node.style.opacity = zoom > 1.1 ? "0" : ""; // zoomed in, the notes would point past the frame
    }
  };

  // The story: a kid runs home from school to this computer. Everything tilts together as one diorama.
  const world = new THREE.Group();
  world.add(pc);
  scene.add(world);
  const FLOOR = -0.2;
  const mat = (color: number, roughness = 0.6) => new THREE.MeshStandardMaterial({ color, roughness });

  // School, small and far back-left: a European school block. Three storeys of plaster, a flat roof
  // with a parapet (a block's roof, not a house's), rows of windows, a door with a concrete canopy, the flag on top.
  const school = new THREE.Group();
  const SW = 3.0, SH = 2.2, SD = 1.8; // school width, height, depth
  school.add(box(SW, SH, SD, mat(0xe9e2d0, 0.9), 0, SH / 2, 0));
  school.add(box(SW + 0.12, 0.12, SD + 0.12, mat(0x6b6a72, 0.8), 0, SH + 0.06, 0)); // flat roof slab
  for (const [x, z, w, d] of [[0, SD / 2 + 0.04, SW + 0.12, 0.06], [0, -SD / 2 - 0.04, SW + 0.12, 0.06], [SW / 2 + 0.04, 0, 0.06, SD + 0.12], [-SW / 2 - 0.04, 0, 0.06, SD + 0.12]]) {
    school.add(box(w, 0.14, d, mat(0x55545c, 0.8), x, SH + 0.19, z)); // parapet
  }
  school.add(box(SW + 0.02, 0.08, SD + 0.02, mat(0xcfc6b0, 0.9), 0, 0.04, 0)); // plinth
  const pane = new THREE.MeshBasicMaterial({ color: 0x9db0ff });
  const sill = mat(0xffffff, 0.8);
  for (let floor = 0; floor < 3; floor++) {
    for (let k = 0; k < 5; k++) {
      const x = -1.15 + k * 0.575, y = 0.42 + floor * 0.66;
      if (floor === 0 && k === 2) continue; // the door goes here
      school.add(box(0.34, 0.36, 0.04, pane, x, y, SD / 2 + 0.01));
      school.add(box(0.4, 0.04, 0.07, sill, x, y - 0.2, SD / 2 + 0.03));
    }
  }
  school.add(box(0.5, 0.62, 0.05, mat(0x2a2760), 0, 0.33, SD / 2 + 0.01)); // door
  school.add(box(0.8, 0.06, 0.32, mat(0xb9b2a0, 0.8), 0, 0.7, SD / 2 + 0.16)); // concrete canopy
  school.add(box(0.04, 0.9, 0.04, mat(0x6b6990), SW / 2 - 0.2, SH + 0.6, SD / 2 - 0.2)); // flagpole on the roof
  school.add(box(0.4, 0.24, 0.02, mat(0xf5b53f, 0.4), SW / 2 + 0.02, SH + 0.9, SD / 2 - 0.2));
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

  // Teen Adelina, a tomboy: dark hair pulled back in a ponytail (no bangs), dark rectangular glasses,
  // a black Sonata Arctica tee, jeans ripped at the knees, black sneakers, yellow backpack.
  // Smooth shapes and two-part limbs, so the run bends at knees and elbows.
  const kid = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xf0c4a0, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xffd6c8) });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x1b1412, roughness: 0.7 });
  const tee = new THREE.MeshStandardMaterial({ color: 0x1a1822, roughness: 0.85 });
  const denim = new THREE.MeshStandardMaterial({ color: 0x31507e, roughness: 0.9 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.35 }); // dark glasses frames
  const shoeM = new THREE.MeshStandardMaterial({ color: 0x17171c, roughness: 0.7 });
  const thread = new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.9 }); // frayed denim at the rips
  // The band tee print, painted in code: icy blue band-logo lettering on black.
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = 256; logoCanvas.height = 160;
  {
    const lg = logoCanvas.getContext("2d")!;
    lg.fillStyle = "#1a1822"; lg.fillRect(0, 0, 256, 160);
    lg.textAlign = "center"; lg.fillStyle = "#bfe6ff"; lg.strokeStyle = "#5fb2e6"; lg.lineWidth = 2;
    lg.font = "italic 900 40px Georgia, serif";
    lg.strokeText("SONATA", 128, 62); lg.fillText("SONATA", 128, 62);
    lg.font = "italic 900 34px Georgia, serif";
    lg.strokeText("ARCTICA", 128, 104); lg.fillText("ARCTICA", 128, 104);
    lg.strokeStyle = "#bfe6ff"; lg.lineWidth = 3; // a frost line under the name
    lg.beginPath(); lg.moveTo(48, 122); lg.lineTo(208, 122); lg.stroke();
  }
  const logoTex = new THREE.CanvasTexture(logoCanvas);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f3f7, roughness: 0.6 });
  const pack = new THREE.MeshPhysicalMaterial({ color: 0xf5b53f, roughness: 0.45, clearcoat: 0.3 });
  const mesh = (g: T.BufferGeometry, m: T.Material, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    return o;
  };
  const capsule = (r: number, len: number, m: T.Material, y: number) => mesh(new THREE.CapsuleGeometry(r, len, 8, 16), m, 0, y, 0);
  const pivot = (parent: T.Object3D, x: number, y: number, z = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  // Legs: thigh, knee, shin, sneaker.
  const legs = [-1, 1].map((side) => {
    const hip = pivot(kid, side * 0.08, 0.72);
    hip.add(capsule(0.066, 0.24, denim, -0.17));
    const knee = pivot(hip, 0, -0.34);
    knee.add(capsule(0.056, 0.22, denim, -0.15));
    // Ripped at the knee: skin through the tear, frayed white threads across it.
    const rip = mesh(new THREE.SphereGeometry(0.036, 16, 12), skin, side * 0.004, -0.02, 0.05);
    rip.scale.set(1.15, 0.75, 0.4);
    knee.add(rip);
    for (let k = 0; k < 3; k++) {
      const th = mesh(new THREE.BoxGeometry(0.07, 0.004, 0.004), thread, 0, -0.04 + k * 0.018, 0.064);
      th.rotation.z = (k - 1) * 0.12;
      knee.add(th);
    }
    const shoe = mesh(new THREE.CapsuleGeometry(0.055, 0.1, 6, 12), shoeM, 0, -0.33, 0.04);
    shoe.rotation.x = Math.PI / 2;
    shoe.scale.set(1.05, 1, 0.8);
    knee.add(shoe);
    const sole = mesh(new THREE.CapsuleGeometry(0.058, 0.1, 6, 12), white, 0, -0.36, 0.045);
    sole.rotation.x = Math.PI / 2;
    sole.scale.set(1.08, 1.02, 0.28);
    knee.add(sole);
    return { hip, knee };
  });

  // Hips, torso, neck.
  const pelvis = mesh(new THREE.CapsuleGeometry(0.12, 0.08, 8, 16), denim, 0, 0.78, 0);
  pelvis.rotation.z = Math.PI / 2;
  pelvis.scale.set(1, 1, 0.75);
  kid.add(pelvis);
  const torso = capsule(0.145, 0.2, tee, 1.0);
  torso.scale.set(1, 1, 0.72);
  kid.add(torso);
  const print = mesh(new THREE.PlaneGeometry(0.2, 0.125), new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.85 }), 0, 1.04, 0.106);
  kid.add(print);
  kid.add(mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.1, 16), skin, 0, 1.19, 0));

  // Arms: short sleeve, upper arm, elbow, forearm, hand.
  const arms = [-1, 1].map((side) => {
    const shoulder = pivot(kid, side * 0.19, 1.13);
    shoulder.add(mesh(new THREE.CylinderGeometry(0.06, 0.058, 0.1, 16), tee, 0, -0.04, 0));
    shoulder.add(capsule(0.045, 0.16, skin, -0.13));
    const elbow = pivot(shoulder, 0, -0.25);
    elbow.add(capsule(0.04, 0.15, skin, -0.1));
    elbow.add(mesh(new THREE.SphereGeometry(0.048, 16, 12), skin, 0, -0.22, 0));
    if (side > 0) elbow.add(mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.04, 16), frame, 0, -0.17, 0)); // wristband
    return { shoulder, elbow };
  });

  // Backpack with straps.
  const bag = mesh(new THREE.CapsuleGeometry(0.13, 0.14, 8, 16), pack, 0, 1.0, -0.17);
  bag.scale.set(1.15, 1, 0.55);
  kid.add(bag);
  for (const side of [-1, 1]) kid.add(mesh(new THREE.BoxGeometry(0.035, 0.34, 0.02), pack, side * 0.09, 1.02, 0.1));

  // Head and face.
  const headG = pivot(kid, 0, 1.36);
  const head = mesh(new THREE.SphereGeometry(0.17, 40, 32), skin);
  head.scale.set(0.95, 1.05, 1);
  headG.add(head);
  headG.add(mesh(new THREE.SphereGeometry(0.018, 12, 10), skin, 0, -0.01, 0.168)); // nose
  for (const side of [-1, 1]) { const ear = mesh(new THREE.SphereGeometry(0.035, 16, 12), skin, side * 0.162, 0.0, 0.0); ear.scale.set(0.5, 1, 0.8); headG.add(ear); }
  for (const side of [-1, 1]) {
    headG.add(mesh(new THREE.SphereGeometry(0.019, 16, 12), hairM, side * 0.058, 0.02, 0.152)); // eyes
    const brow = mesh(new THREE.CapsuleGeometry(0.008, 0.04, 4, 8), hairM, side * 0.058, 0.075, 0.155);
    brow.rotation.z = Math.PI / 2 + side * 0.15;
    headG.add(brow);
    // Glasses: dark, thick, rectangular frames, like hers.
    const rim = mesh(new THREE.TorusGeometry(0.052, 0.01, 6, 4), frame, side * 0.064, 0.018, 0.174);
    rim.rotation.z = Math.PI / 4;
    rim.scale.set(1.32, 0.78, 1);
    headG.add(rim);
    const arm = mesh(new THREE.BoxGeometry(0.01, 0.012, 0.17), frame, side * 0.16, 0.03, 0.09);
    headG.add(arm);
  }
  const bridge = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.035, 6), frame, 0, 0.03, 0.178);
  bridge.rotation.z = Math.PI / 2;
  headG.add(bridge);
  const smile = mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 12, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x8a5048, roughness: 0.6 }), 0, -0.072, 0.158); // a small half smile
  smile.rotation.z = Math.PI + Math.PI * 0.22;
  headG.add(smile);

  // Hair: pulled straight back, no bangs, into a ponytail with a plain black hair tie.
  const cap = mesh(new THREE.SphereGeometry(0.183, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), hairM, 0, 0.012, -0.012);
  cap.rotation.x = -0.32;
  cap.scale.set(1, 1.04, 1.02);
  headG.add(cap);
  for (const [x, y, z, r] of [[-0.12, 0.1, -0.06, 0.06], [0.12, 0.1, -0.06, 0.06], [0, 0.17, -0.04, 0.07]]) {
    headG.add(mesh(new THREE.SphereGeometry(r, 16, 12), hairM, x, y, z)); // volume at the crown and sides, swept back
  }
  const tail = pivot(headG, 0, 0.08, -0.16);
  const scrunchie = mesh(new THREE.TorusGeometry(0.03, 0.011, 10, 20), frame); // plain black hair tie
  scrunchie.rotation.x = Math.PI / 2 - 0.5;
  tail.add(scrunchie);
  for (let k = 0; k < 7; k++) {
    const r = 0.068 - k * 0.006;
    tail.add(mesh(new THREE.SphereGeometry(r, 16, 12), hairM, Math.sin(k * 1.7) * 0.02, -0.03 - k * 0.055, -0.05 - k * 0.03));
    tail.add(mesh(new THREE.SphereGeometry(r * 0.6, 12, 10), hairM, Math.cos(k * 2.3) * 0.04, -0.05 - k * 0.055, -0.04 - k * 0.03)); // curls
  }

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ color: 0x17153a, transparent: true, opacity: 0.12 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  kid.add(shadow);
  kid.scale.setScalar(1.2);
  world.add(kid);

  // Where she sits: a cushion on the floor in front of the keyboard.
  const home = route.getPointAt(1);
  const SIT = new THREE.Vector3(home.x + 0.1, FLOOR, home.z - 0.4);
  const cushion = mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.12, 28), new THREE.MeshStandardMaterial({ color: 0x2a2760, roughness: 0.85 }), SIT.x, FLOOR + 0.06, SIT.z);
  cushion.scale.set(1, 1, 0.85);
  world.add(cushion);

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

  // Frame the computer, its objects and the path's end (the school sits in the background), at the resting
  // angle. The camera orbits the centre of that sphere, so a turn keeps the room where it is.
  world.rotation.y = -0.35;
  world.updateMatrixWorld(true);
  const frameBox = new THREE.Box3().setFromObject(pc);
  for (const prop of PROPS) frameBox.expandByPoint(pc.localToWorld(new THREE.Vector3(prop.at[0], prop.at[1] + prop.size, prop.at[2])));
  frameBox.expandByPoint(world.localToWorld(route.getPointAt(1).clone().add(new THREE.Vector3(0.3, 1.8, 0.3))));
  const sphere = frameBox.getBoundingSphere(new THREE.Sphere());

  // Timeline: at school, run home, then sit at the computer while it plays. Loops.
  const LOOP = 14, LEAVE = 0.8, ARRIVE = 5.8, POWER = 0.45;
  const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  // Rotation around x: negative swings a limb forward, positive back.
  const limbs = (hipL: number, hipR: number, kneeL: number, kneeR: number, shL: number, shR: number, elL: number, elR: number) => {
    legs[0].hip.rotation.x = hipL; legs[1].hip.rotation.x = hipR;
    legs[0].knee.rotation.x = kneeL; legs[1].knee.rotation.x = kneeR;
    arms[0].shoulder.rotation.x = shL; arms[1].shoulder.rotation.x = shR;
    arms[0].elbow.rotation.x = elL; arms[1].elbow.rotation.x = elR;
  };
  const poseKid = (t: number) => {
    if (hero) return poseHero(hero, t);
    shadow.visible = t < ARRIVE + 0.15; // seated, the cushion grounds her; the shadow would sink with her
    if (t < LEAVE) {
      const p = route.getPointAt(0);
      kid.position.set(p.x, p.y, p.z);
      kid.rotation.y = 0.9;
      limbs(0, 0, 0, 0, 0.05, 0.05, -0.15, -0.15);
      tail.rotation.set(0.15 + Math.sin(t * 3) * 0.05, 0, 0);
    } else if (t < ARRIVE) {
      const u = ease((t - LEAVE) / (ARRIVE - LEAVE));
      const p = route.getPointAt(u), d = route.getTangentAt(u);
      const ph = t * 11, s = Math.sin(ph);
      kid.position.set(p.x, p.y + Math.abs(Math.cos(ph)) * 0.05, p.z);
      kid.rotation.y = Math.atan2(d.x, d.z);
      limbs(-s * 0.75, s * 0.75, 0.15 + Math.max(0, s) * 1.2, 0.15 + Math.max(0, -s) * 1.2, s * 0.8, -s * 0.8, -1.3, -1.3);
      tail.rotation.set(0.35 + Math.sin(ph * 2) * 0.18, 0, Math.sin(ph) * 0.25); // ponytail bounces
    } else {
      // Home: turn to the screen and sit down on the cushion, knees up, hands on the keys.
      const k = ease(Math.min(1, (t - ARRIVE) / 0.5));
      const HIP = 0.72 * 1.2; // hip height when standing, scaled
      kid.position.set(home.x + (SIT.x - home.x) * k, FLOOR + (0.12 - HIP) * k, home.z + (SIT.z - home.z) * k);
      kid.rotation.y += (Math.PI - kid.rotation.y) * 0.15;
      const tap = Math.sin(t * 18) * 0.05 * k;
      limbs(-1.35 * k, -1.35 * k, 1.5 * k, 1.5 * k, -0.35 - 0.75 * k + tap, -0.35 - 0.75 * k - tap, -0.5 * k, -0.5 * k);
      tail.rotation.set(0.12, 0, Math.sin(t * 2) * 0.05);
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
    const on = t - ARRIVE - POWER; // seconds since the screen switched on
    if (teaser(ctx, on, W, H)) return; // attract mode: a tiny Windows 95 shows what clicking does
    draw(ctx, battle);
    marquee(ctx, on, W, H);
  };

  let camDist = 1;
  const view = new THREE.Vector3();
  // Zoomed in, the view can be dragged around: `pan` moves what the camera looks at, across the screen.
  const pan = new THREE.Vector2(), target = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3();
  const aim = (turn: number) => {
    view.copy(VIEW).applyAxisAngle(THREE.Object3D.DEFAULT_UP, -turn);
    right.crossVectors(THREE.Object3D.DEFAULT_UP, view).normalize();
    upv.crossVectors(view, right).normalize();
    target.copy(sphere.center).addScaledVector(right, pan.x).addScaledVector(upv, pan.y);
    camera.position.copy(target).addScaledVector(view, camDist / zoom);
    camera.lookAt(target);
  };
  const size = () => {
    const { width, height } = el.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    // 0.86: the sphere is loose around a box-shaped model; this keeps the room big.
    const dist = (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * 0.86;
    camDist = dist;
    aim(0);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(size);
  ro.observe(el);
  size();

  // Sways slowly by itself; drag it to turn it. The turn is clamped so the room stays in frame.
  let yaw = 0, sway = 0, turn = 0, drag: { x: number; y: number; yaw: number; px: number; py: number } | null = null;
  // Zooming aims at a spot, like a map: the part of the room under the cursor (or between two fingers) stays put.
  const MAX_ZOOM = 3.5;
  // Room units per screen pixel at zoom 1, from the camera itself; divide by the zoom for any other.
  const perPx = () => (2 * camDist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(el.clientHeight, 1);
  const clampPan = () => {
    const lim = sphere.radius * Math.max(0, 1 - 1 / zoomTo);
    pan.set(Math.max(-lim, Math.min(lim, pan.x)), Math.max(-lim, Math.min(lim, pan.y)));
  };
  const offset = (x: number, y: number) => { const r = el.getBoundingClientRect(); return [x - r.left - r.width / 2, y - r.top - r.height / 2]; };
  const zoomAbout = (x: number, y: number, z: number) => {
    const [ox, oy] = offset(x, y), k = perPx(), z0 = zoomTo, z1 = Math.max(0.7, Math.min(MAX_ZOOM, z));
    pan.x += ox * k * (1 / z0 - 1 / z1);
    pan.y -= oy * k * (1 / z0 - 1 / z1);
    zoomTo = z1;
    clampPan();
  };

  // Two fingers on a touch screen pinch-zoom, like the trackpad pinch below; one finger turns or pans.
  const touches = new Map<number, { x: number; y: number }>();
  let pinch: { d: number; z: number } | null = null;
  const spread = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const onDown = (e: PointerEvent) => {
    e.stopPropagation(); // the pages are draggable too: this drag turns the room, not the page
    el.setPointerCapture(e.pointerId);
    hint();
    if (e.pointerType === "touch") {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { pinch = { d: spread(), z: zoomTo }; drag = null; return; }
    }
    drag = { x: e.clientX, y: e.clientY, yaw, px: pan.x, py: pan.y };
    el.style.cursor = "grabbing";
  };
  // A click (not a drag) on the monitor's screen boots it: Windows 95 (components/Win95).
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const onScreenAt = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(screen).length > 0;
  };
  const onMove = (e: PointerEvent) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      zoomAbout((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.z * (spread() / pinch.d));
      return;
    }
    if (!drag) { el.style.cursor = onScreenAt(e) ? "pointer" : "grab"; return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (zoom > 1.05) {
      // Zoomed in: drag the view, like a map. Kept within the room.
      const k = perPx() / zoom; // the room follows the finger exactly
      pan.set(drag.px - dx * k, drag.py + dy * k);
      clampPan();
    } else yaw = Math.max(-0.9, Math.min(0.9, drag.yaw + (dx / el.clientWidth) * 2.5));
  };
  let lastTap = 0;
  const onUp = (e: PointerEvent) => {
    touches.delete(e.pointerId);
    if (pinch) { if (touches.size < 2) pinch = null; drag = null; return; } // lifting a pinch finger never taps
    const tap = drag && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6;
    drag = null;
    el.style.cursor = "grab";
    if (!tap || e.type !== "pointerup") return;
    if (onScreenAt(e)) { onScreen(); return; }
    // A double tap on a touch screen zooms, like a double-click with a mouse.
    if (e.pointerType === "touch") {
      if (e.timeStamp - lastTap < 320) { zoomAt(e.clientX, e.clientY); lastTap = 0; } else lastTap = e.timeStamp;
    }
  };
  // Double-click (or double-tap): zoom in on that spot, or back out to the whole room.
  const zoomAt = (x: number, y: number) => {
    if (zoomTo > 1.3) { zoomTo = 1; return; }
    const [ox, oy] = offset(x, y), k = perPx() / zoomTo;
    pan.x += ox * k; // bring the clicked spot to the middle…
    pan.y -= oy * k;
    zoomTo = 2.5; // …and close in on it
    clampPan();
  };
  const onDbl = (e: MouseEvent) => { if (!onScreenAt(e as PointerEvent)) zoomAt(e.clientX, e.clientY); };
  // The first time someone reaches for the room, a small note says how to zoom, then fades.
  const tip = document.createElement("div");
  tip.className = s.zoomHint;
  tip.setAttribute("aria-hidden", "true");
  tip.textContent = touch ? "Pinch or double-tap to zoom in" : "Double-click or pinch to zoom in";
  el.append(tip);
  let hinted = false;
  const hint = () => {
    if (hinted) return;
    hinted = true;
    tip.dataset.on = "";
    setTimeout(() => delete tip.dataset.on, 3200);
  };
  el.style.cursor = "grab";
  // Pinch on a trackpad (or ctrl + scroll) zooms. A plain scroll still scrolls the page.
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault(); // otherwise the browser zooms the whole page
    hinted = true; delete tip.dataset.on; // found it already
    zoomAbout(e.clientX, e.clientY, zoomTo * Math.exp(-e.deltaY * 0.01));
  };
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("dblclick", onDbl);
  el.addEventListener("pointerenter", hint);
  el.style.touchAction = "pan-y"; // vertical swipes still scroll the page on phones
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);

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
    mixers.forEach((mx) => mx.update(dt / 1000));
    hobbies.update(now / 1000);
    if (ticked || clock < ARRIVE + POWER) { drawScreen(clock); tex.needsUpdate = true; }
    if (!drag) sway += dt / 1000;
    turn += (yaw + Math.sin(sway * 0.26) * 0.3 - turn) * 0.08; // one sway every ~24 s
    zoom += (zoomTo - zoom) * 0.12;
    if (zoomTo <= 1.05 && zoom <= 1.05) pan.multiplyScalar(0.9); // zoomed back out: drift back to the whole room
    const ta = zoomTo > 1.05 ? "none" : "pan-y"; // zoomed in, a finger pans the room; zoomed out, it scrolls the page
    if (el.style.touchAction !== ta) el.style.touchAction = ta;
    aim(turn);
    renderer.render(scene, camera);
    placeNote();
    raf = requestAnimationFrame(loop);
  };

  if (reduce) {
    // One still frame: home, at the computer, screen on.
    poseKid(LOOP - 0.01);
    kid.rotation.y = Math.PI;
    draw(ctx, battle);
    marquee(ctx, 0, W, H, true); // still: no scrolling, no teaser
    tex.needsUpdate = true;
    renderer.render(scene, camera);
    placeNote();
  } else loop();

  return () => {
    gone = true;
    mixers.forEach((mx) => mx.stopAllAction());
    cancelAnimationFrame(raf);
    vis.disconnect();
    ro.disconnect();
    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("dblclick", onDbl);
    el.removeEventListener("pointerenter", hint);
    tip.remove();
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => { (mt as T.MeshStandardMaterial).map?.dispose(); mt.dispose(); }); }
    });
    tex.dispose();
    logoTex.dispose();
    hobbies.dispose();
    grain.dispose();
    env.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    NOTES.forEach((n) => n.node.remove());
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
