// Sprint Fighter's 3D view: a glossy rooftop at sunset over a lit city, a cheering crowd, two jointed fighters
// posed from the game's own pose angles (blended smoothly), energy balls, and a camera that frames the fight.
// The game still plays on its 192 × 120 grid (components/SprintFighter); this only draws it.
import type * as T from "three";
import { stage } from "./arcade3d";
import { POSES, PO, SH, poseName, lerpPose, framing, type Look, type Pose } from "./fighterMotion";
import { buildFighter, type Rig } from "./fighterModel";

export type FighterFrame = {
  t: number; dt: number; shake: number; pause: number; halloween: boolean; christmas: boolean;
  state: "intro" | "fight" | "ko" | "end"; stateT: number;
  fighters: { x: number; y: number; face: number; act: string; actT: number; low: boolean; look: Look }[];
  balls: { x: number; y: number; vx: number; mine: boolean; big: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
};
export type FighterView = { draw(f: FighterFrame): void; dispose(): void };

export async function mountFighter(canvas: HTMLCanvasElement, W: number, H: number, GROUND: number, f0Season: { halloween: boolean; christmas: boolean }, onLost?: () => void): Promise<FighterView> {
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
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 240, 140), new THREE.MeshPhysicalMaterial({ map: seams, color: 0x8f5ed6, envMapIntensity: 0.15, roughness: 0.35, metalness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.12 }));
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

  // The fighters (lib/fighterModel): The PO in a gi, The Stakeholder in a suit, jointed to the game's poses.
  type Fighter = Rig & { cur: Pose; wasAir: boolean; lying: number };
  const rigs: Fighter[] = [PO, SH].map((look) => {
    const r = buildFighter(THREE, look, look === PO, st.shadows);
    scene.add(r.root);
    return { ...r, cur: POSES.idle, wasAir: false, lying: 0 };
  });

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

  // Each ball leaves a trail of fading sparks; a big one also carries a lens flare.
  const trail = st.sparks(200, 2.4);
  const trailPts: { x: number; y: number; c: string; life: number }[] = [];
  const flareTex = paint(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.2, "rgba(255,255,255,0.35)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(0, 62, 128, 4); // the streak
  });
  const flares = balls.map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: flareTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: new THREE.Color(2, 2, 2) }));
    m.visible = false; scene.add(m); return m;
  });

  // Dust rings where a fighter lands.
  const rings = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.3, 8, 40), new THREE.MeshBasicMaterial({ color: 0xd8c8e8, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.visible = false; scene.add(m); return { m, age: 99 };
  });

  // Seasons: a Halloween moon and cape, a Christmas hat for The PO.
  if (f0Season.halloween) {
    skyMat.uniforms.top.value.set("#07041a"); skyMat.uniforms.mid.value.set("#3b1a5a"); skyMat.uniforms.bot.value.set("#ff8c1a");
    sunDisc.material = glowMat(hot("#f3f0d0", 1.6)); sunDisc.position.set(W / 2 + 60, -30, -400); sunStripes.visible = false;
    const capeMat = new THREE.MeshStandardMaterial({ color: 0x2a0a1a, side: THREE.DoubleSide, roughness: 0.6 }); rigs[1].mats.push(capeMat);
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(6, 18), capeMat);
    cape.position.set(-2.4, 2, 0); cape.rotation.y = Math.PI / 2; rigs[1].torso.add(cape);
  }
  if (f0Season.christmas) {
    const hat = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.7 }), white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    rigs[0].mats.push(red, white);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5, 16), red);
    const brim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.6, 8, 20), white);
    cone.position.y = 3.6; brim.rotation.x = Math.PI / 2; brim.position.y = 1.3; hat.add(cone, brim); rigs[0].head.add(hat);
  }

  const cam = { x: W / 2, y: -H / 2, zoom: 1, orbit: 0 };
  let lastNow = performance.now(), cloth = 0; // wall clock for the camera (hit-stop zeroes dt), cloth clock for the waves
  return {
    draw(f) {
      const { t } = f, dt = Math.max(f.dt, 0);
      const now = performance.now(), wall = Math.min(0.05, (now - lastNow) / 1000); lastNow = now;
      cloth += dt;
      // Fighters: blend toward the pose the game shows; freeze during hit-stop; lie flat on a KO.
      f.fighters.forEach((s, i) => {
        const r = rigs[i];
        const target = POSES[s.act === "ko" && s.y === 0 ? "hit" : poseName(s, t)] ?? POSES.idle;
        r.cur = lerpPose(r.cur, target, f.pause > 0 ? 0 : 1 - Math.exp(-20 * dt));
        r.pose(r.cur);
        r.wave(cloth, Math.min(150, Math.abs(s.x - (r.root.position.x || s.x)) / Math.max(dt, 1 / 60))); // clamped: a round reset teleports
        r.lying += ((s.act === "ko" && s.y === 0 ? 1 : 0) - r.lying) * Math.min(1, dt * 10);
        r.root.position.set(X(s.x), Y(GROUND + s.y) + r.lying * 2.4, 0);
        r.root.scale.x = s.face;
        r.root.rotation.set(0, -0.35 * s.face, s.face * (Math.PI / 2) * r.lying);
        const flash = s.act === "hit" && Math.floor(t * 20) % 2 ? 0.3 : 0;
        for (const m of r.mats) { m.emissive.set(0xff3b3b); m.emissiveIntensity = flash; }
      });

      balls.forEach((o, i) => {
        const b = f.balls[i];
        o.g.visible = flares[i].visible = !!b;
        if (!b) return;
        const c = b.mine ? "#5fd0ff" : "#ff7ac6";
        o.core.color.copy(ballCore); o.halo.color.copy(b.mine ? ballMine : ballTheirs);
        o.g.position.set(X(b.x), Y(b.y), 2);
        o.g.scale.setScalar((b.big ? 1.7 : 1) * (1 + Math.sin(t * 30 + i) * 0.08));
        if (dt > 0) trailPts.push({ x: X(b.x) - Math.sign(b.vx) * 2, y: Y(b.y) + (Math.random() - 0.5) * 2, c, life: 0.35 });
        flares[i].visible = b.big;
        flares[i].position.set(X(b.x), Y(b.y), 3); flares[i].rotation.z = t * 2;
      });
      for (const p of trailPts) p.life -= dt;
      while (trailPts.length && trailPts[0].life <= 0) trailPts.shift();
      const tn = Math.min(trailPts.length, trail.max);
      for (let i = 0; i < tn; i++) { const p = trailPts[trailPts.length - 1 - i]; trail.set(i, p.x, p.y, 1.5, p.c, p.life * 5); }
      trail.commit(tn);

      f.fighters.forEach((s, i) => {
        const r = rigs[i], air = s.y < 0;
        if (r.wasAir && !air && s.act !== "ko") { const ring = rings.reduce((a, b) => (a.age > b.age ? a : b)); ring.age = 0; ring.m.position.set(X(s.x), Y(GROUND) + 0.3, 0); ring.m.visible = true; }
        r.wasAir = air;
      });
      for (const ring of rings) {
        if (!ring.m.visible) continue;
        ring.age += dt; const k2 = Math.min(1, ring.age / 0.5);
        ring.m.scale.setScalar(1 + k2 * 9); (ring.m.material as T.MeshBasicMaterial).opacity = (1 - k2) * 0.55;
        if (k2 >= 1) ring.m.visible = false;
      }

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
      // A lying fighter extends ~25 behind its feet; on a KO the view may run past the arena edge (the floor goes on).
      const lying = f.fighters.flatMap((s, i) => (rigs[i].lying > 0.1 ? [s.x - s.face * 25 * rigs[i].lying] : []));
      let fr = st.calm ? { x: W / 2, y: -H / 2, zoom: 1 } : framing(me.x, cpu.x, W, H, lying, f.state === "ko" ? 30 : 0);
      if (!st.calm && f.state === "intro") fr = { ...fr, zoom: fr.zoom * (1 - Math.min(1, Math.max(0, f.stateT - 1)) * 0.12) }; // starts wide, settles in
      if (!st.calm && f.pause > 0) fr = { ...fr, zoom: fr.zoom * 1.04 }; // a punch-in on every hit-stop
      const k = Math.min(1, Math.max(wall, 1 / 120) * 4);
      cam.x += (fr.x - cam.x) * k; cam.y += (fr.y - cam.y) * k; cam.zoom += (fr.zoom - cam.zoom) * k;
      const sx = f.shake > 0 ? (Math.random() - 0.5) * 3 : 0, sy = f.shake > 0 ? (Math.random() - 0.5) * 2 : 0;
      // On a KO the camera circles the fight's midpoint a little; reduced motion keeps it still.
      const loser = f.fighters.find((s) => s.act === "ko");
      const target = !st.calm && loser && (f.state === "ko" || f.state === "end") ? Math.min(0.25, (3 - f.stateT) * 0.1) : 0;
      const orbit = (cam.orbit += (f.state === "end" ? 0 : target - cam.orbit) * k);
      const dist = D / cam.zoom;
      const px = orbit ? cam.x + Math.sin(orbit) * dist : cam.x + sx, pz = orbit ? Math.cos(orbit) * dist : dist;
      camera.position.set(px, cam.y + sy, pz);
      camera.lookAt(orbit ? cam.x : cam.x + sx, cam.y + sy, 0);

      st.render(dt);
    },
    dispose: () => st.dispose(...textures),
  };
}
