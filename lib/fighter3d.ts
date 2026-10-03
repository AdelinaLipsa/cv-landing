// Sprint Fighter's 3D view: a glossy rooftop at sunset over a lit city, a cheering crowd, two jointed fighters
// posed from the game's own pose angles (blended smoothly), energy balls, and a camera that frames the fight.
// The game still plays on its 192 × 120 grid (components/SprintFighter); this only draws it.
import type * as T from "three";
import { stage } from "./arcade3d";
import { POSES, PO, SH, poseName, lerpPose, framing, type Look, type Pose } from "./fighterMotion";

export type FighterFrame = {
  t: number; dt: number; shake: number; pause: number; halloween: boolean; christmas: boolean;
  state: "intro" | "fight" | "ko" | "end"; stateT: number;
  fighters: { x: number; y: number; face: number; act: string; actT: number; low: boolean; look: Look }[];
  balls: { x: number; y: number; vx: number; mine: boolean; big: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
};
export type FighterView = { draw(f: FighterFrame): void; dispose(): void };

export async function mountFighter(canvas: HTMLCanvasElement, W: number, H: number, GROUND: number, onLost?: () => void): Promise<FighterView> {
  const st = await stage(canvas, W, H, { shadows: true, env: 0.5, onLost });
  const { THREE, scene, camera, D, hot, glowMat } = st;
  const X = (x: number) => x, Y = (y: number) => -y;
  const textures: T.Texture[] = [];
  const paint = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; textures.push(tex); return tex;
  };

  // Light: a low sun behind the city rims the fighters; a soft key from the front keeps them readable.
  scene.add(new THREE.HemisphereLight(0xc8b0ff, 0x2a1640, 0.9));
  const sunLight = new THREE.DirectionalLight(0xffa860, 2.4); sunLight.position.set(W / 2 + 30, -60, -300);
  const key = new THREE.DirectionalLight(0xfff0e0, 1.7);
  key.position.set(W / 2 - 70, 40, 170); key.target.position.set(W / 2, -GROUND, 0);
  key.castShadow = st.shadows; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -130, right: 130, top: 90, bottom: -90, near: 1, far: 500 });
  key.shadow.bias = -0.001;
  scene.add(sunLight, key, key.target);

  // The sky: a gradient dome on a far plane, sunset (or Halloween night), with the sun (or moon) on it.
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color("#1b1040") }, mid: { value: new THREE.Color("#b8335f") }, bot: { value: new THREE.Color("#F5B53F") } },
    depthWrite: false,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec2 vUv; uniform vec3 top, mid, bot;
      void main() { float y = vUv.y; vec3 c = y > 0.45 ? mix(mid, top, smoothstep(0.45, 1.0, y)) : mix(bot, mid, smoothstep(0.2, 0.45, y));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(900, 520), skyMat);
  sky.position.set(W / 2, -H / 2 + 40, -420);
  scene.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(30, 48), glowMat(hot("#ffd27a", 2.2)));
  sunDisc.position.set(W / 2, -GROUND + 8, -400);
  scene.add(sunDisc);
  const sunStripes = new THREE.Group(); // the retro sun's stripes, as dark bands across the disc
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(64, 1.6 + i * 0.5), new THREE.MeshBasicMaterial({ color: 0xb8335f })); b.position.set(0, -6 - i * 4.5, 0.1); sunStripes.add(b); }
  sunStripes.position.copy(sunDisc.position);
  scene.add(sunStripes);

  // The skyline: buildings at several depths with lit windows.
  const windows = paint(64, 128, (g) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 128; y += 10) for (let x = 5; x < 64; x += 10) if (Math.random() < 0.38) { g.fillStyle = Math.random() < 0.8 ? "#ffd27a" : "#9fd0ff"; g.fillRect(x, y, 5, 6); }
  });
  windows.wrapS = windows.wrapT = THREE.RepeatWrapping;
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x2a1640, roughness: 0.8, metalness: 0.2, emissive: 0xffffff, emissiveMap: windows, emissiveIntensity: 1.3 });
  const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), towerMat, 46);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < 46; i++) {
    const z = -260 - (i % 3) * 70, w = 14 + ((i * 13) % 16), h = 18 + ((i * 37) % 48);
    towers.setMatrixAt(i, m4.compose(v.set(-260 + i * 17 + ((i * 7) % 9), Y(GROUND) - 30 + h / 2, z), q, sc.set(w, h, 14)));
  }
  scene.add(towers);

  // The roof: glossy, reflective, with seams; the railing; the crowd behind it.
  const seams = paint(256, 64, (g) => {
    g.fillStyle = "#4b2f66"; g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#5c3a7d"; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 2, 64);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(Math.random() * 256, Math.random() * 64, 1, 1); }
  });
  seams.wrapS = seams.wrapT = THREE.RepeatWrapping; seams.repeat.set(4, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 240, 140), new THREE.MeshPhysicalMaterial({ map: seams, color: 0xb08ad8, envMapIntensity: 0.35, roughness: 0.35, metalness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, Y(GROUND), -30); floor.receiveShadow = true;
  scene.add(floor);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(W + 240, 1.6, 1.2), new THREE.MeshStandardMaterial({ color: 0x3a2350, metalness: 0.8, roughness: 0.35 }));
  rail.position.set(W / 2, Y(GROUND) + 10, -24);
  scene.add(rail);
  const CROWD = 40;
  const crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(1.5, 3.2, 4, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), CROWD);
  const crowdCol = ["#2a1f4f", "#33255e", "#241a45"].map((c) => new THREE.Color(c));
  for (let i = 0; i < CROWD; i++) crowd.setColorAt(i, crowdCol[i % 3]);
  scene.add(crowd);

  // A jointed fighter: hips → torso → shoulders → arms, hips → legs; head on the torso. Built facing +x.
  // Pivots point down; rotation.z = angle reproduces Retro's "from straight down, + forward" angles.
  const tint = (hex: string, rough = 0.75) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(hex) });
  type Rig = {
    root: T.Group; hips: T.Group; torso: T.Group; head: T.Group; mats: T.MeshPhysicalMaterial[];
    arms: { sh: T.Group; el: T.Group }[]; legs: { hip: T.Group; knee: T.Group }[];
    pose: Pose; wasAir: boolean; lying: number;
  };
  const capsule = (r: number, len: number, mat: T.Material) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat); m.castShadow = st.shadows; return m; };
  const segment = (r: number, len: number, mat: T.Material) => { const g = new THREE.Group(); const m = capsule(r, len - r, mat); m.position.y = -len / 2; g.add(m); return g; };
  const makeFighter = (look: Look): Rig => {
    const skin = tint(look.skin, 0.55), top = tint(look.top), sleeve = tint(look.sleeve), legs = tint(look.legs), hair = tint(look.hair, 0.9);
    const extra = new THREE.MeshPhysicalMaterial({ color: look.extra, roughness: 0.5 });
    const root = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
    hips.position.y = 13; root.add(hips); hips.add(torso);
    const chest = capsule(2.7, 5.5, top); chest.scale.set(1, 1, 0.75); chest.position.y = 5; torso.add(chest);
    head.position.y = 12.5; torso.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 18), skin); skull.castShadow = st.shadows;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.75, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), hair); cap.rotation.z = 0.35;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0x17153a })); eye.position.set(2.35, 0.3, 0.9);
    head.add(skull, cap, eye);
    if (look === PO) { const band = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.35, 8, 24), extra); band.rotation.x = Math.PI / 2; band.position.y = 0.6; head.add(band); }
    else { const tie = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 0.4), extra); tie.position.set(2.2, 7.5, 0); torso.add(tie); }
    const arm = (z: number) => {
      const sh = new THREE.Group(); sh.position.set(0, 8, z); torso.add(sh);
      const upper = segment(1.1, 6, sleeve); sh.add(upper);
      const el = new THREE.Group(); el.position.y = -6; sh.add(el);
      const fore = segment(0.95, 6, skin); el.add(fore);
      const fist = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), skin); fist.position.y = -6; fist.castShadow = st.shadows; el.add(fist);
      return { sh, el };
    };
    const leg = (z: number) => {
      const hip = new THREE.Group(); hip.position.set(0, 0, z); hips.add(hip);
      hip.add(segment(1.45, 7, legs));
      const knee = new THREE.Group(); knee.position.y = -7; hip.add(knee);
      knee.add(segment(1.25, 7, legs));
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 2), new THREE.MeshStandardMaterial({ color: 0x17153a, roughness: 0.6 })); shoe.position.set(0.9, -7.2, 0); shoe.castShadow = st.shadows; knee.add(shoe);
      return { hip, knee };
    };
    // Front limbs nearer the camera (+z), drawn last in Retro; mirroring with scale.x keeps them near when facing left.
    const arms = [arm(2.6), arm(-2.6)], legsR = [leg(1.4), leg(-1.4)];
    scene.add(root);
    return { root, hips, torso, head, mats: [skin, top, sleeve, legs, hair, extra], arms, legs: legsR, pose: POSES.idle, wasAir: false, lying: 0 };
  };
  const rigs = [makeFighter(PO), makeFighter(SH)];

  const apply = (r: Rig, p: Pose) => {
    const [lean, fa, ba, fl, bl, drop] = p;
    r.hips.position.y = 13 - drop;
    r.torso.rotation.z = -lean;
    for (const [i, a] of [fa, ba].entries()) { r.arms[i].sh.rotation.z = a[0] + lean; r.arms[i].el.rotation.z = a[1] - a[0]; }
    for (const [i, l] of [fl, bl].entries()) { r.legs[i].hip.rotation.z = l[0]; r.legs[i].knee.rotation.z = l[1] - l[0]; }
  };

  // Energy balls: a hot core and a soft halo.
  const balls = Array.from({ length: 4 }, () => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), glowMat(new THREE.Color()));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(3.4, 16, 12), glowMat(new THREE.Color(), 0.35));
    g.add(core, halo); g.visible = false; scene.add(g);
    return { g, core: core.material as T.MeshBasicMaterial, halo: halo.material as T.MeshBasicMaterial };
  });
  const ballCore = hot("#ffffff", 3), ballMine = hot("#5fd0ff", 2.2), ballTheirs = hot("#ff7ac6", 2.2);
  const sparks = st.sparks(320, 1.8);

  const cam = { x: W / 2, y: -H / 2, zoom: 1 };
  return {
    draw(f) {
      const { t } = f, dt = Math.max(f.dt, 0);
      // Fighters: blend toward the pose the game shows; freeze during hit-stop; lie flat on a KO.
      f.fighters.forEach((s, i) => {
        const r = rigs[i];
        const target = POSES[s.act === "ko" && s.y === 0 ? "hit" : poseName(s, t)] ?? POSES.idle;
        r.pose = lerpPose(r.pose, target, f.pause > 0 ? 0 : Math.min(1, dt * 20));
        apply(r, r.pose);
        r.lying += ((s.act === "ko" && s.y === 0 ? 1 : 0) - r.lying) * Math.min(1, dt * 10);
        r.root.position.set(X(s.x), Y(GROUND + s.y) + r.lying * 2.4, 0);
        r.root.scale.x = s.face;
        r.root.rotation.set(0, -0.35 * s.face, s.face * (Math.PI / 2) * r.lying);
        const flash = s.act === "hit" && Math.floor(t * 20) % 2 ? 0.6 : 0;
        for (const m of r.mats) { m.emissive.set(0xff3b3b); m.emissiveIntensity = flash; }
      });

      balls.forEach((o, i) => {
        const b = f.balls[i];
        o.g.visible = !!b;
        if (!b) return;
        o.core.color.copy(ballCore); o.halo.color.copy(b.mine ? ballMine : ballTheirs);
        o.g.position.set(X(b.x), Y(b.y), 2);
        o.g.scale.setScalar((b.big ? 1.7 : 1) * (1 + Math.sin(t * 30 + i) * 0.08));
      });

      const n = Math.min(f.sparks.length, sparks.max);
      for (let i = 0; i < n; i++) { const s = f.sparks[i]; sparks.set(i, X(s.x), Y(s.y), 4, s.color, Math.min(1, s.life * 3) * 2.4); }
      sparks.commit(n);

      // The crowd bobs, harder on a KO.
      for (let i = 0; i < CROWD; i++) {
        const h = 1 + ((i * 7) % 4) * 0.12, bob = Math.sin(t * 6 + i * 0.7) * (f.state === "ko" ? 1.6 : 0.7);
        crowd.setMatrixAt(i, m4.compose(v.set(-10 + i * 5.4, Y(GROUND) + 9.5 + bob, -30 - (i % 3) * 3), q, sc.set(1, h, 1)));
      }
      crowd.instanceMatrix.needsUpdate = true;

      // Camera: frame the fight. Reduced motion: no zoom changes.
      const me = f.fighters[0], cpu = f.fighters[1];
      const fr = st.calm ? { x: W / 2, y: -H / 2, zoom: 1 } : framing(me.x, cpu.x, W, H);
      const k = Math.min(1, dt * 4);
      cam.x += (fr.x - cam.x) * k; cam.y += (fr.y - cam.y) * k; cam.zoom += (fr.zoom - cam.zoom) * k;
      const sx = f.shake > 0 ? (Math.random() - 0.5) * 3 : 0, sy = f.shake > 0 ? (Math.random() - 0.5) * 2 : 0;
      camera.position.set(cam.x + sx, cam.y + sy, D / cam.zoom);
      camera.lookAt(cam.x + sx, cam.y + sy, 0);

      st.render(dt);
    },
    dispose: () => st.dispose(...textures),
  };
}
