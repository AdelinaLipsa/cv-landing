// Ship It!'s 3D view. The game still plays on its tile grid (components/ShipIt); this builds the level as a
// real place: steel blocks with depth, girders, chrome spikes, a factory wall behind, shadows, and a robot hero
// with jointed limbs that runs, jumps and raises its arm cannon. Everything is original, built from primitives.
// Blocks stand from z = 0 back to z = -DEPTH; their front faces sit exactly on the game grid.
import type * as T from "three";
import { stage } from "./arcade3d";
import { loadModel } from "./assets";
import { heroClip, lookAhead, squash, type Clip } from "./shipitMotion";

export type Level = { tile: (c: number, r: number) => string; rows: number; cols: number; size: number; arena: number };
export type ShipItFrame = {
  t: number; dt: number; cam: number; shake: number; halloween: boolean;
  p: { x: number; y: number; vx: number; vy: number; ground: boolean; face: number; shot: number; charge: number; won: boolean; visible: boolean; beam: number | null };
  enemies: { x: number; y: number; vx: number; kind: "wheel" | "drone" | "hat"; alive: boolean; open: number }[];
  boss: { x: number; y: number; vy: number; ground: boolean; cool: number; hit: boolean } | null;
  door: boolean;
  health: { x: number; y: number; on: boolean }[];
  shots: { x: number; y: number; vx: number; vy: number; big: boolean; foe: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
  impacts: { x: number; y: number; at: number }[];
};
export type ShipItView = { draw: (f: ShipItFrame) => void; dispose: () => void };

const DEPTH = 16, Z = -6; // how deep the blocks go; the plane the bodies move in

export async function mountShipIt(canvas: HTMLCanvasElement, W: number, H: number, level: Level, onLost?: () => void): Promise<ShipItView> {
  const [st, { RoundedBoxGeometry }] = await Promise.all([stage(canvas, W, H, { shadows: true, env: 0.35, onLost }), import("three/examples/jsm/geometries/RoundedBoxGeometry.js")]);
  const { THREE, scene, camera, D, hot, glowMat } = st;
  const { tile, rows, cols, size: TS, arena } = level;
  scene.background = new THREE.Color(0x0b0a24);
  scene.fog = new THREE.Fog(0x0b0a24, D + 20, D + 160);
  const X = (x: number) => x, Y = (y: number) => -y;

  // Canvas-painted textures: steel panels, hazard stripes, girder truss, the factory wall.
  const textures: T.Texture[] = [];
  const paint = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d")!);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(...repeat); }
    textures.push(tex);
    return tex;
  };
  const grain = (g: CanvasRenderingContext2D, w: number, h: number, a: number) => {
    for (let i = 0; i < w * h * 0.25; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "255,255,255"},${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
  };
  const steel = paint(128, 128, (g) => {
    g.fillStyle = "#4b5180"; g.fillRect(0, 0, 128, 128);
    grain(g, 128, 128, 0.12);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 0, 128, 5); g.fillRect(0, 0, 5, 128);
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, 123, 128, 5); g.fillRect(123, 0, 5, 128);
    for (const [x, y] of [[16, 16], [112, 16], [16, 112], [112, 112]]) {
      const r = g.createRadialGradient(x - 2, y - 2, 0, x, y, 7);
      r.addColorStop(0, "#c9cdf0"); r.addColorStop(1, "#2a2d55");
      g.fillStyle = r; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,0.07)";
    for (let i = 0; i < 6; i++) { g.beginPath(); const x = Math.random() * 128, y = Math.random() * 128; g.moveTo(x, y); g.lineTo(x + 10 + Math.random() * 20, y + Math.random() * 6); g.stroke(); }
  });
  const hazard = paint(64, 16, (g) => {
    g.fillStyle = "#1a1830"; g.fillRect(0, 0, 64, 16);
    g.fillStyle = "#F5B53F";
    for (let x = -16; x < 64; x += 16) { g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 8, 0); g.lineTo(x + 16, 0); g.lineTo(x + 8, 16); g.fill(); }
    grain(g, 64, 16, 0.2);
  });
  const truss = paint(64, 32, (g) => {
    g.fillStyle = "#c46a1c"; g.fillRect(0, 0, 64, 32);
    g.fillStyle = "#ffb15e"; g.fillRect(0, 0, 64, 4);
    g.fillStyle = "#7a3a0c"; g.fillRect(0, 28, 64, 4);
    g.strokeStyle = "#8a4510"; g.lineWidth = 4;
    g.beginPath(); for (let x = 0; x <= 64; x += 16) { g.moveTo(x, 6); g.lineTo(x + 8, 26); g.lineTo(x + 16, 6); } g.stroke();
    grain(g, 64, 32, 0.15);
  });
  const wallTex = paint(256, 256, (g) => {
    g.fillStyle = "#15133a"; g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 64) {
      g.fillStyle = "#1c1a4a"; g.fillRect(x + 2, 0, 60, 256);
      g.fillStyle = "#0e0c2a"; g.fillRect(x, 0, 2, 256);
      for (let y = 20; y < 256; y += 64) { g.fillStyle = "#24215a"; g.fillRect(x + 8, y, 48, 3); for (let v = 0; v < 5; v++) g.fillRect(x + 12 + v * 9, y + 10, 5, 18); }
    }
    const pipe = g.createLinearGradient(170, 0, 190, 0);
    pipe.addColorStop(0, "#1a1848"); pipe.addColorStop(0.4, "#4a4690"); pipe.addColorStop(1, "#141238");
    g.fillStyle = pipe; g.fillRect(170, 0, 20, 256);
    g.fillStyle = "#2f2b6e"; for (let y = 30; y < 256; y += 60) g.fillRect(166, y, 28, 6);
    grain(g, 256, 256, 0.1);
  }, [10, 1]);

  scene.add(new THREE.HemisphereLight(0x8a9cff, 0x1c1638, 0.8));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.4);
  key.castShadow = st.shadows;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -140, right: 140, top: 100, bottom: -100, near: 1, far: 400 });
  key.shadow.bias = -0.0015;
  const rim = new THREE.DirectionalLight(0x7fe3ff, 1.2);
  rim.position.set(80, 40, -120);
  scene.add(key, key.target, rim);

  // The level: one instanced mesh per kind of thing, built once from the grid.
  const solid = (c: number, r: number) => tile(c, r) === "#";
  const cells = (ch: string) => { const out: [number, number][] = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (tile(c, r) === ch) out.push([c, r]); return out; };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  const instanced = (geo: T.BufferGeometry, mat: T.Material, at: [number, number, number][], shadows = true) => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, at.length));
    at.forEach(([x, y, z], i) => m.setMatrixAt(i, m4.compose(v.set(x, y, z), q, sc)));
    m.count = at.length;
    m.castShadow = false; m.receiveShadow = shadows;
    scene.add(m);
    return m;
  };
  const blocks = cells("#");
  instanced(new THREE.BoxGeometry(TS, TS, DEPTH), new THREE.MeshStandardMaterial({ map: steel, metalness: 0.7, roughness: 0.55 }), blocks.map(([c, r]) => [c * TS + TS / 2, -(r * TS + TS / 2), -DEPTH / 2]));
  instanced(new THREE.BoxGeometry(TS, 1.2, DEPTH + 0.2), new THREE.MeshStandardMaterial({ map: hazard, metalness: 0.3, roughness: 0.5 }), blocks.filter(([c, r]) => !solid(c, r - 1)).map(([c, r]) => [c * TS + TS / 2, -(r * TS + 0.5), -DEPTH / 2]));
  instanced(new THREE.BoxGeometry(TS, 5, DEPTH * 0.7), new THREE.MeshStandardMaterial({ map: truss, metalness: 0.5, roughness: 0.5 }), cells("=").map(([c, r]) => [c * TS + TS / 2, -(r * TS + 2.5), -DEPTH / 2]));
  const spikeAt: [number, number, number][] = [];
  for (const [c, r] of cells("^")) for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) spikeAt.push([c * TS + 2 + i * 4, -(r * TS + 6), -2.5 - k * 5]);
  instanced(new THREE.ConeGeometry(1.9, 4.5, 12), new THREE.MeshStandardMaterial({ color: 0xc9cdf0, metalness: 0.9, roughness: 0.35, envMapIntensity: 0.6 }), spikeAt);

  // Behind the level: pillars at middle depth, the factory wall far back, warning lights blinking on it.
  const span = cols * TS;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(span + 400, 260), new THREE.MeshStandardMaterial({ map: wallTex, metalness: 0.4, roughness: 0.7 }));
  wallTex.repeat.set((span + 400) / 160, 1);
  wall.position.set(span / 2, -H / 2, -90);
  wall.receiveShadow = false;
  scene.add(wall);
  const pillars: [number, number, number][] = [];
  for (let x = -60; x < span + 80; x += 56) pillars.push([x, -H / 2, -42]);
  instanced(new THREE.BoxGeometry(10, 220, 8), new THREE.MeshStandardMaterial({ color: 0x2a2760, metalness: 0.8, roughness: 0.4 }), pillars, false);
  const lampAt: [number, number, number][] = [];
  for (let x = -60; x < span + 80; x += 28) lampAt.push([x, -20 - ((x / 28) % 3) * 22, -88]);
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(1.4, 10, 8), glowMat(new THREE.Color(1, 1, 1)), lampAt.length);
  lampAt.forEach(([x, y, z], i) => lamps.setMatrixAt(i, m4.compose(v.set(x, y, z), q, sc)));
  scene.add(lamps);
  const lampColors = (halloween: boolean) => (halloween ? ["#ff8c1a", "#b46bff"] : ["#ff5a5a", "#5fd897"]);

  // The locked door to the boss room: three red laser bars.
  const door = new THREE.Group();
  for (let k = 0; k < 3; k++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 13 * TS, 8), glowMat(hot("#ff3b3b", 3))); bar.position.set(0, 0, -2 - k * 6); door.add(bar); }
  door.position.set((arena - 1) * TS + 4, -(13 * TS) / 2, 0);
  door.visible = false;
  scene.add(door);

  // Materials for the bodies.
  const gloss = (hex: string, metal = 0.15) => new THREE.MeshPhysicalMaterial({ color: hex, metalness: metal, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15 });
  const joint = new THREE.MeshStandardMaterial({ color: 0x2a2d40, metalness: 0.8, roughness: 0.4 });
  const visorGlass = new THREE.MeshPhysicalMaterial({ color: 0x050816, metalness: 0.2, roughness: 0.05, clearcoat: 1 });
  const shadowed = (o: T.Object3D) => { o.traverse((m) => { if ((m as T.Mesh).isMesh) m.castShadow = st.shadows; }); return o; };
  const rbox = (w: number, h: number, d: number, mat: T.Material, r = 0.6) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat);
  const capsule = (r: number, len: number, mat: T.Material) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);
  const pivot = (x: number, y: number, z: number, ...kids: T.Object3D[]) => { const g = new THREE.Group(); g.position.set(x, y, z); g.add(...kids); return g; };

  // The hero: an armoured robot, built facing +z (toward you). Pivots at hips, knees and shoulders.
  const blue = gloss("#2f6bff"), light = gloss("#7fe3ff");
  const cannonGlow = glowMat(hot("#7fe3ff", 2));
  const leg = (s: number) => {
    const boot = rbox(3.2, 2.2, 4.2, light, 0.7); boot.position.set(0, -4.2, 0.5);
    const shin = capsule(1.25, 1.6, blue); shin.position.y = -2.2;
    const knee = pivot(0, -2.8, 0, shin, boot);
    const thigh = capsule(1.1, 1.6, joint); thigh.position.y = -1.3;
    const hip = pivot(s * 1.6, 6.8, 0, thigh, knee);
    return Object.assign(hip, { knee });
  };
  const arm = (s: number) => {
    const upper = capsule(1, 1.6, light); upper.position.y = -1.3;
    const fist = rbox(2.1, 2.1, 2.1, blue, 0.6); fist.position.y = -3.4;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.5, 3.8, 18), blue); barrel.position.y = -3.6;
    const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.3, 8, 18), cannonGlow); muzzle.rotation.x = Math.PI / 2; muzzle.position.y = -5.5;
    const shoulder = pivot(s * 4, 10.6, 0, rbox(2.6, 2.2, 2.6, blue, 0.8), upper, fist, barrel, muzzle);
    return Object.assign(shoulder, { fist, barrel, muzzle });
  };
  const hero = new THREE.Group();
  const body = new THREE.Group();
  const torso = rbox(6.4, 4.8, 4.4, blue, 1.2); torso.position.y = 9.2;
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), glowMat(hot("#7fe3ff", 2.2))); core.position.set(0, 9.6, 2.25);
  const belt = rbox(5.6, 1.2, 4, joint, 0.4); belt.position.y = 6.8;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(3.1, 28, 20), blue); helmet.position.y = 13.6;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 12, -Math.PI * 0.4, Math.PI * 0.8, Math.PI * 0.38, Math.PI * 0.3), visorGlass); visor.position.set(0, 13.5, 0.75);
  const eyes = [-1, 1].map((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), glowMat(hot("#7fe3ff", 3))); e.position.set(s * 0.85, 13.6, 3.05); return e; });
  const ears = [-1, 1].map((s) => { const e = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 18), light); e.rotation.z = Math.PI / 2; e.position.set(s * 3.1, 13.6, 0); return e; });
  const legs = [leg(-1), leg(1)], arms = [arm(-1), arm(1)];
  body.add(torso, core, belt, helmet, visor, ...eyes, ...ears, ...legs, ...arms);
  hero.add(body);
  hero.scale.setScalar(0.86);
  scene.add(shadowed(hero));
  const heroLight = new THREE.PointLight(0x7fe3ff, 0, 40, 0);
  scene.add(heroLight);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 12), glowMat(hot("#7fe3ff", 2.5)));
  scene.add(beam);

  // The real hero: a rigged CC0 robot with idle, run, jump, punch and thumbs-up clips, painted in the game's
  // blues, an arm cannon on its right hand. If it can't load, the procedural robot above stays.
  let disposed = false;
  type Robot = { root: T.Group; mixer: T.AnimationMixer; actions: Partial<Record<Clip | "Punch", T.AnimationAction>>; current: Clip | "Punch"; muzzle: T.MeshBasicMaterial };
  let robot: Robot | null = null;
  loadModel("/arcade/shipit/robot.glb").then(({ scene: model, animations }) => {
    if (disposed) return;
    model.traverse((o) => {
      const m = o as T.Mesh;
      if (!m.isMesh) return;
      m.castShadow = st.shadows;
      m.frustumCulled = false; // skinned bounds go stale; the robot is always near the camera
      const mat = (m.material as T.MeshStandardMaterial).clone(); // clones share the cached material: never tint it in place
      if (mat.name === "Main") mat.color.set("#2f6bff");
      if (mat.name === "Grey") mat.color.set("#7fe3ff");
      mat.metalness = 0.35; mat.roughness = 0.35;
      m.material = mat;
    });
    model.updateMatrixWorld(true); // measure it posed: unposed skinned meshes report a bogus box
    model.traverse((o) => { if ((o as T.SkinnedMesh).isSkinnedMesh) (o as T.SkinnedMesh).skeleton.update(); });
    const box = new THREE.Box3().setFromObject(model);
    const h = box.max.y - box.min.y;
    const k = Number.isFinite(h) && h > 0.01 ? 15 / h : 15 / 4.6; // as tall as the hitbox, a touch over
    model.scale.setScalar(k);
    if (process.env.NODE_ENV !== "production") console.debug("[shipit] robot ready", { height: h, scale: k });
    const root = new THREE.Group();
    root.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const actions: Robot["actions"] = {};
    for (const c of animations) if (["Idle", "Running", "Jump", "ThumbsUp", "Punch"].includes(c.name)) actions[c.name as Clip | "Punch"] = mixer.clipAction(c);
    actions.Jump?.setLoop(THREE.LoopOnce, 1); if (actions.Jump) actions.Jump.clampWhenFinished = true;
    actions.Idle?.play();
    // The arm cannon rides the right hand bone; its muzzle glows hotter as you charge.
    const muzzle = glowMat(hot("#7fe3ff", 2));
    let hand = null as T.Object3D | null; // assigned inside the traverse callback; the cast stops TS narrowing it to null
    model.traverse((o) => { if ((o as T.Bone).isBone && o.name === "Hand.R") hand = o; });
    if (hand) {
      const gun = new THREE.Group();
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.3, 16), gloss("#2f6bff"));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 8, 16), muzzle);
      ring.position.y = 0.7; ring.rotation.x = Math.PI / 2;
      gun.add(barrel, ring);
      gun.scale.setScalar(1 / model.scale.x); // undo the model's scale so the cannon keeps its size in world units
      gun.position.y = 0.5 / model.scale.x;
      (hand as T.Object3D).add(gun);
    }
    scene.add(shadowed(root));
    hero.visible = false;
    robot = { root, mixer, actions, current: "Idle", muzzle };
  }).catch(() => { }); // keep the procedural robot

  // Enemies, one model per kind.
  const red = gloss("#ff5a5a", 0.2), amber = gloss("#F5B53F", 0.3), steelGrey = gloss("#8c94c9", 0.7);
  const eyeMat = (hex: string) => glowMat(hot(hex, 3));
  const makeWheel = () => {
    const g = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.9, 10, 24), new THREE.MeshStandardMaterial({ color: 0x15151f, roughness: 0.85 }));
    wheel.position.y = 3;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.6, 14), steelGrey); hub.rotation.x = Math.PI / 2; hub.position.y = 3;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.8, 20, 14), red); dome.position.y = 6.2; dome.scale.y = 0.85;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), eyeMat("#ffffff")); eye.position.set(1.6, 6.6, 1.9);
    g.add(wheel, hub, dome, eye);
    return Object.assign(g, { spin: wheel });
  };
  const makeDrone = (halloween: boolean) => {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(2.8, 20, 14), steelGrey); hull.scale.set(1.3, 0.7, 1);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), eyeMat(halloween ? "#ff8c1a" : "#ff3b3b")); eye.position.set(0, -0.2, 2.6);
    const rotors = [[-3.4, 2], [3.4, 2], [-3.4, -2], [3.4, -2]].map(([x, z]) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.2, 6), joint); arm.rotation.z = Math.PI / 2; arm.position.set(x / 2, 0.8, z);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.12, 20), new THREE.MeshBasicMaterial({ color: 0xc9cdf0, transparent: true, opacity: 0.35 })); disc.position.set(x, 1.2, z);
      g.add(arm);
      return disc;
    });
    g.add(hull, eye, ...rotors);
    return Object.assign(g, { rotors });
  };
  const makeHat = () => {
    const g = new THREE.Group();
    const bodyBox = rbox(6.5, 3.6, 5, joint, 0.8); bodyBox.position.y = 1.8;
    const eyesHat = [-1, 1].map((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), eyeMat("#ffffff")); e.position.set(s * 1.6, 2.3, 2.5); return e; });
    const shell = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), amber);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.1, 0.5, 28), amber);
    const ridge = rbox(1, 1.2, 8, amber, 0.4); ridge.position.y = 3.6;
    shell.add(dome, brim, ridge);
    g.add(bodyBox, ...eyesHat, shell);
    return Object.assign(g, { shell });
  };
  type Foe = T.Group & { spin?: T.Mesh; shell?: T.Group; rotors?: T.Mesh[] };
  let foes: Foe[] = [];
  let foesFor: unknown = null;
  const foeRoot = new THREE.Group();
  scene.add(foeRoot);

  // Scope Creep: a hulking amber robot with a visor, red eyes and an antenna. Squashes when it lands.
  const boss = new THREE.Group();
  const bossArmor = new THREE.MeshPhysicalMaterial({ color: "#F5B53F", metalness: 0.35, roughness: 0.3, clearcoat: 1, emissive: 0xffffff, emissiveIntensity: 0 });
  const bossBody = rbox(14, 8, 10, bossArmor, 2); bossBody.position.y = 7.5;
  const bossVisor = rbox(10, 3, 1, visorGlass, 0.5); bossVisor.position.set(0, 8.5, 5);
  const bossEyes = [-1, 1].map((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), eyeMat("#ff3b3b")); e.position.set(s * 2.4, 8.5, 5.6); return e; });
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), joint); antenna.position.set(-3, 13.4, 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), eyeMat("#F5B53F")); tip.position.set(-3, 15.6, 0);
  const bossLegs = [-1, 1].map((s) => { const l = rbox(3.6, 4, 5, joint, 0.8); l.position.set(s * 4, 2, 0); return l; });
  const bossArms = [-1, 1].map((s) => { const a = rbox(3, 6, 4, bossArmor, 1); a.position.set(s * 8.4, 7, 0); return a; });
  boss.add(bossBody, bossVisor, ...bossEyes, antenna, tip, ...bossLegs, ...bossArms);
  boss.visible = false;
  scene.add(shadowed(boss));

  // Health: glowing pink crosses.
  const crossMat = new THREE.MeshStandardMaterial({ color: "#ff7ac6", emissive: "#ff7ac6", emissiveIntensity: 1.2, roughness: 0.3 });
  let crosses: T.Group[] = [];

  // Shots and sparks.
  const MAX = 40;
  const pellets = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.9, 2, 4, 8), glowMat(hot("#fff1a8", 3)), MAX);
  const foeShots = new THREE.InstancedMesh(new THREE.SphereGeometry(1.1, 10, 8), glowMat(hot("#ff4a4a", 3)), MAX);
  const bigShots = new THREE.InstancedMesh(new THREE.SphereGeometry(3, 16, 12), glowMat(hot("#fff1a8", 3.2)), MAX);
  for (const m of [pellets, foeShots, bigShots]) { m.frustumCulled = false; scene.add(m); }
  const sparks = st.sparks(400, 2);
  const zRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);

  let phase = 0, lastBossVy = 0, bossSquash = 1, lead = 0;
  const lampOff = new THREE.Color(0.08, 0.07, 0.2), lampOn = [new THREE.Color(), new THREE.Color()];

  return {
    draw(f) {
      const { t, dt } = f;
      const sx = f.shake > 0 ? (Math.random() - 0.5) * 3 : 0, sy = f.shake > 0 ? (Math.random() - 0.5) * 3 : 0;
      lead = lookAhead(lead, f.p.face, f.p.vx, dt, f.door);
      camera.position.set(f.cam + W / 2 + lead + sx, -H / 2 + sy, D);
      key.position.set(f.cam + W / 2 - 70, 60, 120);
      key.target.position.set(f.cam + W / 2, -H / 2, -DEPTH / 2);

      const [c1, c2] = lampColors(f.halloween);
      lampOn[0].copy(hot(c1, 3)); lampOn[1].copy(hot(c2, 3));
      lampAt.forEach((_, i) => lamps.setColorAt(i, (Math.floor(t * 2) + i) % 3 ? lampOff : lampOn[i % 2]));
      if (lamps.instanceColor) lamps.instanceColor.needsUpdate = true;
      door.visible = f.door;
      door.children.forEach((b, k) => (b.visible = (Math.floor(t * 12) + k) % 4 !== 0));

      // The hero: legs and arms swing with distance run; the near arm comes up to fire.
      const p = f.p;
      hero.visible = p.visible;
      hero.position.set(X(p.x + 5), Y(p.y + 14) - 0.6, Z);
      hero.rotation.y = p.face * (Math.PI / 2 - 0.6);
      const running = p.ground && Math.abs(p.vx) > 1;
      phase += running ? Math.abs(p.vx) * dt * 0.22 : 0;
      const swing = running ? Math.sin(phase) : 0;
      legs.forEach((l, i) => {
        const s = i ? -1 : 1;
        l.rotation.x = p.ground ? swing * s * 0.85 : i ? 0.5 : -0.9;
        l.knee.rotation.x = p.ground ? Math.max(0, -swing * s) * 1.2 : 1;
      });
      body.position.y = running ? Math.abs(Math.sin(phase)) * 0.6 : Math.sin(t * 2) * 0.12;
      const near = arms[p.face > 0 ? 0 : 1], far = arms[p.face > 0 ? 1 : 0];
      const aiming = p.shot > 0 || p.charge > 0.2;
      near.rotation.x = aiming ? -Math.PI / 2 : running ? -swing * 0.7 : p.ground ? 0 : -0.8;
      far.rotation.x = running ? swing * 0.7 : p.ground ? 0 : -0.5;
      for (const a of arms) { const gun = a === near && aiming; a.fist.visible = !gun; a.barrel.visible = a.muzzle.visible = gun; }
      const charged = p.charge > 0.7;
      cannonGlow.color.copy(charged && Math.floor(t * 16) % 2 ? hot("#fff1a8", 4) : hot("#7fe3ff", 1 + Math.min(p.charge, 0.7) * 3));
      heroLight.intensity = aiming ? 1 + Math.min(p.charge, 1) * 3 : 0;
      heroLight.position.set(X(p.x + 5 + p.face * 8), Y(p.y + 8), Z + 4);
      if (robot) {
        hero.visible = false;
        robot.root.visible = p.visible;
        robot.root.position.set(X(p.x + 5), Y(p.y + 14), Z);
        robot.root.rotation.y = p.face * (Math.PI / 2 - 0.6);
        // Shooting while standing holds the punch's extended arm; running or jumping keeps the run or jump.
        const base = heroClip({ won: p.won, ground: p.ground, vx: p.vx });
        const want: Clip | "Punch" = aiming && base === "Idle" && robot.actions.Punch ? "Punch" : base;
        if (want !== robot.current && robot.actions[want]) {
          const next = robot.actions[want]!, prev = robot.actions[robot.current];
          next.reset().play();
          if (want === "Punch") { next.time = 0.28; next.timeScale = 0; } else next.timeScale = 1;
          if (prev) prev.crossFadeTo(next, 0.15, false);
          robot.current = want;
        }
        robot.mixer.update(robot.current === "Running" ? dt * Math.min(1.6, Math.abs(p.vx) / 45) : dt);
        robot.muzzle.color.copy(charged && Math.floor(t * 16) % 2 ? hot("#fff1a8", 4) : hot("#7fe3ff", 1 + Math.min(p.charge, 0.7) * 3));
      }
      beam.visible = p.beam !== null;
      if (p.beam !== null) { const top = 0, bottom = p.beam; beam.scale.y = Math.max(1, bottom - top); beam.position.set(X(p.x + 5), Y((top + bottom) / 2), Z); }

      // Enemies: rebuild the models when the list is new (a fresh game), then pose them.
      if (foesFor !== f.enemies) {
        foeRoot.clear();
        foes = f.enemies.map((e) => (e.kind === "wheel" ? makeWheel() : e.kind === "drone" ? makeDrone(f.halloween) : makeHat()));
        foes.forEach((g) => shadowed(g));
        if (foes.length) foeRoot.add(...foes);
        foesFor = f.enemies;
      }
      foes.forEach((g, i) => {
        const e = f.enemies[i];
        g.visible = e.alive && Math.abs(e.x - f.cam - W / 2) < W;
        if (!g.visible) return;
        if (e.kind === "wheel") { g.position.set(X(e.x + 4), Y(e.y + 8), Z); g.rotation.y = e.vx > 0 ? 0.6 : Math.PI - 0.6; g.spin!.rotation.z = -e.x * 0.45; }
        else if (e.kind === "drone") { g.position.set(X(e.x + 4.5), Y(e.y + 3), Z); g.rotation.set(0.25, Math.sin(t * 2 + i) * 0.4, Math.sin(t * 3 + i) * 0.12); for (const r of g.rotors!) r.rotation.y = t * 40; }
        else { g.position.set(X(e.x + 5), Y(e.y + 7), Z); g.rotation.y = 0.3; g.shell!.position.y = e.open > 0 ? 4.2 : 0.4; }
      });

      // Scope Creep: stretches as it leaps, squashes on landing, flashes white when angry.
      boss.visible = !!f.boss;
      if (f.boss) {
        const sq = squash(bossSquash, f.boss.ground && lastBossVy > 50, f.boss.ground, f.boss.vy, dt);
        bossSquash = sq.s;
        lastBossVy = f.boss.ground ? 0 : f.boss.vy;
        boss.scale.set(2 - sq.y, sq.y, 1);
        boss.position.set(X(f.boss.x + 8), Y(f.boss.y + 13), Z);
        boss.rotation.y = -0.35;
        bossArmor.emissiveIntensity = f.boss.hit ? 0.7 : 0;
        tip.visible = Math.floor(t * 3) % 2 === 0;
      }

      if (crosses.length !== f.health.length) {
        crosses.forEach((c) => scene.remove(c));
        crosses = f.health.map(() => { const g = new THREE.Group(); g.add(rbox(4.2, 1.5, 1.5, crossMat, 0.4), rbox(1.5, 4.2, 1.5, crossMat, 0.4)); scene.add(g); return g; });
      }
      crosses.forEach((c, i) => { const h = f.health[i]; c.visible = h.on; c.position.set(X(h.x + 2), Y(h.y + 2) + Math.sin(t * 3 + i) * 0.5, Z); c.rotation.y = t * 2; });
      crossMat.emissiveIntensity = 1 + Math.sin(t * 8) * 0.4;

      let a = 0, b = 0, c = 0;
      for (const s of f.shots) {
        if (s.big && c < MAX) bigShots.setMatrixAt(c++, m4.compose(v.set(X(s.x + 3), Y(s.y + 3), Z), q, sc.setScalar(1 + Math.sin(t * 30) * 0.12)));
        else if (s.foe && b < MAX) foeShots.setMatrixAt(b++, m4.compose(v.set(X(s.x + 1.5), Y(s.y + 1), Z), q, sc.setScalar(1)));
        else if (!s.big && !s.foe && a < MAX) pellets.setMatrixAt(a++, m4.compose(v.set(X(s.x + 1.5), Y(s.y + 1), Z), zRot, sc.setScalar(1)));
      }
      sc.setScalar(1);
      pellets.count = a; foeShots.count = b; bigShots.count = c;
      pellets.instanceMatrix.needsUpdate = foeShots.instanceMatrix.needsUpdate = bigShots.instanceMatrix.needsUpdate = true;

      const n = Math.min(f.sparks.length, sparks.max);
      for (let i = 0; i < n; i++) { const s = f.sparks[i]; sparks.set(i, X(s.x), Y(s.y), Z + 2, s.color, Math.min(1, s.life * 2) * 2.2); }
      sparks.commit(n);

      st.render(dt);
    },
    dispose: () => { disposed = true; st.dispose(...textures); },
  };
}
